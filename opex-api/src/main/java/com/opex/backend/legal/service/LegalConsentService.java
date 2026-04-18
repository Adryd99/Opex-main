package com.opex.backend.legal.service;

import com.opex.backend.legal.config.LegalProperties;
import com.opex.backend.legal.dto.LegalConsentRequest;
import com.opex.backend.user.model.User;
import com.opex.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class LegalConsentService {

    private final LegalProperties legalProperties;
    private final UserRepository userRepository;

    @Transactional
    public User acceptRequiredConsents(String userId, LegalConsentRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Legal consent payload is required.");
        }

        User user = getUser(userId);
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        requireAccepted(request.acceptPrivacyPolicy(), "privacy policy");
        requireAccepted(request.acceptTermsOfService(), "terms of service");

        String privacyVersion = requireVersion(
                request.privacyPolicyVersion(),
                legalProperties.getPolicy().getPrivacyVersion(),
                "privacy policy"
        );
        String termsVersion = requireVersion(
                request.termsOfServiceVersion(),
                legalProperties.getPolicy().getTermsVersion(),
                "terms of service"
        );

        if (!Objects.equals(user.getPrivacyPolicyVersion(), privacyVersion) || user.getPrivacyAcceptedAt() == null) {
            user.setPrivacyAcceptedAt(now);
        }
        if (!Objects.equals(user.getTermsOfServiceVersion(), termsVersion) || user.getTermsAcceptedAt() == null) {
            user.setTermsAcceptedAt(now);
        }

        user.setPrivacyPolicyVersion(privacyVersion);
        user.setTermsOfServiceVersion(termsVersion);

        if (Boolean.TRUE.equals(request.acknowledgeCookiePolicy()) && hasText(request.cookiePolicyVersion())) {
            String cookieVersion = requireVersion(
                    request.cookiePolicyVersion(),
                    legalProperties.getPolicy().getCookieVersion(),
                    "cookie policy"
            );
            if (!Objects.equals(user.getCookiePolicyVersion(), cookieVersion) || user.getCookiePolicyAcknowledgedAt() == null) {
                user.setCookiePolicyAcknowledgedAt(now);
            }
            user.setCookiePolicyVersion(cookieVersion);
        }

        user.setGdprAccepted(hasCurrentRequiredConsents(user));
        return userRepository.save(user);
    }

    public boolean hasCurrentRequiredConsents(User user) {
        return hasText(user.getPrivacyPolicyVersion())
                && Objects.equals(user.getPrivacyPolicyVersion(), legalProperties.getPolicy().getPrivacyVersion())
                && user.getPrivacyAcceptedAt() != null
                && hasText(user.getTermsOfServiceVersion())
                && Objects.equals(user.getTermsOfServiceVersion(), legalProperties.getPolicy().getTermsVersion())
                && user.getTermsAcceptedAt() != null;
    }

    private User getUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
    }

    private void requireAccepted(Boolean accepted, String label) {
        if (!Boolean.TRUE.equals(accepted)) {
            throw new IllegalArgumentException("You must accept the " + label + ".");
        }
    }

    private String requireVersion(String submittedVersion, String currentVersion, String label) {
        if (!hasText(currentVersion)) {
            throw new IllegalStateException("Current " + label + " version is not configured.");
        }
        if (!Objects.equals(normalizeText(submittedVersion), normalizeText(currentVersion))) {
            throw new IllegalArgumentException("The submitted " + label + " version is not current.");
        }
        return currentVersion;
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
