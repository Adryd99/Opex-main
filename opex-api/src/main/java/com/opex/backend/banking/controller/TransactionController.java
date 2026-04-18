package com.opex.backend.banking.controller;

import com.opex.backend.banking.dto.AggregatedBalanceResponse;
import com.opex.backend.banking.dto.ForecastResponse;
import com.opex.backend.banking.dto.TimeAggregatedResponse;
import com.opex.backend.banking.dto.TransactionRequest;
import com.opex.backend.banking.dto.TransactionResponse;
import com.opex.backend.banking.model.Transaction;
import com.opex.backend.common.security.AuthenticatedUser;
import com.opex.backend.banking.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping("/my-transactions")
    public ResponseEntity<Page<TransactionResponse>> getMyTransactions(
            AuthenticatedUser authenticatedUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<Transaction> transactions = transactionService.getUserTransactions(authenticatedUser.userId(), page, size);
        return ResponseEntity.ok(transactions.map(TransactionResponse::from));
    }

    @GetMapping("/aggregated")
    public ResponseEntity<List<AggregatedBalanceResponse>> getAggregatedTransactions(AuthenticatedUser authenticatedUser) {
        return ResponseEntity.ok(transactionService.getAggregatedTransactionsByConnectionId(authenticatedUser.userId()));
    }

    @GetMapping("/aggregated/time")
    public ResponseEntity<TimeAggregatedResponse> getTimeAggregatedTransactions(AuthenticatedUser authenticatedUser) {
        return ResponseEntity.ok(transactionService.getTimeAggregatedTransactions(authenticatedUser.userId()));
    }

    @GetMapping("/forecast")
    public ResponseEntity<ForecastResponse> getForecast(
            AuthenticatedUser authenticatedUser,
            @RequestParam(defaultValue = "3") int months
    ) {
        return ResponseEntity.ok(transactionService.getForecast(authenticatedUser.userId(), months));
    }

    @PostMapping("/local")
    public ResponseEntity<TransactionResponse> createLocalTransaction(
            AuthenticatedUser authenticatedUser,
            @Valid @RequestBody TransactionRequest request
    ) {
        return ResponseEntity.ok(TransactionResponse.from(
                transactionService.createLocalTransaction(authenticatedUser.userId(), request)
        ));
    }

    @PatchMapping("/local/{transactionId}")
    public ResponseEntity<TransactionResponse> updateLocalTransaction(
            AuthenticatedUser authenticatedUser,
            @PathVariable String transactionId,
            @Valid @RequestBody TransactionRequest request
    ) {
        return ResponseEntity.ok(
                TransactionResponse.from(
                        transactionService.updateLocalTransaction(authenticatedUser.userId(), transactionId, request)
                )
        );
    }

    @DeleteMapping("/local/{transactionId}")
    public ResponseEntity<Void> deleteLocalTransaction(
            AuthenticatedUser authenticatedUser,
            @PathVariable String transactionId
    ) {
        transactionService.deleteLocalTransaction(authenticatedUser.userId(), transactionId);
        return ResponseEntity.noContent().build();
    }
}
