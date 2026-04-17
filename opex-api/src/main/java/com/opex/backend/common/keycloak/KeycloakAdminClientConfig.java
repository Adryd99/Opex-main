package com.opex.backend.common.keycloak;

import com.opex.backend.common.config.LocalPropertyResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class KeycloakAdminClientConfig {

    private static final Logger log = LoggerFactory.getLogger(KeycloakAdminClientConfig.class);

    @Bean
    public Keycloak keycloak(Environment environment, LocalPropertyResolver localPropertyResolver) {
        String serverUrl = localPropertyResolver.resolve(
                environment,
                "http://localhost:8081",
                "KEYCLOAK_SERVER_URL",
                "keycloak-admin.server-url"
        );
        String realm = localPropertyResolver.resolve(
                environment,
                "master",
                "KEYCLOAK_ADMIN_REALM",
                "keycloak-admin.realm"
        );
        String clientId = localPropertyResolver.resolve(
                environment,
                "admin-cli",
                "KEYCLOAK_ADMIN_CLIENT_ID",
                "keycloak-admin.client-id"
        );
        String username = localPropertyResolver.resolve(
                environment,
                "admin",
                "KC_ADMIN",
                "keycloak-admin.username"
        );
        String password = localPropertyResolver.resolve(
                environment,
                "admin",
                "KC_ADMIN_PW",
                "keycloak-admin.password"
        );

        log.info(
                "Configured Keycloak admin client for '{}' realm '{}' with user '{}' (password supplied: {})",
                serverUrl,
                realm,
                username,
                !password.isBlank()
        );

        return KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm(realm)
                .clientId(clientId)
                .username(username)
                .password(password)
                .grantType("password")
                .build();
    }
}
