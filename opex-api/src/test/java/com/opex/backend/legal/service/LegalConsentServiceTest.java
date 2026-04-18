package com.opex.backend.legal.service;

import com.opex.backend.legal.config.LegalProperties;
import com.opex.backend.legal.dto.LegalConsentRequest;
import com.opex.backend.user.model.User;
import com.opex.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LegalConsentServiceTest {

    @Mock
    private UserRepository userRepository;

    private final LegalProperties legalProperties = new LegalProperties();

    private LegalConsentService legalConsentService;

    @BeforeEach
    void setUp() {
        legalConsentService = new LegalConsentService(legalProperties, userRepository);
    }

    @Test
    void acceptRequiredConsentsStoresCurrentVersionsAndMarksGdprAccepted() {
        legalProperties.getPolicy().setPrivacyVersion("2026-04-09");
        legalProperties.getPolicy().setTermsVersion("2026-04-09");
        legalProperties.getPolicy().setCookieVersion("2026-04-09");

        User user = new User("user-1", "user@example.com", "User", "One");
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LegalConsentRequest request = new LegalConsentRequest(
                true,
                "2026-04-09",
                true,
                "2026-04-09",
                true,
                "2026-04-09"
        );

        User updatedUser = legalConsentService.acceptRequiredConsents("user-1", request);

        assertEquals("2026-04-09", updatedUser.getPrivacyPolicyVersion());
        assertEquals("2026-04-09", updatedUser.getTermsOfServiceVersion());
        assertEquals("2026-04-09", updatedUser.getCookiePolicyVersion());
        assertNotNull(updatedUser.getPrivacyAcceptedAt());
        assertNotNull(updatedUser.getTermsAcceptedAt());
        assertNotNull(updatedUser.getCookiePolicyAcknowledgedAt());
        assertTrue(Boolean.TRUE.equals(updatedUser.getGdprAccepted()));
        verify(userRepository).save(user);
    }

    @Test
    void acceptRequiredConsentsRejectsOutdatedPolicyVersions() {
        legalProperties.getPolicy().setPrivacyVersion("2026-04-09");
        legalProperties.getPolicy().setTermsVersion("2026-04-09");

        User user = new User("user-1", "user@example.com", "User", "One");
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        LegalConsentRequest request = new LegalConsentRequest(
                true,
                "2026-01-01",
                true,
                "2026-04-09",
                false,
                null
        );

        assertThrows(IllegalArgumentException.class, () -> legalConsentService.acceptRequiredConsents("user-1", request));
    }
}
