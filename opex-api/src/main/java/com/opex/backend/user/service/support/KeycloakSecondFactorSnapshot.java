package com.opex.backend.user.service.support;

import java.time.OffsetDateTime;

public record KeycloakSecondFactorSnapshot(
        Boolean stateLoaded,
        Boolean totpConfigured,
        OffsetDateTime totpConfiguredAt,
        Integer webauthnCredentialCount,
        OffsetDateTime webauthnConfiguredAt,
        Boolean recoveryCodesConfigured,
        OffsetDateTime recoveryCodesConfiguredAt,
        Integer recoveryCodesRemainingCount,
        Boolean recoveryCodesSetupPending
) {
}
