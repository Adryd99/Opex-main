package com.opex.backend.banking.service;

import com.opex.backend.banking.dto.AggregatedBalanceResponse;
import com.opex.backend.banking.dto.ForecastResponse;
import com.opex.backend.banking.dto.TimeAggregatedResponse;
import com.opex.backend.banking.dto.TransactionRequest;
import com.opex.backend.banking.model.BankAccount;
import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.banking.model.Transaction;
import com.opex.backend.banking.repository.BankAccountRepository;
import com.opex.backend.banking.repository.BankConnectionRepository;
import com.opex.backend.banking.repository.TransactionRepository;
import com.opex.backend.common.exception.BadRequestException;
import com.opex.backend.common.exception.ResourceNotFoundException;
import com.opex.backend.notification.service.NotificationTriggerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final BankAccountRepository bankAccountRepository;
    private final BankConnectionRepository bankConnectionRepository;
    private final NotificationTriggerService notificationTriggerService;
    private final BankingAnalyticsService bankingAnalyticsService;

    public Page<Transaction> getUserTransactions(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return transactionRepository.findByUserId(userId, pageable);
    }

    public List<AggregatedBalanceResponse> getAggregatedTransactionsByConnectionId(String userId) {
        return bankingAnalyticsService.getAggregatedTransactions(userId);
    }

    public TimeAggregatedResponse getTimeAggregatedTransactions(String userId) {
        return bankingAnalyticsService.getTimeAggregatedTransactions(userId);
    }

    public ForecastResponse getForecast(String userId, int forecastMonths) {
        return bankingAnalyticsService.getForecast(userId, forecastMonths);
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

        Transaction savedTransaction = transactionRepository.save(transaction);
        notificationTriggerService.onTransactionCreated(userId, signedAmount);
        return savedTransaction;
    }

    @Transactional
    public Transaction updateLocalTransaction(String userId, String transactionId, TransactionRequest request) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transazione non trovata o non autorizzata"));

        if (Boolean.TRUE.equals(transaction.getIsSaltedge())) {
            throw new BadRequestException("Impossibile modificare transazioni importate da SaltEdge.");
        }

        updateTransactionAccountLink(userId, transaction, request);
        applyTransactionUpdates(transaction, request);
        return transactionRepository.save(transaction);
    }

    @Transactional
    public void deleteLocalTransaction(String userId, String transactionId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transazione non trovata o non autorizzata"));

        if (Boolean.TRUE.equals(transaction.getIsSaltedge())) {
            throw new BadRequestException("Impossibile cancellare transazioni importate da SaltEdge.");
        }

        transactionRepository.delete(transaction);
    }

    private void updateTransactionAccountLink(String userId, Transaction transaction, TransactionRequest request) {
        if (request.getBankAccountId() != null) {
            BankAccount localAccount = resolveLocalAccount(userId, request.getBankAccountId());
            transaction.setBankAccountId(localAccount.getSaltedgeAccountId());
            transaction.setConnectionId(localAccount.getConnectionId());
        }

        if (request.getConnectionId() != null) {
            if (request.getConnectionId().isBlank()) {
                throw new BadRequestException("connectionId non valido");
            }

            BankConnection newConnection = bankConnectionRepository.findByIdAndUserId(request.getConnectionId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Nuova connessione bancaria non valida"));

            transaction.setConnectionId(newConnection.getId());
            transaction.setBankAccountId(null);
        }
    }

    private void applyTransactionUpdates(Transaction transaction, TransactionRequest request) {
        if (request.getAmount() != null) {
            transaction.setAmount(request.getAmount());
        }
        if (request.getBookingDate() != null) {
            transaction.setBookingDate(request.getBookingDate());
        }
        if (request.getCategory() != null) {
            transaction.setCategory(request.getCategory());
        }
        if (request.getDescription() != null) {
            transaction.setDescription(request.getDescription());
        }
        if (request.getMerchantName() != null) {
            transaction.setMerchantName(request.getMerchantName());
        }
        if (request.getStatus() != null) {
            transaction.setStatus(request.getStatus());
        }
        if (request.getType() != null) {
            transaction.setType(request.getType());
        }
    }

    private BankAccount resolveLocalAccount(String userId, String bankAccountId) {
        if (bankAccountId == null || bankAccountId.isBlank()) {
            throw new BadRequestException("bankAccountId obbligatorio");
        }

        BankAccount account = bankAccountRepository.findBySaltedgeAccountIdAndUserId(bankAccountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conto bancario non trovato o non autorizzato"));

        if (Boolean.TRUE.equals(account.getIsSaltedge())) {
            throw new BadRequestException("Le transazioni manuali possono essere aggiunte solo ai conti locali.");
        }

        return account;
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
