package com.opex.backend.user.service;

import com.opex.backend.common.exception.BadRequestException;
import com.opex.backend.common.security.AuthenticatedUser;
import com.opex.backend.user.dto.UserSecurityStatusResponse;
import com.opex.backend.user.model.User;
import com.opex.backend.user.service.support.KeycloakUserGateway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserPrimarySecondFactorServiceTest {

    @Mock
    private UserSyncService userSyncService;

    @Mock
    private UserSecurityStatusService userSecurityStatusService;

    @Mock
    private KeycloakUserGateway keycloakUserGateway;

    private UserPrimarySecondFactorService userPrimarySecondFactorService;

    @BeforeEach
    void setUp() {
        userPrimarySecondFactorService = new UserPrimarySecondFactorService(
                userSyncService,
                userSecurityStatusService,
                keycloakUserGateway
        );
    }

    @Test
    void setPrimarySecondFactorReordersCredentialsForTotp() {
        AuthenticatedUser authenticatedUser = authenticatedUser("user-1");
        User user = new User("user-1", "user@example.com", "User", "One");
        user.setTotpConfigured(true);
        user.setWebauthnCredentialCount(1);

        UserSecurityStatusResponse refreshedStatus = new UserSecurityStatusResponse(
                "totp",
                false,
                "totp",
                null,
                true,
                true,
                1,
                true,
                true,
                8,
                false,
                true,
                List.of("totp", "webauthn", "recovery")
        );

        when(userSyncService.syncUserWithKeycloak(authenticatedUser)).thenReturn(user);
        when(userSecurityStatusService.getSecurityStatus(authenticatedUser)).thenReturn(refreshedStatus);

        UserSecurityStatusResponse response = userPrimarySecondFactorService.setPrimarySecondFactor(authenticatedUser, "totp");

        assertEquals("totp", response.secondFactorMethod());
        verify(keycloakUserGateway).updatePreferredSecondFactor("user-1", "totp");
        verify(keycloakUserGateway).reorderSecondFactorCredentials("user-1", "totp");
    }

    @Test
    void setPrimarySecondFactorAcceptsPasskeyAliasForWebauthn() {
        AuthenticatedUser authenticatedUser = authenticatedUser("user-2");
        User user = new User("user-2", "user@example.com", "User", "Two");
        user.setTotpConfigured(true);
        user.setWebauthnCredentialCount(2);

        UserSecurityStatusResponse refreshedStatus = new UserSecurityStatusResponse(
                "webauthn",
                false,
                "webauthn",
                null,
                true,
                true,
                2,
                true,
                true,
                10,
                false,
                true,
                List.of("totp", "webauthn", "recovery")
        );

        when(userSyncService.syncUserWithKeycloak(authenticatedUser)).thenReturn(user);
        when(userSecurityStatusService.getSecurityStatus(authenticatedUser)).thenReturn(refreshedStatus);

        UserSecurityStatusResponse response = userPrimarySecondFactorService.setPrimarySecondFactor(authenticatedUser, "passkey");

        assertEquals("webauthn", response.secondFactorMethod());
        verify(keycloakUserGateway).updatePreferredSecondFactor("user-2", "webauthn");
        verify(keycloakUserGateway).reorderSecondFactorCredentials("user-2", "webauthn");
    }

    @Test
    void setPrimarySecondFactorRejectsMethodThatIsNotConfigured() {
        AuthenticatedUser authenticatedUser = authenticatedUser("user-3");
        User user = new User("user-3", "user@example.com", "User", "Three");
        user.setTotpConfigured(false);
        user.setWebauthnCredentialCount(0);

        when(userSyncService.syncUserWithKeycloak(authenticatedUser)).thenReturn(user);

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> userPrimarySecondFactorService.setPrimarySecondFactor(authenticatedUser, "totp")
        );

        assertEquals("Authenticator app is not configured for this account.", exception.getMessage());
        verify(keycloakUserGateway, never()).updatePreferredSecondFactor("user-3", "totp");
        verify(keycloakUserGateway, never()).reorderSecondFactorCredentials("user-3", "totp");
    }

    private AuthenticatedUser authenticatedUser(String userId) {
        return new AuthenticatedUser(
                userId,
                "user@example.com",
                "User",
                "Example",
                null,
                null,
                null,
                null,
                null,
                null
        );
    }
}
