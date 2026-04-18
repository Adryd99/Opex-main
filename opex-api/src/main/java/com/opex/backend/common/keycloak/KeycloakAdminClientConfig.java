package com.opex.backend.common.keycloak;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KeycloakAdminClientConfig {

    private static final Logger log = LoggerFactory.getLogger(KeycloakAdminClientConfig.class);

    @Bean
    public Keycloak keycloak(KeycloakAdminProperties properties) {
        String serverUrl = properties.getServerUrl();
        String realm = properties.getRealm();
        String clientId = properties.getClientId();
        String username = properties.getUsername();
        String password = properties.getPassword();

        log.info(
                "Configured Keycloak admin client for '{}' realm '{}' with user '{}' (password supplied: {})",
                serverUrl,
                realm,
                username,
                !password.isBlank()
        );

        return KeycloakBuilder.builder()
                .serverUrl(properties.getServerUrl())
                .realm(properties.getRealm())
                .clientId(properties.getClientId())
                .username(properties.getUsername())
                .password(properties.getPassword())
                .grantType("password")
                .build();
    }
}
