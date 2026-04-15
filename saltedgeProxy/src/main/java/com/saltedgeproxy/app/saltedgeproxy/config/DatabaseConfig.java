package com.saltedgeproxy.app.saltedgeproxy.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.Map;

@Configuration(proxyBeanMethods = false)
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);
    private static final int DOT_ENV_SEARCH_DEPTH = 5;

    @Bean
    @Primary
    public DataSource dataSource(Environment environment) {
        Map<String, String> dotEnv = loadDotEnv();

        String host = firstNonBlank(
                environment.getProperty("APP_PG_HOST"),
                dotEnv.get("APP_PG_HOST"),
                "localhost"
        );
        String port = firstNonBlank(
                environment.getProperty("APP_PG_PORT"),
                dotEnv.get("APP_PG_PORT"),
                "5433"
        );
        String database = firstNonBlank(
                environment.getProperty("APP_PG_DB"),
                dotEnv.get("APP_PG_DB"),
                "opexdb"
        );

        String url = firstNonBlank(
                environment.getProperty("APP_PG_JDBC_URL"),
                dotEnv.get("APP_PG_JDBC_URL"),
                "jdbc:postgresql://" + host + ":" + port + "/" + database,
                environment.getProperty("spring.datasource.url")
        );
        String username = firstNonBlank(
                environment.getProperty("APP_PG_USER"),
                dotEnv.get("APP_PG_USER"),
                environment.getProperty("spring.datasource.username"),
                "opex"
        );
        String password = firstNonBlank(
                environment.getProperty("APP_PG_PASSWORD"),
                dotEnv.get("APP_PG_PASSWORD"),
                environment.getProperty("spring.datasource.password"),
                "opex"
        );

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setPoolName("saltedge-proxy-postgres");
        dataSource.setDriverClassName("org.postgresql.Driver");
        dataSource.setJdbcUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);

        log.info(
                "Configured PostgreSQL datasource for '{}' with user '{}' (password supplied: {})",
                url,
                username,
                !password.isBlank()
        );

        return dataSource;
    }

    private Map<String, String> loadDotEnv() {
        Path current = Paths.get("").toAbsolutePath().normalize();

        for (int depth = 0; current != null && depth <= DOT_ENV_SEARCH_DEPTH; depth++) {
            Path candidate = current.resolve(".env");
            if (Files.isRegularFile(candidate)) {
                try {
                    Map<String, String> values = parseDotEnv(candidate);
                    log.info("Loaded datasource fallbacks from '{}'", candidate);
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
