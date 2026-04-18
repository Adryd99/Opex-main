package com.opex.backend.user.service.support;

import com.opex.backend.common.keycloak.KeycloakAdminProperties;
import com.opex.backend.common.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.FederatedIdentityRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class KeycloakUserGateway {

    private static final Logger log = LoggerFactory.getLogger(KeycloakUserGateway.class);

    private final Keycloak keycloak;
    private final KeycloakAdminProperties keycloakAdminProperties;

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

    public KeycloakProfileSnapshot loadProfileSnapshot(AuthenticatedUser authenticatedUser) {
        UserRepresentation keycloakUser = null;
        UserResource userResource = null;

        try {
            userResource = getUserResource(authenticatedUser.userId());
            keycloakUser = userResource.toRepresentation();
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
                KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.PREFERRED_SECOND_FACTOR),
                UserValueSupport.parseBoolean(KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.SECOND_FACTOR_ENROLLMENT_DEFERRED)),
                KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.SECOND_FACTOR_METHOD),
                UserValueSupport.parseOffsetDateTime(KeycloakUserAttributes.getAttribute(attributes, UserAttributeNames.SECOND_FACTOR_CONFIGURED_AT)),
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
