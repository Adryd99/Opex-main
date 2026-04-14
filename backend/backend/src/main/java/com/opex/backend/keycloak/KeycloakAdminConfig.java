package com.opex.backend.keycloak;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.Map;

@Configuration
public class KeycloakAdminConfig {

    private static final Logger log = LoggerFactory.getLogger(KeycloakAdminConfig.class);
    private static final int DOT_ENV_SEARCH_DEPTH = 5;

    @Bean
    public Keycloak keycloak(Environment environment) {
        Map<String, String> dotEnv = loadDotEnv();

        String serverUrl = firstNonBlank(
                environment.getProperty("KEYCLOAK_SERVER_URL"),
                dotEnv.get("KEYCLOAK_SERVER_URL"),
                environment.getProperty("keycloak-admin.server-url"),
                "http://localhost:8081"
        );
        String realm = firstNonBlank(
                environment.getProperty("KEYCLOAK_ADMIN_REALM"),
                dotEnv.get("KEYCLOAK_ADMIN_REALM"),
                environment.getProperty("keycloak-admin.realm"),
                "master"
        );
        String clientId = firstNonBlank(
                environment.getProperty("KEYCLOAK_ADMIN_CLIENT_ID"),
                dotEnv.get("KEYCLOAK_ADMIN_CLIENT_ID"),
                environment.getProperty("keycloak-admin.client-id"),
                "admin-cli"
        );
        String username = firstNonBlank(
                environment.getProperty("KC_ADMIN"),
                dotEnv.get("KC_ADMIN"),
                environment.getProperty("keycloak-admin.username"),
                "admin"
        );
        String password = firstNonBlank(
                environment.getProperty("KC_ADMIN_PW"),
                dotEnv.get("KC_ADMIN_PW"),
                environment.getProperty("keycloak-admin.password"),
                "admin"
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

    private Map<String, String> loadDotEnv() {
        Path current = Paths.get("").toAbsolutePath().normalize();

        for (int depth = 0; current != null && depth <= DOT_ENV_SEARCH_DEPTH; depth++) {
            Path candidate = current.resolve(".env");
            if (Files.isRegularFile(candidate)) {
                try {
                    Map<String, String> values = parseDotEnv(candidate);
                    log.info("Loaded Keycloak admin fallbacks from '{}'", candidate);
                    return values;
                } catch (IOException exception) {
                    log.warn("Unable to read '{}': {}", candidate, exception.getMessage());
                    return Map.of();
                }
            }
            current = current.getParent();
        }

        return Map.of();
    }

    private Map<String, String> parseDotEnv(Path path) throws IOException {
        Map<String, String> values = new LinkedHashMap<>();

        for (String rawLine : Files.readAllLines(path, StandardCharsets.UTF_8)) {
            String line = rawLine.trim();
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }

            int separatorIndex = line.indexOf('=');
            if (separatorIndex < 1) {
                continue;
            }

            String key = line.substring(0, separatorIndex).trim();
            if (key.startsWith("export ")) {
                key = key.substring("export ".length()).trim();
            }

            String value = stripMatchingQuotes(line.substring(separatorIndex + 1).trim());
            values.putIfAbsent(key, value);
        }

        return values;
    }

    private String stripMatchingQuotes(String value) {
        if (value.length() >= 2) {
            boolean doubleQuoted = value.startsWith("\"") && value.endsWith("\"");
            boolean singleQuoted = value.startsWith("'") && value.endsWith("'");
            if (doubleQuoted || singleQuoted) {
                return value.substring(1, value.length() - 1);
            }
        }
        return value;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }
}
