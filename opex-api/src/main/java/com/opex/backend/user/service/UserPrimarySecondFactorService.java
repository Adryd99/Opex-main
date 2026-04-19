package com.opex.backend.user.service;

import com.opex.backend.common.exception.BadRequestException;
import com.opex.backend.common.security.AuthenticatedUser;
import com.opex.backend.user.dto.UserSecurityStatusResponse;
import com.opex.backend.user.model.User;
import com.opex.backend.user.service.support.KeycloakUserGateway;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserPrimarySecondFactorService {

    private static final String METHOD_TOTP = "totp";
    private static final String METHOD_WEBAUTHN = "webauthn";

    private final UserSyncService userSyncService;
    private final UserSecurityStatusService userSecurityStatusService;
    private final KeycloakUserGateway keycloakUserGateway;

    @Transactional
    public UserSecurityStatusResponse setPrimarySecondFactor(AuthenticatedUser authenticatedUser, String requestedMethod) {
        String normalizedMethod = normalizeMethod(requestedMethod);
        User user = userSyncService.syncUserWithKeycloak(authenticatedUser);

        validateConfiguredMethod(user, normalizedMethod);

        keycloakUserGateway.updatePreferredSecondFactor(authenticatedUser.userId(), normalizedMethod);
        keycloakUserGateway.reorderSecondFactorCredentials(authenticatedUser.userId(), normalizedMethod);

        return userSecurityStatusService.getSecurityStatus(authenticatedUser);
    }

    private void validateConfiguredMethod(User user, String method) {
        switch (method) {
            case METHOD_TOTP -> {
                if (!Boolean.TRUE.equals(user.getTotpConfigured())) {
                    throw new BadRequestException("Authenticator app is not configured for this account.");
                }
            }
            case METHOD_WEBAUTHN -> {
                if (user.getWebauthnCredentialCount() == null || user.getWebauthnCredentialCount() <= 0) {
                    throw new BadRequestException("Passkey or security key is not configured for this account.");
                }
            }
            default -> throw new BadRequestException("Unsupported primary second-factor method.");
        }
    }

    private String normalizeMethod(String method) {
        if (method == null || method.isBlank()) {
            throw new BadRequestException("Primary second-factor method is required.");
        }

        return switch (method.trim().toLowerCase(Locale.ROOT)) {
            case METHOD_TOTP -> METHOD_TOTP;
            case METHOD_WEBAUTHN, "passkey", "security-key" -> METHOD_WEBAUTHN;
            default -> throw new BadRequestException("Unsupported primary second-factor method.");
        };
    }
}
