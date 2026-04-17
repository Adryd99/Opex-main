package com.opex.backend.banking.service;

import com.opex.backend.banking.dto.ForecastPoint;
import com.opex.backend.banking.dto.ForecastResponse;
import com.opex.backend.banking.dto.MonthlyAggregation;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.TreeMap;

@Service
public class BankingForecastService {

    public ForecastResponse buildForecast(List<MonthlyAggregation> monthlyAggregations, int forecastMonths) {
        int safeMonths = Math.max(1, Math.min(forecastMonths, 6));
        TreeMap<String, double[]> totalsByMonth = mergeMonthlyAggregations(monthlyAggregations);
        List<ForecastResponse.HistoricalPoint> historical = buildHistoricalPoints(totalsByMonth);

        int monthsOfData = historical.size();
        List<ForecastResponse.HistoricalPoint> analysisWindow = historical.subList(
                Math.max(0, monthsOfData - Math.min(6, monthsOfData)),
                monthsOfData
        );

        WeightedAverage weightedAverage = computeWeightedAverages(analysisWindow);
        double incomeSlope = computeSlope(analysisWindow.stream().map(point -> point.getIncome().doubleValue()).toList());
        double expensesSlope = computeSlope(analysisWindow.stream().map(point -> point.getExpenses().doubleValue()).toList());

        List<ForecastPoint> forecast = buildForecastPoints(historical, safeMonths, weightedAverage, incomeSlope, expensesSlope);
        return new ForecastResponse(historical, forecast, determineTrend(incomeSlope, weightedAverage.income()), monthsOfData);
    }

    private TreeMap<String, double[]> mergeMonthlyAggregations(List<MonthlyAggregation> monthlyAggregations) {
        TreeMap<String, double[]> totalsByMonth = new TreeMap<>();

        for (MonthlyAggregation monthlyAggregation : monthlyAggregations) {
            String key = monthKey(monthlyAggregation.getYear(), monthlyAggregation.getMonth());
            double[] totals = totalsByMonth.computeIfAbsent(key, ignored -> new double[]{0.0, 0.0});
            totals[0] += monthlyAggregation.getTotalIncome() != null ? monthlyAggregation.getTotalIncome().doubleValue() : 0.0;
            totals[1] += monthlyAggregation.getTotalExpenses() != null
                    ? Math.abs(monthlyAggregation.getTotalExpenses().doubleValue())
                    : 0.0;
        }

        return totalsByMonth;
    }

    private List<ForecastResponse.HistoricalPoint> buildHistoricalPoints(TreeMap<String, double[]> totalsByMonth) {
        return totalsByMonth.entrySet().stream()
                .map(entry -> {
                    double income = entry.getValue()[0];
                    double expenses = entry.getValue()[1];
                    return new ForecastResponse.HistoricalPoint(
                            entry.getKey(),
                            buildMonthLabel(entry.getKey()),
                            roundToBigDecimal(income),
                            roundToBigDecimal(expenses),
                            roundToBigDecimal(income - expenses)
                    );
                })
                .toList();
    }

    private WeightedAverage computeWeightedAverages(List<ForecastResponse.HistoricalPoint> analysisWindow) {
        double totalWeight = analysisWindow.size() * (analysisWindow.size() + 1) / 2.0;
        double weightedIncome = 0.0;
        double weightedExpenses = 0.0;

        for (int index = 0; index < analysisWindow.size(); index++) {
            double weight = (index + 1) / totalWeight;
            weightedIncome += weight * analysisWindow.get(index).getIncome().doubleValue();
            weightedExpenses += weight * analysisWindow.get(index).getExpenses().doubleValue();
        }

        return new WeightedAverage(weightedIncome, weightedExpenses);
    }

    private List<ForecastPoint> buildForecastPoints(List<ForecastResponse.HistoricalPoint> historical,
                                                    int forecastMonths,
                                                    WeightedAverage weightedAverage,
                                                    double incomeSlope,
                                                    double expensesSlope) {
        YearMonth lastMonth = historical.isEmpty()
                ? YearMonth.now().minusMonths(1)
                : parseYearMonth(historical.get(historical.size() - 1).getKey());

        List<ForecastPoint> forecast = new ArrayList<>();
        for (int offset = 1; offset <= forecastMonths; offset++) {
            YearMonth forecastMonth = lastMonth.plusMonths(offset);
            String key = monthKey(forecastMonth.getYear(), forecastMonth.getMonthValue());
            double predictedIncome = Math.max(0.0, weightedAverage.income() + incomeSlope * offset);
            double predictedExpenses = Math.max(0.0, weightedAverage.expenses() + expensesSlope * offset);

            forecast.add(new ForecastPoint(
                    key,
                    buildMonthLabel(key),
                    roundToBigDecimal(predictedIncome),
                    roundToBigDecimal(predictedExpenses),
                    roundToBigDecimal(predictedIncome - predictedExpenses)
            ));
        }

        return forecast;
    }

    private double computeSlope(List<Double> values) {
        int size = values.size();
        if (size < 2) {
            return 0.0;
        }

        double xMean = (size - 1) / 2.0;
        double yMean = values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double numerator = 0.0;
        double denominator = 0.0;

        for (int index = 0; index < size; index++) {
            double deltaX = index - xMean;
            numerator += deltaX * (values.get(index) - yMean);
            denominator += deltaX * deltaX;
        }

        return denominator == 0.0 ? 0.0 : numerator / denominator;
    }

    private String determineTrend(double slope, double baseline) {
        if (baseline < 1.0) {
            return "STABLE";
        }

        return Math.abs(slope) / baseline < 0.05 ? "STABLE" : (slope > 0 ? "GROWING" : "DECLINING");
    }

    private YearMonth parseYearMonth(String key) {
        String[] parts = key.split("-");
        return YearMonth.of(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]));
    }

    private String buildMonthLabel(String key) {
        String[] parts = key.split("-");
        int month = Integer.parseInt(parts[1]);
        int year = Integer.parseInt(parts[0]);
        String monthName = switch (month) {
            case 1 -> "Jan";
            case 2 -> "Feb";
            case 3 -> "Mar";
            case 4 -> "Apr";
            case 5 -> "May";
            case 6 -> "Jun";
            case 7 -> "Jul";
            case 8 -> "Aug";
            case 9 -> "Sep";
            case 10 -> "Oct";
            case 11 -> "Nov";
            case 12 -> "Dec";
            default -> throw new IllegalArgumentException("Invalid month key: " + key);
        };

        return monthName + " " + String.format(Locale.ROOT, "%02d", year % 100);
    }

    private String monthKey(int year, int month) {
        return year + "-" + String.format(Locale.ROOT, "%02d", month);
    }

    private BigDecimal roundToBigDecimal(double value) {
        return BigDecimal.valueOf(Math.round(value));
    }

    private record WeightedAverage(double income, double expenses) {
    }
}
