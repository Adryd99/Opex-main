package com.opex.backend.user.dto;

public record EmailVerificationStatusResponse(
        boolean emailVerified,
        boolean verificationEmailSent,
        long cooldownRemainingSeconds
) {
}
