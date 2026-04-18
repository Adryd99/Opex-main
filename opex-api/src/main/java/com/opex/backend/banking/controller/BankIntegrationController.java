package com.opex.backend.banking.controller;

import com.opex.backend.banking.dto.BankConnectionUrlResponse;
import com.opex.backend.banking.dto.BankConnectionRefreshResponse;
import com.opex.backend.banking.dto.BankSyncResponse;
import com.opex.backend.common.security.AuthenticatedUser;
import com.opex.backend.legal.dto.BankIntegrationConsentRequest;
import com.opex.backend.banking.service.usecase.ConnectBankAccountUseCase;
import com.opex.backend.banking.service.usecase.RefreshBankConnectionUseCase;
import com.opex.backend.banking.service.usecase.RemoveBankConnectionUseCase;
import com.opex.backend.banking.service.usecase.SyncBankAccountsUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bank-integration")
@RequiredArgsConstructor
public class BankIntegrationController {

    private final ConnectBankAccountUseCase connectBankAccountUseCase;
    private final SyncBankAccountsUseCase syncBankAccountsUseCase;
    private final RefreshBankConnectionUseCase refreshBankConnectionUseCase;
    private final RemoveBankConnectionUseCase removeBankConnectionUseCase;

    @PostMapping("/connect")
    public ResponseEntity<BankConnectionUrlResponse> createConnection(
            AuthenticatedUser authenticatedUser,
            @Valid @RequestBody(required = false) BankIntegrationConsentRequest request
    ) {
        return ResponseEntity.ok(connectBankAccountUseCase.execute(authenticatedUser.userId(), request));
    }

    @PostMapping("/sync")
    public ResponseEntity<BankSyncResponse> syncBank(AuthenticatedUser authenticatedUser) {
        return ResponseEntity.ok(syncBankAccountsUseCase.execute(authenticatedUser.userId()));
    }

    @PostMapping("/connections/{connectionId}/refresh")
    public ResponseEntity<BankConnectionRefreshResponse> refreshConnection(
            AuthenticatedUser authenticatedUser,
            @PathVariable String connectionId
    ) {
        return ResponseEntity.ok(refreshBankConnectionUseCase.execute(authenticatedUser.userId(), connectionId));
    }

    @DeleteMapping("/connections/{connectionId}")
    public ResponseEntity<Void> deleteConnection(
            AuthenticatedUser authenticatedUser,
            @PathVariable String connectionId
    ) {
        removeBankConnectionUseCase.execute(authenticatedUser.userId(), connectionId);
        return ResponseEntity.noContent().build();
    }
}
