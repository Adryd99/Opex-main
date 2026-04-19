package com.opex.backend.user.service.support;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record KeycloakProfileSnapshot(
        String email,
        Boolean emailVerified,
        OffsetDateTime registrationDate,
        String firstName,
        String lastName,
        LocalDate birthDate,
        String country,
        String occupation,
        String profilePicture,
        String identityProvider,
        String preferredSecondFactor,
        Boolean secondFactorEnrollmentDeferred,
        Boolean secondFactorStateLoaded,
        String secondFactorMethod,
        OffsetDateTime secondFactorConfiguredAt,
        Boolean totpConfigured,
        OffsetDateTime totpConfiguredAt,
        Integer webauthnCredentialCount,
        OffsetDateTime webauthnConfiguredAt,
        Boolean recoveryCodesConfigured,
        OffsetDateTime recoveryCodesConfiguredAt,
        Integer recoveryCodesRemainingCount,
        Boolean recoveryCodesSetupPending,
        Boolean legalAccepted,
        String legalVersion,
        String privacyPolicyVersion,
        OffsetDateTime privacyAcceptedAt,
        String termsOfServiceVersion,
        OffsetDateTime termsAcceptedAt,
        String cookiePolicyVersion,
        OffsetDateTime cookiePolicyAcknowledgedAt,
        Boolean strictlyNecessaryCookiesAcknowledged
) {
}
