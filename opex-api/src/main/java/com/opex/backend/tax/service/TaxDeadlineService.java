package com.opex.backend.tax.service;

import com.opex.backend.tax.dto.TaxBufferDashboardResponse;
import com.opex.backend.tax.model.Tax;
import com.opex.backend.user.model.User;
import com.opex.backend.tax.repository.TaxRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaxDeadlineService {

    private final TaxRepository taxRepository;

    public List<TaxBufferDashboardResponse.TaxDeadlineItem> getTaxDeadlines(String userId, User user, int targetYear, int limit) {
        int safeLimit = Math.max(limit, 1);
        TaxUserContext userContext = new TaxUserContext(user);

        return buildMergedDeadlines(userId, userContext, targetYear).stream()
                .sorted(TaxDeadlineSupport.deadlineComparator())
                .limit(safeLimit)
                .collect(Collectors.toList());
    }

    private List<TaxBufferDashboardResponse.TaxDeadlineItem> buildMergedDeadlines(String userId,
                                                                                  TaxUserContext userContext,
                                                                                  int targetYear) {
        Map<String, TaxBufferDashboardResponse.TaxDeadlineItem> deadlines = new LinkedHashMap<>();

        buildGeneratedDeadlines(userContext, targetYear)
                .forEach(item -> deadlines.put(TaxDeadlineSupport.resolveDeadlineIdentity(item), item));

        taxRepository.findByUserIdOrderByDeadlineAsc(userId).stream()
                .filter(tax -> tax.getDeadline() != null)
                .filter(tax -> tax.getDeadline().getYear() == targetYear)
                .map(this::toStoredDeadlineItem)
                .forEach(item -> deadlines.put(TaxDeadlineSupport.resolveDeadlineIdentity(item), item));

        return new ArrayList<>(deadlines.values());
    }

    private List<TaxBufferDashboardResponse.TaxDeadlineItem> buildGeneratedDeadlines(TaxUserContext userContext,
                                                                                     int targetYear) {
        List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines = new ArrayList<>();

        if (userContext.isDutchResidence()) {
            addDutchVatDeadlines(deadlines, userContext, targetYear);
            addDutchIncomeTaxDeadlines(deadlines, targetYear);
        }

        return deadlines;
    }

    private void addDutchVatDeadlines(List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines,
                                      TaxUserContext userContext,
                                      int targetYear) {
        String vatFrequency = userContext.normalizedVatFrequency();
        if ("monthly".equals(vatFrequency)) {
            String[] monthLabels = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
            for (int month = 1; month <= 12; month++) {
                LocalDate periodEnd = LocalDate.of(targetYear, month, 1).with(TemporalAdjusters.lastDayOfMonth());
                LocalDate dueDate = periodEnd.plusMonths(1).with(TemporalAdjusters.lastDayOfMonth());
                String periodLabel = monthLabels[month - 1] + " " + targetYear;
                deadlines.add(newGeneratedDeadline(
                        "generated-vat-" + targetYear + "-" + month,
                        "VAT return",
                        dueDate,
                        "VAT",
                        periodLabel,
                        "Submit and pay Dutch VAT for " + periodLabel + "."
                ));
            }
            return;
        }

        if ("yearly".equals(vatFrequency)) {
            deadlines.add(newGeneratedDeadline(
                    "generated-vat-yearly-" + targetYear,
                    "Annual VAT return",
                    LocalDate.of(targetYear + 1, 3, 31),
                    "VAT",
                    String.valueOf(targetYear),
                    "Submit the annual Dutch VAT return for " + targetYear + "."
            ));
            return;
        }

        deadlines.add(newGeneratedDeadline(
                "generated-vat-q4-" + (targetYear - 1),
                "VAT return",
                LocalDate.of(targetYear, 1, 31),
                "VAT",
                "Q4 " + (targetYear - 1),
                "Submit and pay Dutch VAT for Q4 " + (targetYear - 1) + "."
        ));
        deadlines.add(newGeneratedDeadline(
                "generated-vat-q1-" + targetYear,
                "VAT return",
                LocalDate.of(targetYear, 4, 30),
                "VAT",
                "Q1 " + targetYear,
                "Submit and pay Dutch VAT for Q1 " + targetYear + "."
        ));
        deadlines.add(newGeneratedDeadline(
                "generated-vat-q2-" + targetYear,
                "VAT return",
                LocalDate.of(targetYear, 7, 31),
                "VAT",
                "Q2 " + targetYear,
                "Submit and pay Dutch VAT for Q2 " + targetYear + "."
        ));
        deadlines.add(newGeneratedDeadline(
                "generated-vat-q3-" + targetYear,
                "VAT return",
                LocalDate.of(targetYear, 10, 31),
                "VAT",
                "Q3 " + targetYear,
                "Submit and pay Dutch VAT for Q3 " + targetYear + "."
        ));
        deadlines.add(newGeneratedDeadline(
                "generated-vat-q4-" + targetYear,
                "VAT return",
                LocalDate.of(targetYear + 1, 1, 31),
                "VAT",
                "Q4 " + targetYear,
                "Submit and pay Dutch VAT for Q4 " + targetYear + "."
        ));
    }

    private void addDutchIncomeTaxDeadlines(List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines, int targetYear) {
        String periodLabel = String.valueOf(targetYear - 1);
        LocalDate dueDate = LocalDate.of(targetYear, 5, 1);

        deadlines.add(newGeneratedDeadline(
                "generated-income-tax-return-" + targetYear,
                "Income tax return",
                dueDate,
                "Income Tax",
                periodLabel,
                "File the Dutch income tax return for fiscal year " + periodLabel + "."
        ));
        deadlines.add(newGeneratedDeadline(
                "generated-income-tax-postponement-" + targetYear,
                "Income tax postponement request",
                dueDate,
                "Income Tax",
                periodLabel,
                "Request a postponement if the annual Dutch income tax return for " + periodLabel + " cannot be filed in time."
        ));
    }

    private TaxBufferDashboardResponse.TaxDeadlineItem newGeneratedDeadline(String id,
                                                                            String title,
                                                                            LocalDate dueDate,
                                                                            String category,
                                                                            String periodLabel,
                                                                            String description) {
        return new TaxBufferDashboardResponse.TaxDeadlineItem(
                id,
                title,
                dueDate,
                TaxDeadlineSupport.resolveDeadlineStatus(null, dueDate),
                TaxMath.money(BigDecimal.ZERO),
                TaxMath.DEFAULT_CURRENCY,
                category,
                periodLabel,
                description,
                true
        );
    }

    private TaxBufferDashboardResponse.TaxDeadlineItem toStoredDeadlineItem(Tax tax) {
        return new TaxBufferDashboardResponse.TaxDeadlineItem(
                tax.getId(),
                Optional.ofNullable(tax.getName()).filter(name -> !name.isBlank()).orElse("Tax deadline"),
                tax.getDeadline(),
                TaxDeadlineSupport.resolveDeadlineStatus(tax.getStatus(), tax.getDeadline()),
                TaxMath.money(Optional.ofNullable(tax.getAmount()).orElse(BigDecimal.ZERO).abs()),
                Optional.ofNullable(tax.getCurrency()).filter(currency -> !currency.isBlank()).orElse(TaxMath.DEFAULT_CURRENCY),
                resolveTaxCategory(tax),
                null,
                null,
                false
        );
    }

    private String resolveTaxCategory(Tax tax) {
        String name = Optional.ofNullable(tax.getName()).orElse("").toLowerCase(Locale.ROOT);
        if (containsAnyKeyword(name, List.of("vat", "iva", "btw", "tva", "mwst"))) {
            return "VAT";
        }
        if (containsAnyKeyword(name, List.of("income", "irpef"))) {
            return "Income Tax";
        }
        if (containsAnyKeyword(name, List.of("social", "contribut", "inps"))) {
            return "Social";
        }
        return Boolean.TRUE.equals(tax.getIsExternal()) ? "Imported" : "Manual";
    }

    private boolean containsAnyKeyword(String source, List<String> keywords) {
        if (source == null) {
            return false;
        }

        String normalized = source.toLowerCase(Locale.ROOT);
        for (String keyword : keywords) {
            if (normalized.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
