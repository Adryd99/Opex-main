package com.opex.backend.user.service.support;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.Locale;

public final class UserValueSupport {

    private UserValueSupport() {
    }

    public static String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    public static String normalizeForComparison(String value) {
        return value == null ? null : value.trim();
    }

    public static String normalizeWebBaseUrl(String value) {
        String normalized = firstNonBlank(value);
        if (normalized == null) {
            return "http://localhost:3000";
        }

        return normalized.replaceAll("/+$", "");
    }

    public static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    @SafeVarargs
    public static <T> T firstNonNull(T... values) {
        for (T value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    public static LocalDate parseLocalDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }

    public static OffsetDateTime parseOffsetDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return OffsetDateTime.parse(value.trim());
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }

    public static OffsetDateTime toOffsetDateTime(Long epochMillis) {
        if (epochMillis == null) {
            return null;
        }

        return OffsetDateTime.ofInstant(Instant.ofEpochMilli(epochMillis), ZoneOffset.UTC);
    }

    public static Boolean parseBoolean(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return Boolean.parseBoolean(value.trim());
    }

    public static String normalizeCountryCode(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "IT", "NL", "BE", "DE" -> normalized;
            default -> null;
        };
    }

    public static String toCountryCode(String residence) {
        if (residence == null || residence.isBlank()) {
            return null;
        }

        String normalized = residence.trim().toLowerCase(Locale.ROOT);
        if (normalized.contains("(it)") || normalized.contains("italy")) {
            return "IT";
        }
        if (normalized.contains("(nl)") || normalized.contains("netherlands")) {
            return "NL";
        }
        if (normalized.contains("(be)") || normalized.contains("belgium")) {
            return "BE";
        }
        if (normalized.contains("(de)") || normalized.contains("germany")) {
            return "DE";
        }

        return null;
    }

    public static String toResidenceDisplay(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            return null;
        }

        return switch (countryCode.toUpperCase(Locale.ROOT)) {
            case "IT" -> "Italy (IT)";
            case "NL" -> "Netherlands (NL)";
            case "BE" -> "Belgium (BE)";
            case "DE" -> "Germany (DE)";
            default -> null;
        };
    }

    public static String joinNames(String firstName, String lastName) {
        String value = ((firstName == null ? "" : firstName.trim()) + " " + (lastName == null ? "" : lastName.trim())).trim();
        return value.isBlank() ? null : value;
    }
}
