package com.opex.backend.banking.controller;

import com.opex.backend.banking.dto.AggregatedBalanceResponse;
import com.opex.backend.banking.dto.BankAccountRequest;
import com.opex.backend.banking.dto.BankAccountResponse;
import com.opex.backend.banking.dto.SaltedgeBankAccountUpdateRequest;
import com.opex.backend.banking.dto.TimeAggregatedResponse;
import com.opex.backend.banking.model.BankAccount;
import com.opex.backend.common.security.AuthenticatedUser;
import com.opex.backend.banking.service.BankAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bank-accounts")
@RequiredArgsConstructor
public class BankAccountController {

    private final BankAccountService bankAccountService;

    @GetMapping("/my-accounts")
    public ResponseEntity<Page<BankAccountResponse>> getMyAccounts(
            AuthenticatedUser authenticatedUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<BankAccount> myAccounts = bankAccountService.getUserAccounts(authenticatedUser.userId(), page, size);
        return ResponseEntity.ok(myAccounts.map(BankAccountResponse::from));
    }

    @PostMapping("/local")
    public ResponseEntity<BankAccountResponse> createLocalAccount(
            AuthenticatedUser authenticatedUser,
            @Valid @RequestBody BankAccountRequest request
    ) {
        return ResponseEntity.ok(BankAccountResponse.from(
                bankAccountService.createLocalAccount(authenticatedUser.userId(), request)
        ));
    }

    @GetMapping("/aggregated")
    public ResponseEntity<List<AggregatedBalanceResponse>> getAggregatedBalances(AuthenticatedUser authenticatedUser) {
        return ResponseEntity.ok(bankAccountService.getAggregatedBalances(authenticatedUser.userId()));
    }

    @GetMapping("/aggregated/time")
    public ResponseEntity<TimeAggregatedResponse> getTimeAggregatedBalances(AuthenticatedUser authenticatedUser) {
        return ResponseEntity.ok(bankAccountService.getTimeAggregatedBalances(authenticatedUser.userId()));
    }

    @PatchMapping("/local/{accountId}")
    public ResponseEntity<BankAccountResponse> updateLocalAccount(
            AuthenticatedUser authenticatedUser,
            @PathVariable String accountId,
            @Valid @RequestBody BankAccountRequest request
    ) {
        return ResponseEntity.ok(
                BankAccountResponse.from(
                        bankAccountService.updateLocalAccount(authenticatedUser.userId(), accountId, request)
                )
        );
    }

    @PatchMapping("/saltedge/{accountId}")
    public ResponseEntity<BankAccountResponse> updateSaltedgeAccount(
            AuthenticatedUser authenticatedUser,
            @PathVariable String accountId,
            @Valid @RequestBody SaltedgeBankAccountUpdateRequest request
    ) {
        return ResponseEntity.ok(
                BankAccountResponse.from(
                        bankAccountService.updateSaltedgeAccount(authenticatedUser.userId(), accountId, request)
                )
        );
    }
}
