package com.opex.backend.service;

import com.opex.backend.dto.*;
import com.opex.backend.model.BankAccount;
import com.opex.backend.repository.BankAccountRepository;
import com.opex.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;

    // --- AGGREGA I BALANCE PER CONNECTION_ID ---
    public List<AggregatedBalanceResponse> getAggregatedBalances(String userId) {
        return bankAccountRepository.aggregateBalancesByConnectionId(userId);
    }

    // --- AGGREGA LE TRANSAZIONI PER CONNECTION_ID E PERIODO (MESE / QUARTER / ANNO) ---
    public TimeAggregatedResponse getTimeAggregatedBalances(String userId) {
        List<MonthlyAggregation> byMonth = transactionRepository.aggregateByConnectionIdAndMonth(userId);

        // Quarter: mesi 1-3 → Q1, 4-6 → Q2, 7-9 → Q3, 10-12 → Q4
        Map<String, List<MonthlyAggregation>> groupedForQuarter = byMonth.stream()
                .collect(Collectors.groupingBy(m -> m.getConnectionId() + "|" + m.getYear() + "|" + ((m.getMonth() - 1) / 3 + 1)));

        List<QuarterlyAggregation> byQuarter = groupedForQuarter.entrySet().stream()
                .map(e -> {
                    MonthlyAggregation first = e.getValue().get(0);
                    int quarter = (first.getMonth() - 1) / 3 + 1;
                    BigDecimal totalBalance  = e.getValue().stream().map(MonthlyAggregation::getTotalBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal totalIncome   = e.getValue().stream().map(MonthlyAggregation::getTotalIncome).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal totalExpenses = e.getValue().stream().map(MonthlyAggregation::getTotalExpenses).reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new QuarterlyAggregation(first.getConnectionId(), first.getYear(), quarter, totalBalance, totalIncome, totalExpenses);
                })
                .sorted(Comparator.comparing(QuarterlyAggregation::getConnectionId)
                        .thenComparingInt(QuarterlyAggregation::getYear)
                        .thenComparingInt(QuarterlyAggregation::getQuarter))
                .collect(Collectors.toList());

        // Anno
        Map<String, List<MonthlyAggregation>> groupedForYear = byMonth.stream()
                .collect(Collectors.groupingBy(m -> m.getConnectionId() + "|" + m.getYear()));

        List<YearlyAggregation> byYear = groupedForYear.entrySet().stream()
                .map(e -> {
                    MonthlyAggregation first = e.getValue().get(0);
                    BigDecimal totalBalance  = e.getValue().stream().map(MonthlyAggregation::getTotalBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal totalIncome   = e.getValue().stream().map(MonthlyAggregation::getTotalIncome).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal totalExpenses = e.getValue().stream().map(MonthlyAggregation::getTotalExpenses).reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new YearlyAggregation(first.getConnectionId(), first.getYear(), totalBalance, totalIncome, totalExpenses);
                })
                .sorted(Comparator.comparing(YearlyAggregation::getConnectionId)
                        .thenComparingInt(YearlyAggregation::getYear))
                .collect(Collectors.toList());

        return new TimeAggregatedResponse(byMonth, byQuarter, byYear);
    }

    // --- LEGGE TUTTI I CONTI (PAGINATO) ---
    public Page<BankAccount> getUserAccounts(String userId, int page, int size) {
        // Crea l'oggetto di paginazione (page parte da 0)
        Pageable pageable = PageRequest.of(page, size);
        return bankAccountRepository.findByUserId(userId, pageable);
    }

    // --- CREA UN CONTO LOCALE ---
    @Transactional
    public BankAccount createLocalAccount(String userId, BankAccountRequest request) {
        BankAccount account = new BankAccount();
        account.setSaltedgeAccountId("local_" + UUID.randomUUID().toString());
        account.setUserId(userId);
        account.setIsSaltedge(false);
        account.setConnectionId(null);

        account.setBalance(request.getBalance());
        account.setInstitutionName(request.getInstitutionName());
        account.setCountry(request.getCountry());
        account.setCurrency(request.getCurrency());
        account.setIsForTax(request.getIsForTax());
        account.setNature(request.getNature());

        return bankAccountRepository.save(account);
    }

    // --- AGGIORNA UN CONTO LOCALE ---
    @Transactional
    public BankAccount updateLocalAccount(String userId, String accountId, BankAccountRequest request) {
        BankAccount account = bankAccountRepository.findBySaltedgeAccountIdAndUserId(accountId, userId)
                .orElseThrow(() -> new RuntimeException("Conto non trovato o non autorizzato"));

        if (Boolean.TRUE.equals(account.getIsSaltedge())) {
            throw new RuntimeException("Operazione negata. Non puoi modificare manualmente i conti di SaltEdge.");
        }

        if (request.getBalance() != null) account.setBalance(request.getBalance());
        if (request.getInstitutionName() != null) account.setInstitutionName(request.getInstitutionName());
        if (request.getCountry() != null) account.setCountry(request.getCountry());
        if (request.getCurrency() != null) account.setCurrency(request.getCurrency());
        if (request.getIsForTax() != null) account.setIsForTax(request.getIsForTax());
        if (request.getNature() != null) account.setNature(request.getNature());

        return bankAccountRepository.save(account);
    }
}