package com.opex.backend.banking.controller;

import com.opex.backend.banking.dto.BankAccountRequest;
import com.opex.backend.banking.dto.BankAccountResponse;
import com.opex.backend.banking.dto.BankConnectionResponse;
import com.opex.backend.banking.dto.ManualBankConnectionRequest;
import com.opex.backend.banking.dto.ManualBankConnectionUpdateRequest;
import com.opex.backend.banking.service.BankAccountService;
import com.opex.backend.banking.service.BankConnectionService;
import com.opex.backend.common.security.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bank-connections")
@RequiredArgsConstructor
public class BankConnectionController {

    private final BankConnectionService bankConnectionService;
    private final BankAccountService bankAccountService;

    @GetMapping("/my-connections")
    public ResponseEntity<List<BankConnectionResponse>> getMyConnections(AuthenticatedUser authenticatedUser) {
        return ResponseEntity.ok(bankConnectionService.getUserConnectionResponses(authenticatedUser.userId()));
    }

    @PostMapping("/manual")
    public ResponseEntity<BankConnectionResponse> createManualConnection(
            AuthenticatedUser authenticatedUser,
            @Valid @RequestBody ManualBankConnectionRequest request
    ) {
        return ResponseEntity.ok(
                BankConnectionResponse.from(
                        bankConnectionService.createManualConnection(authenticatedUser.userId(), request)
                        , List.of()
                )
        );
    }

    @PatchMapping("/manual/{connectionId}")
    public ResponseEntity<BankConnectionResponse> updateManualConnection(
            AuthenticatedUser authenticatedUser,
            @PathVariable String connectionId,
            @Valid @RequestBody ManualBankConnectionUpdateRequest request
    ) {
        var updatedConnection = bankConnectionService.updateManualConnection(authenticatedUser.userId(), connectionId, request);
        return ResponseEntity.ok(
                bankConnectionService.getUserConnectionResponses(authenticatedUser.userId()).stream()
                        .filter(connection -> connection.id().equals(updatedConnection.getId()))
                        .findFirst()
                        .orElseGet(() -> BankConnectionResponse.from(
                                updatedConnection,
                                List.of()
                        ))
        );
    }

    @DeleteMapping("/manual/{connectionId}")
    public ResponseEntity<Void> deleteManualConnection(
            AuthenticatedUser authenticatedUser,
            @PathVariable String connectionId
    ) {
        bankConnectionService.deleteManualConnection(authenticatedUser.userId(), connectionId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{connectionId}/accounts/local")
    public ResponseEntity<BankAccountResponse> createManualAccountForConnection(
            AuthenticatedUser authenticatedUser,
            @PathVariable String connectionId,
            @Valid @RequestBody BankAccountRequest request
    ) {
        return ResponseEntity.ok(
                BankAccountResponse.from(
                        bankAccountService.createLocalAccountInConnection(authenticatedUser.userId(), connectionId, request)
                )
        );
    }

    @PatchMapping("/{connectionId}/accounts/local/{accountId}")
    public ResponseEntity<BankAccountResponse> updateManualAccountForConnection(
            AuthenticatedUser authenticatedUser,
            @PathVariable String connectionId,
            @PathVariable String accountId,
            @Valid @RequestBody BankAccountRequest request
    ) {
        return ResponseEntity.ok(
                BankAccountResponse.from(
                        bankAccountService.updateLocalAccountInConnection(
                                authenticatedUser.userId(),
                                connectionId,
                                accountId,
                                request
                        )
                )
        );
    }
}
