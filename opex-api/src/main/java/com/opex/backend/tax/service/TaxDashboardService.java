package com.opex.backend.tax.service;

import com.opex.backend.tax.dto.TaxBufferDashboardResponse;
import com.opex.backend.tax.model.Tax;
import com.opex.backend.banking.model.Transaction;
import com.opex.backend.tax.service.support.TaxBufferComputation;
import com.opex.backend.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaxDashboardService {

    private final TaxProviderScopeService taxProviderScopeService;
    private final TaxBufferActivityService taxBufferActivityService;
    private final TaxBufferComputationService taxBufferComputationService;
    private final TaxDashboardAssembler taxDashboardAssembler;
    private final TaxDeadlineService taxDeadlineService;

    public TaxBufferDashboardResponse getTaxBufferDashboard(String userId,
                                                            String connectionId,
                                                            Integer year,
                                                            int deadlinesLimit,
                                                            int activityLimit) {
        int targetYear = taxProviderScopeService.resolveYear(year);
        taxProviderScopeService.validateConnectionOwnership(userId, connectionId);

        User user = taxProviderScopeService.resolveUser(userId);
        TaxUserContext userContext = new TaxUserContext(user);
        List<Transaction> yearlyTransactions = taxProviderScopeService.getYearlyTransactions(userId, connectionId, targetYear);
        List<Tax> yearlyTaxes = taxProviderScopeService.getTaxesForYear(userId, targetYear);
        TaxBufferComputation computation = taxBufferComputationService.compute(userId, targetYear, user, yearlyTransactions, yearlyTaxes);

        List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines =
                taxDeadlineService.getTaxDeadlines(userId, user, targetYear, deadlinesLimit);
        List<TaxBufferDashboardResponse.BufferActivityItem> activity =
                taxBufferActivityService.getBufferActivity(userId, connectionId, targetYear, activityLimit);
        List<TaxBufferDashboardResponse.ProviderItem> providers = taxProviderScopeService.getAvailableProviders(userId);

        return taxDashboardAssembler.assemble(
                connectionId,
                targetYear,
                taxProviderScopeService.resolveCurrency(yearlyTaxes),
                userContext,
                computation,
                deadlines,
                activity,
                providers
        );
    }

    public List<TaxBufferDashboardResponse.ProviderItem> getAvailableProviders(String userId) {
        return taxProviderScopeService.getAvailableProviders(userId);
    }

    public List<TaxBufferDashboardResponse.BufferActivityItem> getBufferActivity(String userId,
                                                                                 String connectionId,
                                                                                 Integer year,
                                                                                 int limit) {
        return taxBufferActivityService.getBufferActivity(userId, connectionId, year, limit);
    }
}
