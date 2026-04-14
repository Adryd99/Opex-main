package com.opex.backend.controller;

import com.opex.backend.dto.AggregatedBalanceResponse;
import com.opex.backend.dto.BankAccountRequest;
import com.opex.backend.dto.SaltedgeBankAccountUpdateRequest;
import com.opex.backend.dto.TimeAggregatedResponse;
import com.opex.backend.model.BankAccount;
import com.opex.backend.service.BankAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bank-accounts")
@RequiredArgsConstructor
public class BankAccountController {

    private final BankAccountService bankAccountService;

    // 1. Ritorna la lista paginata
    @GetMapping("/my-accounts")
    public ResponseEntity<Page<BankAccount>> getMyAccounts(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,  // Pagina di partenza (0 = prima pagina)
            @RequestParam(defaultValue = "10") int size  // Quanti elementi per pagina
    ) {
        String userId = jwt.getClaimAsString("sub");
        Page<BankAccount> myAccounts = bankAccountService.getUserAccounts(userId, page, size);
        return ResponseEntity.ok(myAccounts);
    }

    // 2. Crea un conto manuale
    @PostMapping("/local")
    public ResponseEntity<BankAccount> createLocalAccount(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody BankAccountRequest request) {
        String userId = jwt.getClaimAsString("sub");
        return ResponseEntity.ok(bankAccountService.createLocalAccount(userId, request));
    }

    // 3. Aggrega i balance per connection_id
    @GetMapping("/aggregated")
    public ResponseEntity<List<AggregatedBalanceResponse>> getAggregatedBalances(
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("sub");
        return ResponseEntity.ok(bankAccountService.getAggregatedBalances(userId));
    }

    // 4. Aggrega le transazioni per connection_id e periodo (mese, quarter, anno)
    @GetMapping("/aggregated/time")
    public ResponseEntity<TimeAggregatedResponse> getTimeAggregatedBalances(
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("sub");
        return ResponseEntity.ok(bankAccountService.getTimeAggregatedBalances(userId));
    }

    // 5. Modifica un conto manuale
    @PatchMapping("/local/{accountId}")
    public ResponseEntity<BankAccount> updateLocalAccount(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String accountId,
            @RequestBody BankAccountRequest request) {
        String userId = jwt.getClaimAsString("sub");
        return ResponseEntity.ok(bankAccountService.updateLocalAccount(userId, accountId, request));
    }

    @PatchMapping("/saltedge/{accountId}")
    public ResponseEntity<BankAccount> updateSaltedgeAccount(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String accountId,
            @RequestBody SaltedgeBankAccountUpdateRequest request) {
        String userId = jwt.getClaimAsString("sub");
        return ResponseEntity.ok(bankAccountService.updateSaltedgeAccount(userId, accountId, request));
    }
}
