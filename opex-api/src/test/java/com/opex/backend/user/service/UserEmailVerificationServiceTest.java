package com.opex.backend.user.service;

import com.opex.backend.common.config.AppProperties;
import com.opex.backend.common.keycloak.KeycloakVerifyEmailProperties;
import com.opex.backend.common.keycloak.KeycloakWebProperties;
import com.opex.backend.user.dto.EmailVerificationStatusResponse;
import com.opex.backend.user.model.User;
import com.opex.backend.user.repository.UserRepository;
import com.opex.backend.user.service.support.KeycloakUserGateway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.keycloak.representations.idm.UserRepresentation;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserEmailVerificationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private KeycloakUserGateway keycloakUserGateway;

    private final KeycloakWebProperties keycloakWebProperties = new KeycloakWebProperties();
    private final KeycloakVerifyEmailProperties keycloakVerifyEmailProperties = new KeycloakVerifyEmailProperties();
    private final AppProperties appProperties = new AppProperties();

    private UserEmailVerificationService userEmailVerificationService;

    @BeforeEach
    void setUp() {
        userEmailVerificationService = new UserEmailVerificationService(
                userRepository,
                keycloakUserGateway,
                keycloakWebProperties,
                keycloakVerifyEmailProperties,
                appProperties
        );
    }

    @Test
    void sendVerificationEmailMarksGoogleUsersAsVerifiedWithoutSendingEmail() {
        User user = new User("user-1", "user@example.com", "User", "One");
        user.setIdentityProvider("google");
        user.setEmailVerified(false);

        UserRepresentation keycloakUser = new UserRepresentation();
        keycloakUser.setEmail("user@example.com");
        keycloakUser.setEmailVerified(false);

        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(keycloakUserGateway.loadUser("user-1")).thenReturn(keycloakUser);

        EmailVerificationStatusResponse response = userEmailVerificationService.sendVerificationEmail("user-1");

        assertTrue(response.emailVerified());
        assertFalse(response.verificationEmailSent());
        verify(keycloakUserGateway).updateUser(eq("user-1"), any(UserRepresentation.class));
        verify(userRepository).save(user);
        verify(keycloakUserGateway, never()).sendVerifyEmail(any(), any(), any(), any());
    }

    @Test
    void sendVerificationEmailReturnsCooldownWhenRecentlySent() {
        User user = new User("user-1", "user@example.com", "User", "One");
        user.setVerificationEmailLastSentAt(OffsetDateTime.now(ZoneOffset.UTC).minusSeconds(10));

        UserRepresentation keycloakUser = new UserRepresentation();
        keycloakUser.setEmail("user@example.com");
        keycloakUser.setEmailVerified(false);

        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(keycloakUserGateway.loadUser("user-1")).thenReturn(keycloakUser);

        EmailVerificationStatusResponse response = userEmailVerificationService.sendVerificationEmail("user-1");

        assertFalse(response.emailVerified());
        assertFalse(response.verificationEmailSent());
        assertTrue(response.cooldownRemainingSeconds() > 0);
        verify(keycloakUserGateway, never()).sendVerifyEmail(any(), any(), any(), any());
    }
}
