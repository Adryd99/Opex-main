package com.opex.backend.user.service.support;

import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Component
public class KeycloakSecondFactorStateResolver {

    private static final String METHOD_TOTP = "totp";
    private static final String METHOD_WEBAUTHN = "webauthn";
    private static final String METHOD_RECOVERY = "recovery";

    public String resolveEffectiveMethod(
            String preferredSecondFactor,
            String recordedSecondFactorMethod,
            KeycloakSecondFactorSnapshot snapshot
    ) {
        Map<String, OffsetDateTime> configuredMethods = getConfiguredMethods(snapshot);
        if (configuredMethods.isEmpty()) {
            return null;
        }

        String normalizedPreferredMethod = normalizeMethod(preferredSecondFactor);
        if (normalizedPreferredMethod != null && configuredMethods.containsKey(normalizedPreferredMethod)) {
            return normalizedPreferredMethod;
        }

        String normalizedRecordedMethod = normalizeMethod(recordedSecondFactorMethod);
        if (normalizedRecordedMethod != null && configuredMethods.containsKey(normalizedRecordedMethod)) {
            return normalizedRecordedMethod;
        }

        return configuredMethods.entrySet().stream()
                .filter(entry -> entry.getValue() != null)
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElseGet(() -> configuredMethods.keySet().iterator().next());
    }

    public OffsetDateTime resolveEffectiveConfiguredAt(
            String effectiveMethod,
            OffsetDateTime recordedConfiguredAt,
            KeycloakSecondFactorSnapshot snapshot
    ) {
        String normalizedMethod = normalizeMethod(effectiveMethod);
        if (normalizedMethod == null) {
            return null;
        }

        return switch (normalizedMethod) {
            case METHOD_TOTP -> firstNonNull(snapshot.totpConfiguredAt(), recordedConfiguredAt);
            case METHOD_WEBAUTHN -> firstNonNull(snapshot.webauthnConfiguredAt(), recordedConfiguredAt);
            case METHOD_RECOVERY -> firstNonNull(snapshot.recoveryCodesConfiguredAt(), recordedConfiguredAt);
            default -> recordedConfiguredAt;
        };
    }

    private Map<String, OffsetDateTime> getConfiguredMethods(KeycloakSecondFactorSnapshot snapshot) {
        Map<String, OffsetDateTime> configuredMethods = new LinkedHashMap<>();
        if (snapshot == null) {
            return configuredMethods;
        }

        if (Boolean.TRUE.equals(snapshot.totpConfigured())) {
            configuredMethods.put(METHOD_TOTP, snapshot.totpConfiguredAt());
        }
        if (snapshot.webauthnCredentialCount() != null && snapshot.webauthnCredentialCount() > 0) {
            configuredMethods.put(METHOD_WEBAUTHN, snapshot.webauthnConfiguredAt());
        }
        if (Boolean.TRUE.equals(snapshot.recoveryCodesConfigured())) {
            configuredMethods.put(METHOD_RECOVERY, snapshot.recoveryCodesConfiguredAt());
        }

        return configuredMethods;
    }

    private OffsetDateTime firstNonNull(OffsetDateTime primary, OffsetDateTime fallback) {
        return primary != null ? primary : fallback;
    }

    private String normalizeMethod(String method) {
        if (method == null || method.isBlank()) {
            return null;
        }

        return switch (method.trim().toLowerCase(Locale.ROOT)) {
            case METHOD_TOTP -> METHOD_TOTP;
            case METHOD_WEBAUTHN, "security-key", "passkey" -> METHOD_WEBAUTHN;
            case METHOD_RECOVERY, "recovery-codes", "recovery-authn-codes" -> METHOD_RECOVERY;
            default -> method.trim().toLowerCase(Locale.ROOT);
        };
    }
}
