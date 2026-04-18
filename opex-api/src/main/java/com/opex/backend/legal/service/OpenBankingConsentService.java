package com.opex.backend.legal.service;

import com.opex.backend.legal.config.LegalProperties;
import com.opex.backend.legal.dto.BankIntegrationConsentRequest;
import com.opex.backend.user.model.User;
import com.opex.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OpenBankingConsentService {

    private final LegalProperties legalProperties;
    private final UserRepository userRepository;
    private final LegalConsentService legalConsentService;

    @Transactional
    public User recordOpenBankingConsent(String userId, BankIntegrationConsentRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Open banking consent payload is required.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        if (!legalConsentService.hasCurrentRequiredConsents(user)) {
            throw new IllegalArgumentException("You must accept the current privacy notice and terms before connecting a bank.");
        }

        requireAccepted(request.acceptOpenBankingNotice(), "open banking notice");
        String currentVersion = legalProperties.getPolicy().getOpenBankingVersion();
        String submittedVersion = requireVersion(request.openBankingNoticeVersion(), currentVersion, "open banking notice");

        List<String> scopes = normalizeScopes(request.scopes());
        if (scopes.isEmpty()) {
            throw new IllegalArgumentException("At least one open banking processing scope is required.");
        }

        if (!Objects.equals(user.getOpenBankingNoticeVersion(), submittedVersion) || user.getOpenBankingNoticeAcceptedAt() == null) {
            user.setOpenBankingNoticeAcceptedAt(OffsetDateTime.now(ZoneOffset.UTC));
        }
        user.setOpenBankingNoticeVersion(submittedVersion);
        user.setOpenBankingConsentScopes(String.join(",", scopes));

        return userRepository.save(user);
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

    private List<String> normalizeScopes(List<String> scopes) {
        if (scopes == null) {
            return List.of();
        }
        return scopes.stream()
                .map(this::normalizeText)
                .filter(this::hasText)
                .map(value -> value.toLowerCase(Locale.ROOT))
                .distinct()
                .collect(Collectors.toList());
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
