package com.opex.backend.user.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record UserSecurityStatusResponse(
        String preferredSecondFactor,
        Boolean secondFactorEnrollmentDeferred,
        String secondFactorMethod,
        OffsetDateTime secondFactorConfiguredAt,
        Boolean totpConfigured,
        Boolean webauthnConfigured,
        Integer webauthnCredentialCount,
        Boolean recoveryCodesConfigured,
        Boolean recoveryCodesAvailable,
        Integer recoveryCodesRemainingCount,
        Boolean recoveryCodesSetupPending,
        Boolean hasFallbackSecondFactor,
        List<String> availableSecondFactorMethods
) {
}
