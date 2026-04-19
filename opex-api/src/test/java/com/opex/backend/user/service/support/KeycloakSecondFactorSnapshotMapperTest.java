package com.opex.backend.user.service.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;

import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class KeycloakSecondFactorSnapshotMapperTest {

    private KeycloakSecondFactorSnapshotMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new KeycloakSecondFactorSnapshotMapper(new ObjectMapper());
    }

    @Test
    void mapsConfiguredMethodsAndAvailableRecoveryCodes() {
        UserRepresentation userRepresentation = new UserRepresentation();

        CredentialRepresentation totpCredential = new CredentialRepresentation();
        totpCredential.setType(CredentialRepresentation.TOTP);
        totpCredential.setCreatedDate(1_710_000_000_000L);

        CredentialRepresentation webauthnCredential = new CredentialRepresentation();
        webauthnCredential.setType("webauthn");
        webauthnCredential.setCreatedDate(1_720_000_000_000L);

        CredentialRepresentation recoveryCodesCredential = new CredentialRepresentation();
        recoveryCodesCredential.setType("recovery-authn-codes");
        recoveryCodesCredential.setCreatedDate(1_730_000_000_000L);
        recoveryCodesCredential.setCredentialData("""
                {"remainingCodes":7,"totalCodes":10}
                """);

        KeycloakSecondFactorSnapshot snapshot = mapper.from(
                userRepresentation,
                List.of(totpCredential, webauthnCredential, recoveryCodesCredential)
        );

        assertTrue(snapshot.totpConfigured());
        assertEquals(OffsetDateTime.parse("2024-03-09T16:00:00Z"), snapshot.totpConfiguredAt());
        assertEquals(1, snapshot.webauthnCredentialCount());
        assertEquals(OffsetDateTime.parse("2024-07-03T09:46:40Z"), snapshot.webauthnConfiguredAt());
        assertTrue(snapshot.recoveryCodesConfigured());
        assertEquals(OffsetDateTime.parse("2024-10-27T03:33:20Z"), snapshot.recoveryCodesConfiguredAt());
        assertEquals(7, snapshot.recoveryCodesRemainingCount());
        assertFalse(snapshot.recoveryCodesSetupPending());
    }

    @Test
    void marksRecoverySetupPendingWhenRequiredActionIsPresent() {
        UserRepresentation userRepresentation = new UserRepresentation();
        userRepresentation.setRequiredActions(List.of("CONFIGURE_RECOVERY_AUTHN_CODES"));

        KeycloakSecondFactorSnapshot snapshot = mapper.from(userRepresentation, List.of());

        assertFalse(snapshot.totpConfigured());
        assertNull(snapshot.totpConfiguredAt());
        assertEquals(0, snapshot.webauthnCredentialCount());
        assertNull(snapshot.webauthnConfiguredAt());
        assertFalse(snapshot.recoveryCodesConfigured());
        assertNull(snapshot.recoveryCodesConfiguredAt());
        assertEquals(0, snapshot.recoveryCodesRemainingCount());
        assertTrue(snapshot.recoveryCodesSetupPending());
    }
}
