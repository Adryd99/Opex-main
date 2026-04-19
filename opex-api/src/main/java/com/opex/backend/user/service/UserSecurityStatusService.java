package com.opex.backend.user.service;

import com.opex.backend.common.security.AuthenticatedUser;
import com.opex.backend.user.dto.UserSecurityStatusResponse;
import com.opex.backend.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserSecurityStatusService {

    private static final String METHOD_TOTP = "totp";
    private static final String METHOD_WEBAUTHN = "webauthn";
    private static final String METHOD_RECOVERY = "recovery";

    private final UserSyncService userSyncService;

    @Transactional
    public UserSecurityStatusResponse getSecurityStatus(AuthenticatedUser authenticatedUser) {
        User user = userSyncService.syncUserWithKeycloak(authenticatedUser);

        boolean totpConfigured = Boolean.TRUE.equals(user.getTotpConfigured());
        int webauthnCredentialCount = firstNonNegative(user.getWebauthnCredentialCount());
        boolean webauthnConfigured = webauthnCredentialCount > 0;
        boolean recoveryCodesConfigured = Boolean.TRUE.equals(user.getRecoveryCodesConfigured());
        int recoveryCodesRemainingCount = firstNonNegative(user.getRecoveryCodesRemainingCount());
        boolean recoveryCodesAvailable = recoveryCodesConfigured && recoveryCodesRemainingCount > 0;
        boolean recoveryCodesSetupPending = Boolean.TRUE.equals(user.getRecoveryCodesSetupPending());
        List<String> availableSecondFactorMethods = resolveAvailableMethods(totpConfigured, webauthnConfigured, recoveryCodesAvailable);

        return new UserSecurityStatusResponse(
                user.getPreferredSecondFactor(),
                user.getSecondFactorEnrollmentDeferred(),
                user.getSecondFactorMethod(),
                user.getSecondFactorConfiguredAt(),
                totpConfigured,
                webauthnConfigured,
                webauthnCredentialCount,
                recoveryCodesConfigured,
                recoveryCodesAvailable,
                recoveryCodesRemainingCount,
                recoveryCodesSetupPending,
                hasFallbackSecondFactor(user.getSecondFactorMethod(), availableSecondFactorMethods),
                availableSecondFactorMethods
        );
    }

    private List<String> resolveAvailableMethods(boolean totpConfigured, boolean webauthnConfigured, boolean recoveryCodesAvailable) {
        List<String> availableMethods = new ArrayList<>();
        if (totpConfigured) {
            availableMethods.add(METHOD_TOTP);
        }
        if (webauthnConfigured) {
            availableMethods.add(METHOD_WEBAUTHN);
        }
        if (recoveryCodesAvailable) {
            availableMethods.add(METHOD_RECOVERY);
        }
        return List.copyOf(availableMethods);
    }

    private boolean hasFallbackSecondFactor(String primaryMethod, List<String> availableMethods) {
        if (availableMethods.size() <= 1) {
            return false;
        }

        String normalizedPrimaryMethod = normalizeMethod(primaryMethod);
        if (normalizedPrimaryMethod == null) {
            return true;
        }

        return availableMethods.stream().anyMatch(method -> !method.equals(normalizedPrimaryMethod));
    }

    private String normalizeMethod(String method) {
        if (method == null || method.isBlank()) {
            return null;
        }

        return switch (method.trim().toLowerCase(Locale.ROOT)) {
            case "totp" -> METHOD_TOTP;
            case "webauthn", "security-key", "passkey" -> METHOD_WEBAUTHN;
            case "recovery", "recovery-codes", "recovery-codes-authn", "recovery-authn-codes" -> METHOD_RECOVERY;
            default -> method.trim().toLowerCase(Locale.ROOT);
        };
    }

    private int firstNonNegative(Integer value) {
        return value == null || value < 0 ? 0 : value;
    }
}
