package com.opex.backend.tax.service;

import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.banking.model.Transaction;
import com.opex.backend.banking.repository.BankConnectionRepository;
import com.opex.backend.banking.repository.TransactionRepository;
import com.opex.backend.common.exception.ResourceNotFoundException;
import com.opex.backend.tax.dto.TaxBufferDashboardResponse;
import com.opex.backend.tax.model.Tax;
import com.opex.backend.tax.repository.TaxRepository;
import com.opex.backend.user.model.User;
import com.opex.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaxProviderScopeService {

    private final TransactionRepository transactionRepository;
    private final BankConnectionRepository bankConnectionRepository;
    private final TaxRepository taxRepository;
    private final UserRepository userRepository;

    public int resolveYear(Integer year) {
        return year != null ? year : LocalDate.now().getYear();
    }

    public void validateConnectionOwnership(String userId, String connectionId) {
        if (isBlank(connectionId)) {
            return;
        }

        bankConnectionRepository.findByIdAndUserId(connectionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Connessione non trovata o non autorizzata"));
    }

    public User resolveUser(String userId) {
        return userRepository.findById(userId).orElseGet(() -> {
            User user = new User();
            user.setId(userId);
            return user;
        });
    }

    public List<Transaction> getYearlyTransactions(String userId, String connectionId, int targetYear) {
        return getTransactionsForScope(userId, connectionId).stream()
                .filter(transaction -> transaction.getBookingDate() != null)
                .filter(transaction -> transaction.getBookingDate().getYear() == targetYear)
                .collect(Collectors.toList());
    }

    public List<Tax> getTaxesForYear(String userId, int year) {
        return taxRepository.findByUserIdOrderByDeadlineAsc(userId).stream()
                .filter(tax -> tax.getDeadline() == null || tax.getDeadline().getYear() == year)
                .collect(Collectors.toList());
    }

    public List<TaxBufferDashboardResponse.ProviderItem> getAvailableProviders(String userId) {
        return bankConnectionRepository.findByUserId(userId).stream()
                .sorted(Comparator.comparing(BankConnection::getProviderName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .map(connection -> new TaxBufferDashboardResponse.ProviderItem(
                        connection.getId(),
                        connection.getProviderName(),
                        connection.getStatus()
                ))
                .collect(Collectors.toList());
    }

    public String resolveCurrency(List<Tax> taxes) {
        return taxes.stream()
                .map(Tax::getCurrency)
                .filter(currency -> currency != null && !currency.isBlank())
                .findFirst()
                .orElse(TaxMath.DEFAULT_CURRENCY);
    }

    private List<Transaction> getTransactionsForScope(String userId, String connectionId) {
        if (isBlank(connectionId)) {
            return transactionRepository.findByUserId(userId);
        }
        return transactionRepository.findByUserIdAndConnectionId(userId, connectionId);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
