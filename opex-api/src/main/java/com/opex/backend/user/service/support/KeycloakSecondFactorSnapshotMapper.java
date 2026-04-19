package com.opex.backend.user.service.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class KeycloakSecondFactorSnapshotMapper {

    private static final String RECOVERY_AUTHN_CODES_REQUIRED_ACTION = "CONFIGURE_RECOVERY_AUTHN_CODES";
    private static final String WEBAUTHN_CREDENTIAL_TYPE = "webauthn";
    private static final String RECOVERY_CODES_CREDENTIAL_TYPE = "recovery-authn-codes";

    private final ObjectMapper objectMapper;

    public KeycloakSecondFactorSnapshot from(UserRepresentation userRepresentation, List<CredentialRepresentation> credentials) {
        Boolean recoveryCodesSetupPending = hasRequiredAction(userRepresentation, RECOVERY_AUTHN_CODES_REQUIRED_ACTION);
        if (credentials == null) {
            return new KeycloakSecondFactorSnapshot(
                    false,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    recoveryCodesSetupPending
            );
        }

        OffsetDateTime totpConfiguredAt = credentials.stream()
                .filter(credential -> hasType(credential, CredentialRepresentation.TOTP))
                .map(CredentialRepresentation::getCreatedDate)
                .map(UserValueSupport::toOffsetDateTime)
                .reduce(this::latestOffsetDateTime)
                .orElse(null);

        List<CredentialRepresentation> webauthnCredentials = credentials.stream()
                .filter(credential -> hasType(credential, WEBAUTHN_CREDENTIAL_TYPE))
                .toList();
        OffsetDateTime webauthnConfiguredAt = webauthnCredentials.stream()
                .map(CredentialRepresentation::getCreatedDate)
                .map(UserValueSupport::toOffsetDateTime)
                .reduce(this::latestOffsetDateTime)
                .orElse(null);

        List<CredentialRepresentation> recoveryCodeCredentials = credentials.stream()
                .filter(credential -> hasType(credential, RECOVERY_CODES_CREDENTIAL_TYPE))
                .toList();
        CredentialRepresentation recoveryCredential = recoveryCodeCredentials.stream()
                .findFirst()
                .orElse(null);
        OffsetDateTime recoveryCodesConfiguredAt = recoveryCodeCredentials.stream()
                .map(CredentialRepresentation::getCreatedDate)
                .map(UserValueSupport::toOffsetDateTime)
                .reduce(this::latestOffsetDateTime)
                .orElse(null);

        Integer recoveryCodesRemainingCount = extractRemainingRecoveryCodes(recoveryCredential);

        return new KeycloakSecondFactorSnapshot(
                true,
                totpConfiguredAt != null,
                totpConfiguredAt,
                webauthnCredentials.size(),
                webauthnConfiguredAt,
                recoveryCredential != null,
                recoveryCodesConfiguredAt,
                recoveryCodesRemainingCount,
                recoveryCodesSetupPending
        );
    }

    private boolean hasType(CredentialRepresentation credentialRepresentation, String expectedType) {
        if (credentialRepresentation == null || expectedType == null) {
            return false;
        }

        String type = credentialRepresentation.getType();
        return type != null && expectedType.equalsIgnoreCase(type);
    }

    private Boolean hasRequiredAction(UserRepresentation userRepresentation, String requiredAction) {
        if (userRepresentation == null || userRepresentation.getRequiredActions() == null) {
            return false;
        }

        return userRepresentation.getRequiredActions().stream()
                .filter(action -> action != null)
                .map(action -> action.trim().toUpperCase(Locale.ROOT))
                .anyMatch(requiredAction::equalsIgnoreCase);
    }

    private OffsetDateTime latestOffsetDateTime(OffsetDateTime left, OffsetDateTime right) {
        if (left == null) {
            return right;
        }
        if (right == null) {
            return left;
        }
        return left.isAfter(right) ? left : right;
    }

    private Integer extractRemainingRecoveryCodes(CredentialRepresentation credentialRepresentation) {
        if (credentialRepresentation == null || credentialRepresentation.getCredentialData() == null || credentialRepresentation.getCredentialData().isBlank()) {
            return 0;
        }

        try {
            JsonNode credentialData = objectMapper.readTree(credentialRepresentation.getCredentialData());
            JsonNode remainingCodes = credentialData.get("remainingCodes");
            if (remainingCodes == null || remainingCodes.isNull()) {
                return 0;
            }
            return remainingCodes.asInt(0);
        } catch (Exception ignored) {
            return 0;
        }
    }
}
