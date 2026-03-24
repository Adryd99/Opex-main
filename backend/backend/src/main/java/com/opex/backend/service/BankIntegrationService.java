package com.opex.backend.service;

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
    public String createUserAndGetConnectUrl(String userId) {
        return restClient.post()
                .uri("/api/users/{id}", userId)
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
}
