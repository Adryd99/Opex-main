package com.opex.backend.tax.service;

import com.opex.backend.banking.model.Transaction;
import com.opex.backend.tax.dto.TaxBufferDashboardResponse;
import com.opex.backend.tax.model.Tax;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class TaxBufferActivityService {

    private final TaxProviderScopeService taxProviderScopeService;

    public List<TaxBufferDashboardResponse.BufferActivityItem> getBufferActivity(String userId,
                                                                                 String connectionId,
                                                                                 Integer year,
                                                                                 int limit) {
        int targetYear = taxProviderScopeService.resolveYear(year);
        int safeLimit = Math.max(limit, 1);
        taxProviderScopeService.validateConnectionOwnership(userId, connectionId);

        List<Transaction> yearlyTransactions = taxProviderScopeService.getYearlyTransactions(userId, connectionId, targetYear);
        List<Tax> yearlyTaxes = taxProviderScopeService.getTaxesForYear(userId, targetYear);

        List<TaxBufferDashboardResponse.BufferActivityItem> transactionEvents = yearlyTransactions.stream()
                .filter(transaction -> transaction.getBookingDate() != null)
                .map(this::toTransactionActivityItem)
                .collect(Collectors.toList());

        List<TaxBufferDashboardResponse.BufferActivityItem> paidTaxEvents = yearlyTaxes.stream()
                .filter(tax -> TaxDeadlineSupport.isPaidStatus(tax.getStatus()))
                .filter(tax -> tax.getDeadline() != null)
                .map(this::toPaidTaxActivityItem)
                .collect(Collectors.toList());

        return Stream.concat(transactionEvents.stream(), paidTaxEvents.stream())
                .sorted(Comparator.comparing(
                        TaxBufferDashboardResponse.BufferActivityItem::getDate,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .limit(safeLimit)
                .collect(Collectors.toList());
    }

    private TaxBufferDashboardResponse.BufferActivityItem toTransactionActivityItem(Transaction transaction) {
        BigDecimal amount = TaxMath.money(Optional.ofNullable(transaction.getAmount()).orElse(BigDecimal.ZERO));
        return new TaxBufferDashboardResponse.BufferActivityItem(
                "txn_" + transaction.getId(),
                resolveActivityTitle(transaction),
                transaction.getBookingDate(),
                amount,
                amount.compareTo(BigDecimal.ZERO) >= 0 ? "IN" : "OUT"
        );
    }

    private TaxBufferDashboardResponse.BufferActivityItem toPaidTaxActivityItem(Tax tax) {
        return new TaxBufferDashboardResponse.BufferActivityItem(
                "tax_" + tax.getId(),
                "Tax Payment: " + Optional.ofNullable(tax.getName()).orElse("Tax"),
                tax.getDeadline(),
                TaxMath.money(Optional.ofNullable(tax.getAmount()).orElse(BigDecimal.ZERO).abs().negate()),
                "OUT"
        );
    }

    private String resolveActivityTitle(Transaction transaction) {
        String blob = (Optional.ofNullable(transaction.getCategory()).orElse("") + " "
                + Optional.ofNullable(transaction.getDescription()).orElse("")).toLowerCase(Locale.ROOT);

        if (blob.contains("salary") || blob.contains("stipend")) {
            return "Monthly Automatic Save";
        }
        if (blob.contains("top-up") || blob.contains("top up") || blob.contains("ricarica")) {
            return "Manual Buffer Top-up";
        }
        if (blob.contains("vat") || blob.contains("iva")) {
            return "VAT Payment";
        }
        if (blob.contains("tax") || blob.contains("f24") || blob.contains("imposta")) {
            return "Tax Payment";
        }
        return "Buffer Adjustment";
    }
}
