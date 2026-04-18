package com.opex.backend.user.service;

import com.opex.backend.common.config.AppProperties;
import com.opex.backend.common.exception.ResourceNotFoundException;
import com.opex.backend.common.keycloak.KeycloakVerifyEmailProperties;
import com.opex.backend.common.keycloak.KeycloakWebProperties;
import com.opex.backend.user.dto.EmailVerificationStatusResponse;
import com.opex.backend.user.model.User;
import com.opex.backend.user.repository.UserRepository;
import com.opex.backend.user.service.support.KeycloakUserGateway;
import lombok.RequiredArgsConstructor;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static com.opex.backend.user.service.support.UserValueSupport.firstNonBlank;
import static com.opex.backend.user.service.support.UserValueSupport.normalizeWebBaseUrl;

@Service
@RequiredArgsConstructor
public class UserEmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(UserEmailVerificationService.class);
    private static final Duration VERIFICATION_EMAIL_COOLDOWN = Duration.ofMinutes(1);

    private final UserRepository userRepository;
    private final KeycloakUserGateway keycloakUserGateway;
    private final KeycloakWebProperties keycloakWebProperties;
    private final KeycloakVerifyEmailProperties keycloakVerifyEmailProperties;
    private final AppProperties appProperties;

    @Transactional
    public EmailVerificationStatusResponse sendVerificationEmail(String keycloakId) {
        User user = userRepository.findById(keycloakId)
                .orElseThrow(() -> new ResourceNotFoundException("Utente non trovato nel DB locale"));

        UserRepresentation keycloakUser = keycloakUserGateway.loadUser(keycloakId);

        if (keycloakUser == null || keycloakUser.getEmail() == null || keycloakUser.getEmail().isBlank()) {
            throw new IllegalStateException("Cannot send a verification email without a valid email address.");
        }

        if ("google".equalsIgnoreCase(firstNonBlank(user.getIdentityProvider()))) {
            if (!Boolean.TRUE.equals(keycloakUser.isEmailVerified())) {
                keycloakUser.setEmailVerified(true);
                keycloakUserGateway.updateUser(keycloakId, keycloakUser);
            }

            if (!Boolean.TRUE.equals(user.getEmailVerified())) {
                user.setEmailVerified(true);
                userRepository.save(user);
            }

            return new EmailVerificationStatusResponse(true, false, 0);
        }

        if (Boolean.TRUE.equals(keycloakUser.isEmailVerified())) {
            if (!Boolean.TRUE.equals(user.getEmailVerified())) {
                user.setEmailVerified(true);
                userRepository.save(user);
            }
            return new EmailVerificationStatusResponse(true, false, 0);
        }

        long cooldownRemainingSeconds = getVerificationCooldownRemainingSeconds(user.getVerificationEmailLastSentAt());
        if (cooldownRemainingSeconds > 0) {
            return new EmailVerificationStatusResponse(false, false, cooldownRemainingSeconds);
        }

        keycloakUserGateway.sendVerifyEmail(
                keycloakId,
                keycloakWebProperties.getClientId(),
                normalizeWebBaseUrl(appProperties.getWeb().getBaseUrl()),
                keycloakVerifyEmailProperties.getLifespanSeconds()
        );
        user.setVerificationEmailLastSentAt(OffsetDateTime.now(ZoneOffset.UTC));
        userRepository.save(user);

        log.info("Sent verify-email link through Keycloak for '{}'", keycloakId);
        return new EmailVerificationStatusResponse(false, true, VERIFICATION_EMAIL_COOLDOWN.toSeconds());
    }

    private long getVerificationCooldownRemainingSeconds(OffsetDateTime lastSentAt) {
        if (lastSentAt == null) {
            return 0;
        }

        OffsetDateTime availableAt = lastSentAt.plus(VERIFICATION_EMAIL_COOLDOWN);
        Duration remaining = Duration.between(OffsetDateTime.now(ZoneOffset.UTC), availableAt);
        if (remaining.isNegative() || remaining.isZero()) {
            return 0;
        }

        long seconds = remaining.getSeconds();
        return remaining.getNano() > 0 ? seconds + 1 : seconds;
    }
}
