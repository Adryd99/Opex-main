package com.opex.backend.tax.service;

import com.opex.backend.tax.dto.TaxBufferDashboardResponse;
import com.opex.backend.tax.dto.TaxRequest;
import com.opex.backend.common.exception.BadRequestException;
import com.opex.backend.common.exception.ResourceNotFoundException;
import com.opex.backend.tax.model.Tax;
import com.opex.backend.user.model.User;
import com.opex.backend.tax.repository.TaxRepository;
import com.opex.backend.user.repository.UserRepository;
import com.opex.backend.tax.service.TaxCalendarExporter;
import com.opex.backend.tax.service.TaxDashboardService;
import com.opex.backend.tax.service.TaxDeadlineService;
import com.opex.backend.tax.service.TaxMath;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaxService {

    private final TaxRepository taxRepository;
    private final UserRepository userRepository;
    private final TaxDashboardService taxDashboardService;
    private final TaxDeadlineService taxDeadlineService;
    private final TaxCalendarExporter taxCalendarExporter;

    public Page<Tax> getUserTaxes(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        return taxRepository.findByUserId(userId, pageable);
    }

    public TaxBufferDashboardResponse getTaxBufferDashboard(String userId,
                                                            String connectionId,
                                                            Integer year,
                                                            int deadlinesLimit,
                                                            int activityLimit) {
        return taxDashboardService.getTaxBufferDashboard(userId, connectionId, year, deadlinesLimit, activityLimit);
    }

    public List<TaxBufferDashboardResponse.ProviderItem> getAvailableProviders(String userId) {
        return taxDashboardService.getAvailableProviders(userId);
    }

    public List<TaxBufferDashboardResponse.TaxDeadlineItem> getTaxDeadlines(String userId, Integer year, int limit) {
        return taxDeadlineService.getTaxDeadlines(userId, resolveUser(userId), resolveYear(year), limit);
    }

    public List<TaxBufferDashboardResponse.BufferActivityItem> getBufferActivity(String userId,
                                                                                 String connectionId,
                                                                                 Integer year,
                                                                                 int limit) {
        return taxDashboardService.getBufferActivity(userId, connectionId, year, limit);
    }

    public String exportCalendar(String userId, Integer year) {
        List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines =
                taxDeadlineService.getTaxDeadlines(userId, resolveUser(userId), resolveYear(year), Integer.MAX_VALUE);
        return taxCalendarExporter.exportCalendar(deadlines);
    }

    @Transactional
    public Tax createLocalTax(String userId, TaxRequest request) {
        Tax tax = new Tax();
        tax.setId("tax_local_" + UUID.randomUUID());
        tax.setUserId(userId);
        tax.setIsExternal(false);
        tax.setDeadline(request.getDeadline());
        tax.setName(request.getName());
        tax.setStatus(Optional.ofNullable(request.getStatus()).filter(value -> !value.isBlank()).orElse("PENDING"));
        tax.setAmount(TaxMath.money(Optional.ofNullable(request.getAmount()).orElse(BigDecimal.ZERO)));
        tax.setCurrency(Optional.ofNullable(request.getCurrency()).filter(value -> !value.isBlank()).orElse(TaxMath.DEFAULT_CURRENCY));
        return taxRepository.save(tax);
    }

    @Transactional
    public Tax updateLocalTax(String userId, String taxId, TaxRequest request) {
        Tax tax = taxRepository.findByIdAndUserId(taxId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tassa non trovata o non autorizzata"));

        if (Boolean.TRUE.equals(tax.getIsExternal())) {
            throw new BadRequestException("Impossibile modificare una scadenza fiscale generata da un servizio esterno.");
        }

        if (request.getDeadline() != null) {
            tax.setDeadline(request.getDeadline());
        }
        if (request.getName() != null) {
            tax.setName(request.getName());
        }
        if (request.getStatus() != null) {
            tax.setStatus(request.getStatus());
        }
        if (request.getAmount() != null) {
            tax.setAmount(TaxMath.money(request.getAmount()));
        }
        if (request.getCurrency() != null) {
            tax.setCurrency(request.getCurrency());
        }

        return taxRepository.save(tax);
    }

    @Transactional
    public void deleteLocalTax(String userId, String taxId) {
        Tax tax = taxRepository.findByIdAndUserId(taxId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tassa non trovata o non autorizzata"));

        if (Boolean.TRUE.equals(tax.getIsExternal())) {
            throw new BadRequestException("Impossibile cancellare una scadenza fiscale generata da un servizio esterno.");
        }

        taxRepository.delete(tax);
    }

    private User resolveUser(String userId) {
        return userRepository.findById(userId).orElseGet(() -> {
            User user = new User();
            user.setId(userId);
            return user;
        });
    }

    private int resolveYear(Integer year) {
        return year != null ? year : LocalDate.now().getYear();
    }
}
