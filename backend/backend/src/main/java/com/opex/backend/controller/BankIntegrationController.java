package com.opex.backend.controller;

import com.opex.backend.service.BankIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bank-integration")
@RequiredArgsConstructor
public class BankIntegrationController {

    private final BankIntegrationService bankIntegrationService;

    /**
     * Endpoint che crea sempre una nuova connect URL.
     * Metodo: POST
     * URL: http://localhost:8080/api/bank-integration/connect
     */
    @PostMapping("/connect")
    public ResponseEntity<String> createConnection(@AuthenticationPrincipal Jwt jwt) {

        System.out.printf("CREAZIONE CONNESSIONE!");
        // Estraiamo sempre in modo sicuro l'ID utente dal token
        String userId = jwt.getClaimAsString("sub");

        String connectUrl = bankIntegrationService.createUserAndGetConnectUrl(userId);
        return ResponseEntity.ok(connectUrl);
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
}
