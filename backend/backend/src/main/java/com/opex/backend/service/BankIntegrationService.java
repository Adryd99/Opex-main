package com.opex.backend.service;

import com.opex.backend.dto.BankIntegrationConsentRequest;
import com.opex.backend.dto.BankConnectionRefreshResponse;
import com.opex.backend.dto.SaltEdgeConsentRequest;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class BankIntegrationService {

    // 1. Diciamo a Spring di leggere l'URL dal file application.properties
    @Value("${external-services.saltedge-microservice.url}")
    private String microserviceUrl;

    private RestClient restClient;

    // 2. @PostConstruct dice a Spring: "Appena hai iniettato la stringa qui sopra,
    // esegui questo metodo per configurare il RestClient!"
    @PostConstruct
    public void init() {
        this.restClient = RestClient.builder()
                .baseUrl(microserviceUrl)
                .build();
    }

    // 3. Crea sempre una nuova connect URL (crea customer solo se manca)
    public String createUserAndGetConnectUrl(String userId, BankIntegrationConsentRequest consentRequest) {
        return restClient.post()
                .uri("/api/users/{id}", userId)
                .body(toSaltEdgeConsentRequest(consentRequest))
                .retrieve()
                .body(String.class);
    }

    // 4. Esegue solo la sincronizzazione dati
    public String syncWithMicroservice(String userId) {
        return restClient.post()
                .uri("/api/users/{id}/sync", userId)
                .retrieve()
                .body(String.class);
    }

    public BankConnectionRefreshResponse refreshConnection(String userId, String connectionId) {
        String refreshUrl = restClient.post()
                .uri("/api/users/{id}/connections/{connectionId}/refresh", userId, connectionId)
                .retrieve()
                .body(String.class);
        return new BankConnectionRefreshResponse(refreshUrl);
    }

    public void removeConnection(String userId, String connectionId) {
        restClient.delete()
                .uri("/api/users/{id}/connections/{connectionId}", userId, connectionId)
                .retrieve()
                .toBodilessEntity();
    }

    private SaltEdgeConsentRequest toSaltEdgeConsentRequest(BankIntegrationConsentRequest consentRequest) {
        if (consentRequest == null) {
            return null;
        }

        return new SaltEdgeConsentRequest(
                consentRequest.openBankingNoticeVersion(),
                consentRequest.scopes()
        );
    }
}
