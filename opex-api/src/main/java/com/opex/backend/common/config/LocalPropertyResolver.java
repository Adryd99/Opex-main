package com.opex.backend.common.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class LocalPropertyResolver {

    private static final Logger log = LoggerFactory.getLogger(LocalPropertyResolver.class);
    private static final int DOT_ENV_SEARCH_DEPTH = 5;

    private final Map<String, String> values;

    public LocalPropertyResolver() {
        this.values = loadDotEnv();
    }

    public String resolve(Environment environment, String defaultValue, String... propertyKeys) {
        for (String propertyKey : propertyKeys) {
            String value = firstNonBlank(
                    environment.getProperty(propertyKey),
                    values.get(propertyKey)
            );
            if (!value.isBlank()) {
                return value;
            }
        }
        return defaultValue;
    }

    private Map<String, String> loadDotEnv() {
        Path current = Paths.get("").toAbsolutePath().normalize();

        for (int depth = 0; current != null && depth <= DOT_ENV_SEARCH_DEPTH; depth++) {
            Path candidate = current.resolve(".env");
            if (Files.isRegularFile(candidate)) {
                try {
                    Map<String, String> parsedValues = parseDotEnv(candidate);
                    log.info("Loaded local environment fallbacks from '{}'", candidate);
                    return parsedValues;
                } catch (IOException exception) {
                    log.warn("Unable to read '{}': {}", candidate, exception.getMessage());
                    return Map.of();
                }
            }
            current = current.getParent();
        }

        return Map.of();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private Map<String, String> parseDotEnv(Path path) throws IOException {
        Map<String, String> parsedValues = new LinkedHashMap<>();

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
            parsedValues.putIfAbsent(key, value);
        }

        return parsedValues;
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
}
