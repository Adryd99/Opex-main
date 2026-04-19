package com.opex.backend.user.service.support;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class KeycloakSecondFactorStateResolverTest {

    private KeycloakSecondFactorStateResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new KeycloakSecondFactorStateResolver();
    }

    @Test
    void prefersConfiguredPreferredMethodWhenAvailable() {
        KeycloakSecondFactorSnapshot snapshot = new KeycloakSecondFactorSnapshot(
                true,
                true,
                OffsetDateTime.parse("2026-04-01T10:00:00Z"),
                1,
                OffsetDateTime.parse("2026-04-05T10:00:00Z"),
                true,
                OffsetDateTime.parse("2026-04-06T10:00:00Z"),
                8,
                false
        );

        String effectiveMethod = resolver.resolveEffectiveMethod("totp", "webauthn", snapshot);
        OffsetDateTime effectiveConfiguredAt = resolver.resolveEffectiveConfiguredAt(effectiveMethod, null, snapshot);

        assertEquals("totp", effectiveMethod);
        assertEquals(OffsetDateTime.parse("2026-04-01T10:00:00Z"), effectiveConfiguredAt);
    }

    @Test
    void fallsBackToLatestConfiguredMethodWhenRecordedStateIsMissing() {
        KeycloakSecondFactorSnapshot snapshot = new KeycloakSecondFactorSnapshot(
                true,
                true,
                OffsetDateTime.parse("2026-04-01T10:00:00Z"),
                1,
                OffsetDateTime.parse("2026-04-05T10:00:00Z"),
                false,
                null,
                0,
                false
        );

        String effectiveMethod = resolver.resolveEffectiveMethod(null, null, snapshot);
        OffsetDateTime effectiveConfiguredAt = resolver.resolveEffectiveConfiguredAt(effectiveMethod, null, snapshot);

        assertEquals("webauthn", effectiveMethod);
        assertEquals(OffsetDateTime.parse("2026-04-05T10:00:00Z"), effectiveConfiguredAt);
    }

    @Test
    void returnsNullWhenNoSecondFactorIsConfigured() {
        KeycloakSecondFactorSnapshot snapshot = new KeycloakSecondFactorSnapshot(
                true,
                false,
                null,
                0,
                null,
                false,
                null,
                0,
                false
        );

        assertNull(resolver.resolveEffectiveMethod("totp", "totp", snapshot));
        assertNull(resolver.resolveEffectiveConfiguredAt(null, OffsetDateTime.parse("2026-04-01T10:00:00Z"), snapshot));
    }
}
