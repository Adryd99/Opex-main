package com.opex.keycloak.onboarding.support;

public final class LegalUrlSupport {

    private static final String DEFAULT_APP_BASE_URL = "http://localhost:3000";
    private static final String DEFAULT_API_PUBLIC_URL = "http://localhost:8080/api/legal/public";
    private static final String APP_BASE_URL_ENV = "OPEX_LEGAL_APP_BASE_URL";
    private static final String API_PUBLIC_URL_ENV = "OPEX_LEGAL_API_PUBLIC_URL";

    private LegalUrlSupport() {
    }

    public static String resolveAppBaseUrl() {
        return normalizeBaseUrl(System.getenv(APP_BASE_URL_ENV), DEFAULT_APP_BASE_URL);
    }

    public static String resolveApiPublicUrl() {
        String configuredValue = normalize(System.getenv(API_PUBLIC_URL_ENV));
        if (configuredValue != null) {
            return configuredValue;
        }

        return DEFAULT_API_PUBLIC_URL;
    }

    public static String resolveDocumentUrl(String slug) {
        return resolveAppBaseUrl() + "/legal/" + slug;
    }

    private static String normalizeBaseUrl(String value, String fallback) {
        String normalized = normalize(value);
        if (normalized == null) {
            return fallback;
        }

        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }

        return normalized;
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
