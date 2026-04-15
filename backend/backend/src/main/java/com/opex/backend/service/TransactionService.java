package com.opex.backend.service;

import com.opex.backend.dto.AggregatedBalanceResponse;
import com.opex.backend.dto.ForecastPoint;
import com.opex.backend.dto.ForecastResponse;
import com.opex.backend.dto.MonthlyAggregation;
import com.opex.backend.dto.QuarterlyAggregation;
import com.opex.backend.dto.TimeAggregatedResponse;
import com.opex.backend.dto.TransactionRequest;
import com.opex.backend.dto.YearlyAggregation;
import com.opex.backend.model.BankAccount;
import com.opex.backend.model.BankConnection;
import com.opex.backend.model.Transaction;
import com.opex.backend.repository.BankAccountRepository;
import com.opex.backend.repository.BankConnectionRepository;
import com.opex.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final BankAccountRepository bankAccountRepository;
    private final BankConnectionRepository bankConnectionRepository;
    private final NotificationTriggerService notificationTriggerService;

    public Page<Transaction> getUserTransactions(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return transactionRepository.findByUserId(userId, pageable);
    }

    public List<AggregatedBalanceResponse> getAggregatedTransactionsByConnectionId(String userId) {
        return transactionRepository.aggregateTransactionsByConnectionId(userId);
    }

    public TimeAggregatedResponse getTimeAggregatedTransactions(String userId) {
        List<MonthlyAggregation> byMonth = transactionRepository.aggregateByConnectionIdAndMonth(userId);

        Map<String, List<MonthlyAggregation>> groupedForQuarter = byMonth.stream()
                .collect(Collectors.groupingBy(m -> m.getConnectionId() + "|" + m.getYear() + "|" + ((m.getMonth() - 1) / 3 + 1)));

        List<QuarterlyAggregation> byQuarter = groupedForQuarter.entrySet().stream()
                .map(e -> {
                    MonthlyAggregation first = e.getValue().get(0);
                    int quarter = (first.getMonth() - 1) / 3 + 1;
                    BigDecimal totalBalance = e.getValue().stream().map(MonthlyAggregation::getTotalBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal totalIncome = e.getValue().stream().map(MonthlyAggregation::getTotalIncome).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal totalExpenses = e.getValue().stream().map(MonthlyAggregation::getTotalExpenses).reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new QuarterlyAggregation(first.getConnectionId(), first.getYear(), quarter, totalBalance, totalIncome, totalExpenses);
                })
                .sorted(Comparator.comparing(QuarterlyAggregation::getConnectionId)
                        .thenComparingInt(QuarterlyAggregation::getYear)
                        .thenComparingInt(QuarterlyAggregation::getQuarter))
                .collect(Collectors.toList());

        Map<String, List<MonthlyAggregation>> groupedForYear = byMonth.stream()
                .collect(Collectors.groupingBy(m -> m.getConnectionId() + "|" + m.getYear()));

        List<YearlyAggregation> byYear = groupedForYear.entrySet().stream()
                .map(e -> {
                    MonthlyAggregation first = e.getValue().get(0);
                    BigDecimal totalBalance = e.getValue().stream().map(MonthlyAggregation::getTotalBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal totalIncome = e.getValue().stream().map(MonthlyAggregation::getTotalIncome).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal totalExpenses = e.getValue().stream().map(MonthlyAggregation::getTotalExpenses).reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new YearlyAggregation(first.getConnectionId(), first.getYear(), totalBalance, totalIncome, totalExpenses);
                })
                .sorted(Comparator.comparing(YearlyAggregation::getConnectionId)
                        .thenComparingInt(YearlyAggregation::getYear))
                .collect(Collectors.toList());

        return new TimeAggregatedResponse(byMonth, byQuarter, byYear);
    }

    @Transactional
    public Transaction createLocalTransaction(String userId, TransactionRequest request) {
        BankAccount localAccount = resolveLocalAccount(userId, request.getBankAccountId());
        BigDecimal signedAmount = normalizeSignedAmount(request.getAmount(), request.getType());

        BigDecimal currentBalance = localAccount.getBalance() != null ? localAccount.getBalance() : BigDecimal.ZERO;
        localAccount.setBalance(currentBalance.add(signedAmount));
        bankAccountRepository.save(localAccount);

        Transaction transaction = new Transaction();
        transaction.setId("trx_local_" + UUID.randomUUID());
        transaction.setUserId(userId);
        transaction.setConnectionId(localAccount.getConnectionId());
        transaction.setBankAccountId(localAccount.getSaltedgeAccountId());
        transaction.setIsSaltedge(false);
        transaction.setAmount(signedAmount);
        transaction.setBookingDate(request.getBookingDate());
        transaction.setCategory(request.getCategory());
        transaction.setDescription(request.getDescription());
        transaction.setMerchantName(request.getMerchantName());
        transaction.setStatus(request.getStatus());
        transaction.setType(request.getType());

        Transaction saved = transactionRepository.save(transaction);

        // Fire notification checks asynchronously after saving
        notificationTriggerService.onTransactionCreated(userId, signedAmount);

        return saved;
    }

    @Transactional
    public Transaction updateLocalTransaction(String userId, String transactionId, TransactionRequest request) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new RuntimeException("Transazione non trovata o non autorizzata"));

        if (Boolean.TRUE.equals(transaction.getIsSaltedge())) {
            throw new RuntimeException("Impossibile modificare transazioni importate da SaltEdge.");
        }

        if (request.getBankAccountId() != null) {
            BankAccount localAccount = resolveLocalAccount(userId, request.getBankAccountId());
            transaction.setBankAccountId(localAccount.getSaltedgeAccountId());
            transaction.setConnectionId(localAccount.getConnectionId());
        }

        // Legacy path kept for compatibility with older clients.
        if (request.getConnectionId() != null) {
            if (request.getConnectionId().isBlank()) {
                throw new RuntimeException("connectionId non valido");
            }
            BankConnection newConnection = bankConnectionRepository.findByIdAndUserId(request.getConnectionId(), userId)
                    .orElseThrow(() -> new RuntimeException("Nuova connessione bancaria non valida"));
            transaction.setConnectionId(newConnection.getId());
            transaction.setBankAccountId(null);
        }

        if (request.getAmount() != null) transaction.setAmount(request.getAmount());
        if (request.getBookingDate() != null) transaction.setBookingDate(request.getBookingDate());
        if (request.getCategory() != null) transaction.setCategory(request.getCategory());
        if (request.getDescription() != null) transaction.setDescription(request.getDescription());
        if (request.getMerchantName() != null) transaction.setMerchantName(request.getMerchantName());
        if (request.getStatus() != null) transaction.setStatus(request.getStatus());
        if (request.getType() != null) transaction.setType(request.getType());

        return transactionRepository.save(transaction);
    }

    @Transactional
    public void deleteLocalTransaction(String userId, String transactionId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new RuntimeException("Transazione non trovata o non autorizzata"));

        if (Boolean.TRUE.equals(transaction.getIsSaltedge())) {
            throw new RuntimeException("Impossibile cancellare transazioni importate da SaltEdge.");
        }

        transactionRepository.delete(transaction);
    }

    private BankAccount resolveLocalAccount(String userId, String bankAccountId) {
        if (bankAccountId == null || bankAccountId.isBlank()) {
            throw new RuntimeException("bankAccountId obbligatorio");
        }

        BankAccount account = bankAccountRepository.findBySaltedgeAccountIdAndUserId(bankAccountId, userId)
                .orElseThrow(() -> new RuntimeException("Conto bancario non trovato o non autorizzato"));

        if (Boolean.TRUE.equals(account.getIsSaltedge())) {
            throw new RuntimeException("Le transazioni manuali possono essere aggiunte solo ai conti locali.");
        }

        return account;
    }

    // -------------------------------------------------------------------------
    // Forecasting engine — weighted moving average + linear trend
    // -------------------------------------------------------------------------

    public ForecastResponse getForecast(String userId, int forecastMonths) {
        int safeMonths = Math.max(1, Math.min(forecastMonths, 6));

        // 1. Fetch monthly aggregations across all connections and merge by (year, month)
        List<MonthlyAggregation> raw = transactionRepository.aggregateByConnectionIdAndMonth(userId);

        TreeMap<String, double[]> monthMap = new TreeMap<>();
        for (MonthlyAggregation m : raw) {
            String key = m.getYear() + "-" + String.format("%02d", m.getMonth());
            double[] totals = monthMap.computeIfAbsent(key, k -> new double[]{0.0, 0.0});
            totals[0] += m.getTotalIncome() != null ? m.getTotalIncome().doubleValue() : 0.0;
            totals[1] += m.getTotalExpenses() != null ? Math.abs(m.getTotalExpenses().doubleValue()) : 0.0;
        }

        // 2. Build sorted historical list
        List<ForecastResponse.HistoricalPoint> historical = monthMap.entrySet().stream()
                .map(e -> {
                    double inc = e.getValue()[0];
                    double exp = e.getValue()[1];
                    return new ForecastResponse.HistoricalPoint(
                            e.getKey(), buildForecastMonthLabel(e.getKey()),
                            roundToBD(inc), roundToBD(exp), roundToBD(inc - exp));
                })
                .collect(Collectors.toList());

        int monthsOfData = historical.size();

        // 3. Weighted moving average (last 6 months, most recent = highest weight)
        int windowSize = Math.min(6, monthsOfData);
        List<ForecastResponse.HistoricalPoint> window =
                historical.subList(Math.max(0, monthsOfData - windowSize), monthsOfData);

        double totalWeight = windowSize * (windowSize + 1) / 2.0;
        double wmaIncome = 0.0, wmaExpenses = 0.0;
        for (int i = 0; i < window.size(); i++) {
            double w = (i + 1) / totalWeight;
            wmaIncome   += w * window.get(i).getIncome().doubleValue();
            wmaExpenses += w * window.get(i).getExpenses().doubleValue();
        }

        // 4. Linear trend (slope) via least-squares on income
        List<Double> incValues  = window.stream().map(p -> p.getIncome().doubleValue()).collect(Collectors.toList());
        List<Double> expValues  = window.stream().map(p -> p.getExpenses().doubleValue()).collect(Collectors.toList());
        double slopeIncome   = computeForecastSlope(incValues);
        double slopeExpenses = computeForecastSlope(expValues);

        // 5. Generate forecast points
        YearMonth lastMonth = historical.isEmpty()
                ? YearMonth.now().minusMonths(1)
                : parseYearMonth(historical.get(monthsOfData - 1).getKey());

        List<ForecastPoint> forecast = new ArrayList<>();
        for (int i = 1; i <= safeMonths; i++) {
            YearMonth fm = lastMonth.plusMonths(i);
            String key = fm.getYear() + "-" + String.format("%02d", fm.getMonthValue());
            double predInc = Math.max(0.0, wmaIncome   + slopeIncome   * i);
            double predExp = Math.max(0.0, wmaExpenses + slopeExpenses * i);
            forecast.add(new ForecastPoint(
                    key, buildForecastMonthLabel(key),
                    roundToBD(predInc), roundToBD(predExp), roundToBD(predInc - predExp)));
        }

        return new ForecastResponse(historical, forecast, determineForecastTrend(slopeIncome, wmaIncome), monthsOfData);
    }

    private double computeForecastSlope(List<Double> values) {
        int n = values.size();
        if (n < 2) return 0.0;
        double xMean = (n - 1) / 2.0;
        double yMean = values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double num = 0.0, den = 0.0;
        for (int i = 0; i < n; i++) {
            double dx = i - xMean;
            num += dx * (values.get(i) - yMean);
            den += dx * dx;
        }
        return den == 0.0 ? 0.0 : num / den;
    }

    private String determineForecastTrend(double slope, double base) {
        if (base < 1.0) return "STABLE";
        return Math.abs(slope) / base < 0.05 ? "STABLE" : (slope > 0 ? "GROWING" : "DECLINING");
    }

    private YearMonth parseYearMonth(String key) {
        String[] p = key.split("-");
        return YearMonth.of(Integer.parseInt(p[0]), Integer.parseInt(p[1]));
    }

    private String buildForecastMonthLabel(String key) {
        String[] p = key.split("-");
        int m = Integer.parseInt(p[1]);
        int y = Integer.parseInt(p[0]);
        String[] names = {"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"};
        return names[m - 1] + " " + String.format("%02d", y % 100);
    }

    private BigDecimal roundToBD(double value) {
        return BigDecimal.valueOf(Math.round(value));
    }

    private BigDecimal normalizeSignedAmount(BigDecimal amount, String type) {
        BigDecimal baseAmount = amount != null ? amount : BigDecimal.ZERO;
        String normalizedType = type != null ? type.trim().toUpperCase(Locale.ROOT) : "";

        if ("EXPENSE".equals(normalizedType) || "DEBIT".equals(normalizedType)) {
            return baseAmount.abs().negate();
        }
        if ("INCOME".equals(normalizedType) || "CREDIT".equals(normalizedType)) {
            return baseAmount.abs();
        }

        return baseAmount;
    }
}
