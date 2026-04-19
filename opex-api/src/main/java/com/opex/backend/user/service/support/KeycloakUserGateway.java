package com.opex.backend.user.service.support;

import com.opex.backend.common.keycloak.KeycloakAdminProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opex.backend.common.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.FederatedIdentityRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class KeycloakUserGateway {

    private static final Logger log = LoggerFactory.getLogger(KeycloakUserGateway.class);
    private static final String METHOD_TOTP = "totp";
    private static final String METHOD_WEBAUTHN = "webauthn";
    private static final String METHOD_RECOVERY = "recovery";
    private static final String OTP_CREDENTIAL_TYPE = "otp";
    private static final String TOTP_SUBTYPE = "totp";
    private static final String WEBAUTHN_CREDENTIAL_TYPE = "webauthn";
    private static final String RECOVERY_CODES_CREDENTIAL_TYPE = "recovery-authn-codes";

    private final Keycloak keycloak;
    private final KeycloakAdminProperties keycloakAdminProperties;
    private final KeycloakSecondFactorSnapshotMapper keycloakSecondFactorSnapshotMapper;
    private final KeycloakSecondFactorStateResolver keycloakSecondFactorStateResolver;
    private final ObjectMapper objectMapper;

    public UserRepresentation loadUser(String keycloakId) {
        return getUserResource(keycloakId).toRepresentation();
    }

    public void updateUser(String keycloakId, UserRepresentation userRepresentation) {
        getUserResource(keycloakId).update(userRepresentation);
    }

    public void deleteUser(String keycloakId) {
        getUserResource(keycloakId).remove();
    }

    public void sendVerifyEmail(String keycloakId, String clientId, String redirectUri, Integer lifespanSeconds) {
        getUserResource(keycloakId).sendVerifyEmail(clientId, redirectUri, lifespanSeconds);
    }

    public void updatePreferredSecondFactor(String keycloakId, String preferredMethod) {
        UserResource userResource = getUserResource(keycloakId);
        UserRepresentation userRepresentation = userResource.toRepresentation();
        Map<String, List<String>> attributes = userRepresentation.getAttributes() == null
                ? new HashMap<>()
                : new HashMap<>(userRepresentation.getAttributes());

        attributes.put(UserAttributeNames.PREFERRED_SECOND_FACTOR, List.of(preferredMethod));
        userRepresentation.setAttributes(attributes);

        userResource.update(userRepresentation);
    }

    public void reorderSecondFactorCredentials(String keycloakId, String preferredMethod) {
        UserResource userResource = getUserResource(keycloakId);
        List<CredentialRepresentation> credentials = userResource.credentials();
        if (credentials == null || credentials.isEmpty()) {
            return;
        }

        List<String> targetOrder = buildCredentialOrder(credentials, preferredMethod);
        List<String> currentOrder = credentials.stream()
                .map(CredentialRepresentation::getId)
                .filter(Objects::nonNull)
                .toList();

        if (targetOrder.isEmpty() || currentOrder.equals(targetOrder)) {
            return;
        }

        String firstCredentialId = targetOrder.get(0);
        if (!Objects.equals(currentOrder.get(0), firstCredentialId)) {
            userResource.moveCredentialToFirst(firstCredentialId);
        }

        for (int index = 1; index < targetOrder.size(); index++) {
            userResource.moveCredentialAfter(targetOrder.get(index), targetOrder.get(index - 1));
        }
    }

    public KeycloakProfileSnapshot loadProfileSnapshot(AuthenticatedUser authenticatedUser) {
        UserRepresentation keycloakUser = null;
        UserResource userResource = null;
        List<CredentialRepresentation> credentials = null;

        try {
            userResource = getUserResource(authenticatedUser.userId());
            keycloakUser = userResource.toRepresentation();
            credentials = userResource.credentials();
        } catch (Exception exception) {
            log.warn("Unable to load Keycloak profile for '{}', falling back to JWT claims only", authenticatedUser.userId(), exception);
        }

        Map<String, List<String>> attributes = keycloakUser != null && keycloakUser.getAttributes() != null
                ? keycloakUser.getAttributes()
                : Map.of();
        String identityProvider = UserValueSupport.firstNonBlank(resolveIdentityProvider(userResource), authenticatedUser.identityProvider());

        String email = UserValueSupport.firstNonBlank(keycloakUser != null ? keycloakUser.getEmail() : null, authenticatedUser.email());
        Boolean emailVerified = keycloakUser != null ? keycloakUser.isEmailVerified() : null;
        String firstName = UserValueSupport.firstNonBlank(keycloakUser != null ? keycloakUser.getFirstName() : null, authenticatedUser.firstName());
        String lastName = UserValueSupport.firstNonBlank(keycloakUser != null ? keycloakUser.getLastName() : null, authenticatedUser.lastName());
        KeycloakSecondFactorSnapshot secondFactorSnapshot = keycloakSecondFactorSnapshotMapper.from(keycloakUser, credentials);
        String preferredSecondFactor = KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.PREFERRED_SECOND_FACTOR);
        String recordedSecondFactorMethod = KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.SECOND_FACTOR_METHOD);
        OffsetDateTime recordedSecondFactorConfiguredAt = UserValueSupport.parseOffsetDateTime(
                KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.SECOND_FACTOR_CONFIGURED_AT)
        );
        String effectiveSecondFactorMethod = keycloakSecondFactorStateResolver.resolveEffectiveMethod(
                preferredSecondFactor,
                recordedSecondFactorMethod,
                secondFactorSnapshot
        );
        OffsetDateTime effectiveSecondFactorConfiguredAt = keycloakSecondFactorStateResolver.resolveEffectiveConfiguredAt(
                effectiveSecondFactorMethod,
                recordedSecondFactorConfiguredAt,
                secondFactorSnapshot
        );

        return new KeycloakProfileSnapshot(
                email,
                emailVerified,
                keycloakUser != null ? UserValueSupport.toOffsetDateTime(keycloakUser.getCreatedTimestamp()) : null,
                firstName,
                lastName,
                UserValueSupport.firstNonNull(
                        UserValueSupport.parseLocalDate(KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.BIRTH_DATE)),
                        authenticatedUser.birthDate()
                ),
                UserValueSupport.normalizeCountryCode(
                        UserValueSupport.firstNonBlank(
                                KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.COUNTRY),
                                authenticatedUser.country()
                        )
                ),
                UserValueSupport.firstNonBlank(
                        KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.OCCUPATION),
                        authenticatedUser.occupation()
                ),
                UserValueSupport.firstNonBlank(
                        KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.PROFILE_PICTURE),
                        authenticatedUser.profilePicture()
                ),
                identityProvider,
                preferredSecondFactor,
                UserValueSupport.parseBoolean(KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.SECOND_FACTOR_ENROLLMENT_DEFERRED)),
                secondFactorSnapshot.stateLoaded(),
                effectiveSecondFactorMethod,
                effectiveSecondFactorConfiguredAt,
                secondFactorSnapshot.totpConfigured(),
                secondFactorSnapshot.totpConfiguredAt(),
                secondFactorSnapshot.webauthnCredentialCount(),
                secondFactorSnapshot.webauthnConfiguredAt(),
                secondFactorSnapshot.recoveryCodesConfigured(),
                secondFactorSnapshot.recoveryCodesConfiguredAt(),
                secondFactorSnapshot.recoveryCodesRemainingCount(),
                secondFactorSnapshot.recoveryCodesSetupPending(),
                UserValueSupport.firstNonNull(
                        UserValueSupport.parseBoolean(KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.LEGAL_ACCEPTED)),
                        authenticatedUser.legalAccepted()
                ),
                KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.LEGAL_VERSION),
                KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.PRIVACY_POLICY_VERSION),
                UserValueSupport.parseOffsetDateTime(KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.PRIVACY_ACCEPTED_AT)),
                KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.TERMS_OF_SERVICE_VERSION),
                UserValueSupport.parseOffsetDateTime(KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.TERMS_ACCEPTED_AT)),
                KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.COOKIE_POLICY_VERSION),
                UserValueSupport.parseOffsetDateTime(KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.COOKIE_POLICY_ACKNOWLEDGED_AT)),
                UserValueSupport.parseBoolean(KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.STRICTLY_NECESSARY_COOKIES_ACKNOWLEDGED))
        );
    }

    private UserResource getUserResource(String keycloakId) {
        return keycloak.realm(keycloakAdminProperties.getTargetRealm()).users().get(keycloakId);
    }

    private List<String> buildCredentialOrder(List<CredentialRepresentation> credentials, String preferredMethod) {
        List<String> otherCredentialIds = new ArrayList<>();
        List<String> preferredMethodCredentialIds = new ArrayList<>();
        List<String> secondarySecondFactorCredentialIds = new ArrayList<>();
        List<String> recoveryCredentialIds = new ArrayList<>();

        for (CredentialRepresentation credential : credentials) {
            String credentialId = credential.getId();
            if (credentialId == null) {
                continue;
            }

            if (isRecoveryCredential(credential)) {
                recoveryCredentialIds.add(credentialId);
                continue;
            }

            if (matchesMethod(credential, preferredMethod)) {
                preferredMethodCredentialIds.add(credentialId);
                continue;
            }

            if (isSelectableSecondFactorCredential(credential)) {
                secondarySecondFactorCredentialIds.add(credentialId);
                continue;
            }

            otherCredentialIds.add(credentialId);
        }

        List<String> orderedCredentialIds = new ArrayList<>(credentials.size());
        orderedCredentialIds.addAll(otherCredentialIds);
        orderedCredentialIds.addAll(preferredMethodCredentialIds);
        orderedCredentialIds.addAll(secondarySecondFactorCredentialIds);
        orderedCredentialIds.addAll(recoveryCredentialIds);
        return orderedCredentialIds;
    }

    private boolean isSelectableSecondFactorCredential(CredentialRepresentation credentialRepresentation) {
        return isTotpCredential(credentialRepresentation) || isWebauthnCredential(credentialRepresentation);
    }

    private boolean matchesMethod(CredentialRepresentation credentialRepresentation, String preferredMethod) {
        return switch (preferredMethod) {
            case METHOD_TOTP -> isTotpCredential(credentialRepresentation);
            case METHOD_WEBAUTHN -> isWebauthnCredential(credentialRepresentation);
            default -> false;
        };
    }

    private boolean isTotpCredential(CredentialRepresentation credentialRepresentation) {
        if (credentialRepresentation == null) {
            return false;
        }

        if (hasType(credentialRepresentation, CredentialRepresentation.TOTP)) {
            return true;
        }

        if (!hasType(credentialRepresentation, OTP_CREDENTIAL_TYPE)) {
            return false;
        }

        return hasCredentialSubType(credentialRepresentation, TOTP_SUBTYPE);
    }

    private boolean isWebauthnCredential(CredentialRepresentation credentialRepresentation) {
        return hasType(credentialRepresentation, WEBAUTHN_CREDENTIAL_TYPE);
    }

    private boolean isRecoveryCredential(CredentialRepresentation credentialRepresentation) {
        return hasType(credentialRepresentation, RECOVERY_CODES_CREDENTIAL_TYPE);
    }

    private boolean hasType(CredentialRepresentation credentialRepresentation, String expectedType) {
        if (credentialRepresentation == null || expectedType == null) {
            return false;
        }

        String type = credentialRepresentation.getType();
        return type != null && expectedType.equalsIgnoreCase(type);
    }

    private boolean hasCredentialSubType(CredentialRepresentation credentialRepresentation, String expectedSubType) {
        if (credentialRepresentation == null || expectedSubType == null) {
            return false;
        }

        String credentialDataRaw = credentialRepresentation.getCredentialData();
        if (credentialDataRaw == null || credentialDataRaw.isBlank()) {
            return false;
        }

        try {
            JsonNode credentialData = objectMapper.readTree(credentialDataRaw);
            JsonNode subType = credentialData.get("subType");
            return subType != null && !subType.isNull() && expectedSubType.equalsIgnoreCase(subType.asText());
        } catch (Exception exception) {
            return false;
        }
    }

    private String resolveIdentityProvider(UserResource userResource) {
        if (userResource == null) {
            return null;
        }

        try {
            List<FederatedIdentityRepresentation> federatedIdentities = userResource.getFederatedIdentity();
            if (federatedIdentities == null || federatedIdentities.isEmpty()) {
                return null;
            }

            for (FederatedIdentityRepresentation federatedIdentity : federatedIdentities) {
                if (federatedIdentity != null && "google".equalsIgnoreCase(UserValueSupport.firstNonBlank(federatedIdentity.getIdentityProvider()))) {
                    return "google";
                }
            }

            for (FederatedIdentityRepresentation federatedIdentity : federatedIdentities) {
                if (federatedIdentity != null) {
                    return UserValueSupport.firstNonBlank(federatedIdentity.getIdentityProvider());
                }
            }
        } catch (Exception exception) {
            log.warn("Unable to load federated identities", exception);
        }

        return null;
    }
}
