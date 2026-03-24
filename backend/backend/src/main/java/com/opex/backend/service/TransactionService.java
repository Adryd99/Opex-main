package com.opex.backend.service;

import com.opex.backend.dto.AggregatedBalanceResponse;
import com.opex.backend.dto.MonthlyAggregation;
import com.opex.backend.dto.QuarterlyAggregation;
import com.opex.backend.dto.TimeAggregatedResponse;
import com.opex.backend.dto.TransactionRequest;
import com.opex.backend.dto.YearlyAggregation;
import com.opex.backend.model.BankConnection;
import com.opex.backend.model.Transaction;
import com.opex.backend.repository.BankConnectionRepository;
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
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final BankConnectionRepository bankConnectionRepository; // Serve per validare la connessione

    // --- 1. LEGGE TUTTE LE TRANSAZIONI (PAGINATO) ---
    public Page<Transaction> getUserTransactions(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return transactionRepository.findByUserId(userId, pageable);
    }

    // --- 2. AGGREGA LE TRANSAZIONI PER CONNECTION_ID ---
    public List<AggregatedBalanceResponse> getAggregatedTransactionsByConnectionId(String userId) {
        return transactionRepository.aggregateTransactionsByConnectionId(userId);
    }

    // --- 3. AGGREGA LE TRANSAZIONI PER CONNECTION_ID E PERIODO (MESE / QUARTER / ANNO) ---
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

    // --- 4. CREA UNA TRANSAZIONE LOCALE ---
    @Transactional
    public Transaction createLocalTransaction(String userId, TransactionRequest request) {
        String connectionId = request.getConnectionId();
        if (connectionId == null || connectionId.isBlank()) {
            throw new RuntimeException("connectionId obbligatorio");
        }

        // Controllo di sicurezza: la connessione bancaria esiste ed è dell'utente?
        BankConnection connection = bankConnectionRepository.findByIdAndUserId(connectionId, userId)
                .orElseThrow(() -> new RuntimeException("Connessione bancaria non trovata o non autorizzata"));

        Transaction transaction = new Transaction();
        transaction.setId("trx_local_" + UUID.randomUUID().toString());
        transaction.setUserId(userId);
        transaction.setConnectionId(connection.getId());
        transaction.setIsSaltedge(false); // È una nostra transazione manuale

        transaction.setAmount(request.getAmount());
        transaction.setBookingDate(request.getBookingDate());
        transaction.setCategory(request.getCategory());
        transaction.setDescription(request.getDescription());
        transaction.setMerchantName(request.getMerchantName());
        transaction.setStatus(request.getStatus());
        transaction.setType(request.getType());

        return transactionRepository.save(transaction);
    }

    // --- 5. AGGIORNA UNA TRANSAZIONE LOCALE ---
    @Transactional
    public Transaction updateLocalTransaction(String userId, String transactionId, TransactionRequest request) {
        // Cerco la transazione e mi assicuro che sia dell'utente
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new RuntimeException("Transazione non trovata o non autorizzata"));

        // Non posso modificare le transazioni vere arrivate da SaltEdge!
        if (Boolean.TRUE.equals(transaction.getIsSaltedge())) {
            throw new RuntimeException("Impossibile modificare transazioni importate da SaltEdge.");
        }

        // Se l'utente vuole spostare la transazione su un'altra connessione, valido anche la nuova connessione
        if (request.getConnectionId() != null) {
            if (request.getConnectionId().isBlank()) {
                throw new RuntimeException("connectionId non valido");
            }
            BankConnection newConnection = bankConnectionRepository.findByIdAndUserId(request.getConnectionId(), userId)
                    .orElseThrow(() -> new RuntimeException("Nuova connessione bancaria non valida"));
            transaction.setConnectionId(newConnection.getId());
        }

        // Logica PATCH: aggiorno solo i campi presenti
        if (request.getAmount() != null) transaction.setAmount(request.getAmount());
        if (request.getBookingDate() != null) transaction.setBookingDate(request.getBookingDate());
        if (request.getCategory() != null) transaction.setCategory(request.getCategory());
        if (request.getDescription() != null) transaction.setDescription(request.getDescription());
        if (request.getMerchantName() != null) transaction.setMerchantName(request.getMerchantName());
        if (request.getStatus() != null) transaction.setStatus(request.getStatus());
        if (request.getType() != null) transaction.setType(request.getType());

        return transactionRepository.save(transaction);
    }

    // --- 6. CANCELLA UNA TRANSAZIONE LOCALE ---
    @Transactional
    public void deleteLocalTransaction(String userId, String transactionId) {
        // Cerco la transazione e mi assicuro che sia davvero dell'utente
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new RuntimeException("Transazione non trovata o non autorizzata"));

        // Protezione fondamentale: Non posso cancellare le transazioni vere arrivate da SaltEdge!
        if (Boolean.TRUE.equals(transaction.getIsSaltedge())) {
            throw new RuntimeException("Impossibile cancellare transazioni importate da SaltEdge.");
        }

        // Se è locale, procedo con l'eliminazione fisica dal database
        transactionRepository.delete(transaction);
    }
}
