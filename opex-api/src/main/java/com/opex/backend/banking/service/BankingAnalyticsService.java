package com.opex.backend.banking.service;

import com.opex.backend.banking.dto.AggregatedBalanceResponse;
import com.opex.backend.banking.dto.ForecastResponse;
import com.opex.backend.banking.dto.MonthlyAggregation;
import com.opex.backend.banking.dto.TimeAggregatedResponse;
import com.opex.backend.banking.repository.BankAccountRepository;
import com.opex.backend.banking.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BankingAnalyticsService {

    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;
    private final BankingTimeAggregationService bankingTimeAggregationService;
    private final BankingForecastService bankingForecastService;

    public List<AggregatedBalanceResponse> getAggregatedAccountBalances(String userId) {
        return bankAccountRepository.aggregateBalancesByConnectionId(userId);
    }

    public List<AggregatedBalanceResponse> getAggregatedTransactions(String userId) {
        return transactionRepository.aggregateTransactionsByConnectionId(userId);
    }

    public TimeAggregatedResponse getTimeAggregatedBalances(String userId) {
        return buildTimeAggregatedResponse(userId);
    }

    public TimeAggregatedResponse getTimeAggregatedTransactions(String userId) {
        return buildTimeAggregatedResponse(userId);
    }

    public ForecastResponse getForecast(String userId, int forecastMonths) {
        List<MonthlyAggregation> monthlyAggregations = transactionRepository.aggregateByConnectionIdAndMonth(userId);
        return bankingForecastService.buildForecast(monthlyAggregations, forecastMonths);
    }

    private TimeAggregatedResponse buildTimeAggregatedResponse(String userId) {
        List<MonthlyAggregation> monthlyAggregations = transactionRepository.aggregateByConnectionIdAndMonth(userId);
        return bankingTimeAggregationService.aggregate(monthlyAggregations);
    }
}
