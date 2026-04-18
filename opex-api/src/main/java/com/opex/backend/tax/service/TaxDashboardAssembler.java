package com.opex.backend.tax.service;

import com.opex.backend.tax.dto.TaxBufferDashboardResponse;
import com.opex.backend.tax.service.support.TaxBufferComputation;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Component
public class TaxDashboardAssembler {

    public TaxBufferDashboardResponse assemble(String connectionId,
                                               int targetYear,
                                               String currency,
                                               TaxUserContext userContext,
                                               TaxBufferComputation computation,
                                               List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines,
                                               List<TaxBufferDashboardResponse.BufferActivityItem> activity,
                                               List<TaxBufferDashboardResponse.ProviderItem> providers) {
        TaxBufferDashboardResponse.Summary summary = new TaxBufferDashboardResponse.Summary(
                computation.shouldSetAside(),
                computation.alreadySaved(),
                computation.missing(),
                computation.completionPercentage(),
                computation.weeklyTarget(),
                computation.safeToSpend(),
                LocalDate.of(targetYear, 12, 31)
        );

        TaxBufferDashboardResponse.IncomeSocialBreakdown incomeSocial = new TaxBufferDashboardResponse.IncomeSocialBreakdown(
                computation.taxableIncome(),
                computation.incomeTax(),
                computation.socialContributions(),
                computation.subtotal()
        );

        TaxBufferDashboardResponse.VatBreakdown vat = new TaxBufferDashboardResponse.VatBreakdown(
                userContext.resolveVatRegimeLabel(),
                userContext.resolveVatRate(),
                computation.vatLiability(),
                userContext.resolveVatWarning(computation.grossIncome())
        );

        List<TaxBufferDashboardResponse.LiabilityItem> liabilitySplit = List.of(
                toLiabilityItem("VAT", computation.vatLiability(), computation.shouldSetAside()),
                toLiabilityItem("Income Tax", computation.incomeTax(), computation.shouldSetAside()),
                toLiabilityItem("Social Contributions", computation.socialContributions(), computation.shouldSetAside())
        );

        return new TaxBufferDashboardResponse(
                isBlank(connectionId) ? null : connectionId,
                targetYear,
                currency,
                summary,
                incomeSocial,
                vat,
                liabilitySplit,
                deadlines,
                activity,
                providers,
                buildSafeMode(computation.missing(), deadlines, targetYear)
        );
    }

    private TaxBufferDashboardResponse.LiabilityItem toLiabilityItem(String label, BigDecimal amount, BigDecimal total) {
        BigDecimal normalizedAmount = TaxMath.money(amount);
        return new TaxBufferDashboardResponse.LiabilityItem(label, normalizedAmount, TaxMath.percentage(normalizedAmount, total));
    }

    private TaxBufferDashboardResponse.SafeMode buildSafeMode(BigDecimal missing,
                                                              List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines,
                                                              int year) {
        long overdueDeadlines = deadlines.stream()
                .filter(item -> Optional.ofNullable(item.getStatus()).orElse("").toLowerCase(Locale.ROOT).contains("overdue"))
                .count();

        if (overdueDeadlines > 0) {
            return new TaxBufferDashboardResponse.SafeMode(
                    false,
                    "You have overdue tax deadlines.",
                    "Prioritize overdue liabilities before moving more cash to discretionary spending."
            );
        }

        if (missing.compareTo(BigDecimal.ZERO) > 0) {
            return new TaxBufferDashboardResponse.SafeMode(
                    false,
                    "Current buffer is below the estimated target for " + year + ".",
                    "Increase weekly saves until the missing amount reaches zero."
            );
        }

        return new TaxBufferDashboardResponse.SafeMode(
                true,
                "Your buffer is aligned with the estimated liabilities for " + year + ".",
                "Keep the current saving rhythm and review again after new income lands."
        );
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
