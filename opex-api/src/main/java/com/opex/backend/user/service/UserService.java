package com.opex.backend.user.service;

import com.opex.backend.common.security.AuthenticatedUser;
import com.opex.backend.user.dto.EmailVerificationStatusResponse;
import com.opex.backend.user.dto.UserUpdateRequest;
import com.opex.backend.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserSyncService userSyncService;
    private final UserProfileUpdateService userProfileUpdateService;
    private final UserEmailVerificationService userEmailVerificationService;
    private final UserLifecycleService userLifecycleService;

    public User syncUserWithKeycloak(AuthenticatedUser authenticatedUser) {
        return userSyncService.syncUserWithKeycloak(authenticatedUser);
    }

    public User updateAdditionalData(String keycloakId, UserUpdateRequest request) {
        return userProfileUpdateService.updateAdditionalData(keycloakId, request);
    }

    public EmailVerificationStatusResponse sendVerificationEmail(String keycloakId) {
        return userEmailVerificationService.sendVerificationEmail(keycloakId);
    }

    public void deleteUser(String keycloakId) {
        userLifecycleService.deleteUser(keycloakId);
    }
}
