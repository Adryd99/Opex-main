package com.opex.backend.banking.controller;

import com.opex.backend.banking.dto.BankConnectionRefreshResponse;
import com.opex.backend.legal.dto.BankIntegrationConsentRequest;
import com.opex.backend.common.security.AuthenticatedUser;
import com.opex.backend.banking.service.BankIntegrationService;
import com.opex.backend.legal.service.LegalService;
import com.opex.backend.notification.service.NotificationTriggerService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(BankIntegrationController.class);

    private final BankIntegrationService bankIntegrationService;
    private final LegalService legalService;
    private final NotificationTriggerService notificationTriggerService;

    @PostMapping("/connect")
    public ResponseEntity<String> createConnection(
            AuthenticatedUser authenticatedUser,
            @RequestBody(required = false) BankIntegrationConsentRequest request
    ) {
        log.info("Creating bank connection for user '{}'", authenticatedUser.userId());
        legalService.recordOpenBankingConsent(authenticatedUser.userId(), request);
        String connectUrl = bankIntegrationService.createUserAndGetConnectUrl(authenticatedUser.userId(), request);
        return ResponseEntity.ok(connectUrl);
    }

    @PostMapping("/sync")
    public ResponseEntity<String> syncBank(AuthenticatedUser authenticatedUser) {
        String userId = authenticatedUser.userId();
        log.info("Synchronizing bank data for user '{}'", userId);

        try {
            return ResponseEntity.ok(bankIntegrationService.syncBankData(userId));
        } catch (RuntimeException exception) {
            notificationTriggerService.onSyncError(userId, null);
            throw exception;
        }
    }

    @PostMapping("/connections/{connectionId}/refresh")
    public ResponseEntity<BankConnectionRefreshResponse> refreshConnection(
            AuthenticatedUser authenticatedUser,
            @PathVariable String connectionId
    ) {
        String userId = authenticatedUser.userId();

        try {
            BankConnectionRefreshResponse response = bankIntegrationService.refreshConnection(userId, connectionId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException exception) {
            notificationTriggerService.onSyncError(userId, null);
            throw exception;
        }
    }

    @DeleteMapping("/connections/{connectionId}")
    public ResponseEntity<Void> deleteConnection(
            AuthenticatedUser authenticatedUser,
            @PathVariable String connectionId
    ) {
        bankIntegrationService.removeConnection(authenticatedUser.userId(), connectionId);
        return ResponseEntity.noContent().build();
    }
}
