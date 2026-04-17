package com.opex.backend.banking.service;

import com.opex.backend.banking.dto.MonthlyAggregation;
import com.opex.backend.banking.dto.QuarterlyAggregation;
import com.opex.backend.banking.dto.TimeAggregatedResponse;
import com.opex.backend.banking.dto.YearlyAggregation;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class BankingTimeAggregationService {

    public TimeAggregatedResponse aggregate(List<MonthlyAggregation> monthlyAggregations) {
        return new TimeAggregatedResponse(
                monthlyAggregations,
                buildQuarterlyAggregations(monthlyAggregations),
                buildYearlyAggregations(monthlyAggregations)
        );
    }

    private List<QuarterlyAggregation> buildQuarterlyAggregations(List<MonthlyAggregation> monthlyAggregations) {
        Map<String, List<MonthlyAggregation>> groupedForQuarter = monthlyAggregations.stream()
                .collect(Collectors.groupingBy(month -> month.getConnectionId() + "|" + month.getYear() + "|" + quarterOf(month)));

        return groupedForQuarter.values().stream()
                .map(this::toQuarterlyAggregation)
                .sorted(Comparator.comparing(QuarterlyAggregation::getConnectionId)
                        .thenComparingInt(QuarterlyAggregation::getYear)
                        .thenComparingInt(QuarterlyAggregation::getQuarter))
                .toList();
    }

    private List<YearlyAggregation> buildYearlyAggregations(List<MonthlyAggregation> monthlyAggregations) {
        Map<String, List<MonthlyAggregation>> groupedForYear = monthlyAggregations.stream()
                .collect(Collectors.groupingBy(month -> month.getConnectionId() + "|" + month.getYear()));

        return groupedForYear.values().stream()
                .map(this::toYearlyAggregation)
                .sorted(Comparator.comparing(YearlyAggregation::getConnectionId)
                        .thenComparingInt(YearlyAggregation::getYear))
                .toList();
    }

    private QuarterlyAggregation toQuarterlyAggregation(List<MonthlyAggregation> groupedMonths) {
        MonthlyAggregation firstMonth = groupedMonths.get(0);
        return new QuarterlyAggregation(
                firstMonth.getConnectionId(),
                firstMonth.getYear(),
                quarterOf(firstMonth),
                sum(groupedMonths, MonthlyAggregation::getTotalBalance),
                sum(groupedMonths, MonthlyAggregation::getTotalIncome),
                sum(groupedMonths, MonthlyAggregation::getTotalExpenses)
        );
    }

    private YearlyAggregation toYearlyAggregation(List<MonthlyAggregation> groupedMonths) {
        MonthlyAggregation firstMonth = groupedMonths.get(0);
        return new YearlyAggregation(
                firstMonth.getConnectionId(),
                firstMonth.getYear(),
                sum(groupedMonths, MonthlyAggregation::getTotalBalance),
                sum(groupedMonths, MonthlyAggregation::getTotalIncome),
                sum(groupedMonths, MonthlyAggregation::getTotalExpenses)
        );
    }

    private int quarterOf(MonthlyAggregation monthlyAggregation) {
        return ((monthlyAggregation.getMonth() - 1) / 3) + 1;
    }

    private BigDecimal sum(List<MonthlyAggregation> monthlyAggregations,
                           Function<MonthlyAggregation, BigDecimal> extractor) {
        return monthlyAggregations.stream()
                .map(extractor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
