package com.opex.backend.controller;

import com.opex.backend.dto.BankIntegrationConsentRequest;
import com.opex.backend.dto.BankConnectionRefreshResponse;
import com.opex.backend.service.BankIntegrationService;
import com.opex.backend.service.LegalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.client.HttpStatusCodeException;

@RestController
@RequestMapping("/api/bank-integration")
@RequiredArgsConstructor
public class BankIntegrationController {

    private final BankIntegrationService bankIntegrationService;
    private final LegalService legalService;

    /**
     * Endpoint che crea sempre una nuova connect URL.
     * Metodo: POST
     * URL: http://localhost:8080/api/bank-integration/connect
     */
    @PostMapping("/connect")
    public ResponseEntity<String> createConnection(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody(required = false) BankIntegrationConsentRequest request) {

        System.out.printf("CREAZIONE CONNESSIONE!");
        // Estraiamo sempre in modo sicuro l'ID utente dal token
        String userId = jwt.getClaimAsString("sub");

        try {
            legalService.recordOpenBankingConsent(userId, request);
            String connectUrl = bankIntegrationService.createUserAndGetConnectUrl(userId, request);
            return ResponseEntity.ok(connectUrl);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(exception.getMessage());
        } catch (HttpStatusCodeException exception) {
            return ResponseEntity.status(exception.getStatusCode()).body(exception.getResponseBodyAsString());
        }
    }

    /**
     * Endpoint dedicato solo alla sincronizzazione.
     * Metodo: POST
     * URL: http://localhost:8080/api/bank-integration/sync
     */
    @PostMapping("/sync")
    public ResponseEntity<String> syncBank(@AuthenticationPrincipal Jwt jwt) {
        System.out.printf("SINCRONIZZAZIONE CONNESSIONE!");
        // Estraiamo sempre in modo sicuro l'ID utente dal token
        String userId = jwt.getClaimAsString("sub");

        // Facciamo la chiamata al microservizio di sync
        String response = bankIntegrationService.syncWithMicroservice(userId);

        // Restituiamo il JSON identico a quello del microservizio
        return ResponseEntity.ok(response);
    }

    @PostMapping("/connections/{connectionId}/refresh")
    public ResponseEntity<?> refreshConnection(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String connectionId) {
        String userId = jwt.getClaimAsString("sub");

        try {
            BankConnectionRefreshResponse response = bankIntegrationService.refreshConnection(userId, connectionId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(exception.getMessage());
        } catch (HttpStatusCodeException exception) {
            return ResponseEntity.status(exception.getStatusCode()).body(exception.getResponseBodyAsString());
        }
    }

    @DeleteMapping("/connections/{connectionId}")
    public ResponseEntity<?> deleteConnection(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String connectionId) {
        String userId = jwt.getClaimAsString("sub");

        try {
            bankIntegrationService.removeConnection(userId, connectionId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(exception.getMessage());
        } catch (HttpStatusCodeException exception) {
            return ResponseEntity.status(exception.getStatusCode()).body(exception.getResponseBodyAsString());
        }
    }
}
