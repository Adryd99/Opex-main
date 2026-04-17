package com.opex.backend.legal.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opex.backend.legal.config.LegalProperties;
import com.opex.backend.legal.dto.BankIntegrationConsentRequest;
import com.opex.backend.legal.dto.LegalConsentRequest;
import com.opex.backend.legal.dto.LegalControllerContactResponse;
import com.opex.backend.legal.dto.LegalDocumentResponse;
import com.opex.backend.legal.dto.LegalProcessorResponse;
import com.opex.backend.legal.dto.LegalPublicInfoResponse;
import com.opex.backend.legal.dto.LegalSectionResponse;
import com.opex.backend.legal.dto.LegalStorageTechnologyResponse;
import com.opex.backend.banking.repository.BankAccountRepository;
import com.opex.backend.banking.repository.BankConnectionRepository;
import com.opex.backend.tax.repository.TaxRepository;
import com.opex.backend.banking.repository.TransactionRepository;
import com.opex.backend.user.model.User;
import com.opex.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LegalService {

    private static final String EXPORT_FORMAT_VERSION = "2026-04-09";

    private final LegalProperties legalProperties;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final BankAccountRepository bankAccountRepository;
    private final BankConnectionRepository bankConnectionRepository;
    private final TransactionRepository transactionRepository;
    private final TaxRepository taxRepository;

    public LegalPublicInfoResponse getPublicInfo() {
        return new LegalPublicInfoResponse(
                new LegalControllerContactResponse(
                        legalProperties.getController().getName(),
                        legalProperties.getController().getAddress(),
                        legalProperties.getController().getPrivacyEmail(),
                        legalProperties.getController().getDpoEmail(),
                        legalProperties.getController().getSupportEmail(),
                        legalProperties.getController().getSupervisoryAuthority()
                ),
                legalProperties.getProcessors().stream()
                        .map(processor -> new LegalProcessorResponse(
                                processor.getName(),
                                processor.getPurpose(),
                                processor.getDataCategories(),
                                processor.getRegion()
                        ))
                        .toList(),
                legalProperties.getStorageTechnologies().stream()
                        .map(storage -> new LegalStorageTechnologyResponse(
                                storage.getName(),
                                storage.getKey(),
                                storage.getPurpose(),
                                storage.getDuration(),
                                storage.isEssential()
                        ))
                        .toList(),
                buildPrivacyPolicy(),
                buildTermsOfService(),
                buildCookiePolicy(),
                buildOpenBankingNotice()
        );
    }

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

    @Transactional
    public User recordOpenBankingConsent(String userId, BankIntegrationConsentRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Open banking consent payload is required.");
        }

        User user = getUser(userId);
        if (!hasCurrentRequiredConsents(user)) {
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

    public byte[] exportUserData(String userId) {
        User user = getUser(userId);
        Map<String, Object> export = new LinkedHashMap<>();
        export.put("formatVersion", EXPORT_FORMAT_VERSION);
        export.put("generatedAt", OffsetDateTime.now(ZoneOffset.UTC));
        export.put("controller", getPublicInfo().controller());
        export.put("policyVersions", Map.of(
                "privacy", legalProperties.getPolicy().getPrivacyVersion(),
                "terms", legalProperties.getPolicy().getTermsVersion(),
                "cookies", legalProperties.getPolicy().getCookieVersion(),
                "openBanking", legalProperties.getPolicy().getOpenBankingVersion()
        ));
        export.put("consentAudit", buildConsentAudit(user));
        export.put("storageTechnologies", getPublicInfo().storageTechnologies());
        export.put("profile", user);
        export.put("bankConnections", bankConnectionRepository.findByUserId(userId));
        export.put("bankAccounts", bankAccountRepository.findByUserId(userId));
        export.put("transactions", transactionRepository.findByUserId(userId));
        export.put("taxes", taxRepository.findByUserId(userId));

        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(export);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to generate user data export.", exception);
        }
    }

    private List<Map<String, Object>> buildConsentAudit(User user) {
        List<Map<String, Object>> audit = new ArrayList<>();
        audit.add(buildConsentEvent("privacyPolicy", user.getPrivacyPolicyVersion(), user.getPrivacyAcceptedAt()));
        audit.add(buildConsentEvent("termsOfService", user.getTermsOfServiceVersion(), user.getTermsAcceptedAt()));
        audit.add(buildConsentEvent("cookiePolicy", user.getCookiePolicyVersion(), user.getCookiePolicyAcknowledgedAt()));
        audit.add(buildConsentEvent("openBankingNotice", user.getOpenBankingNoticeVersion(), user.getOpenBankingNoticeAcceptedAt()));
        return audit.stream()
                .filter(item -> item.get("version") != null || item.get("acceptedAt") != null)
                .toList();
    }

    private Map<String, Object> buildConsentEvent(String type, String version, OffsetDateTime acceptedAt) {
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("type", type);
        event.put("version", version);
        event.put("acceptedAt", acceptedAt);
        return event;
    }

    private LegalDocumentResponse buildPrivacyPolicy() {
        return new LegalDocumentResponse(
                "privacy",
                "Privacy Notice",
                legalProperties.getPolicy().getPrivacyVersion(),
                legalProperties.getPolicy().getLastUpdated(),
                "How Opex collects, uses, retains and shares profile, billing and optional open-banking data.",
                List.of(
                        new LegalSectionResponse(
                                "Data We Process",
                                List.of(
                                        "Identity and account data such as email address, first name, last name and profile settings.",
                                        "Tax profile and residency data entered in the app for budgeting and filing workflows.",
                                        "Optional banking data imported after a dedicated open-banking confirmation, including account metadata, balances and transactions.",
                                        "Operational security data needed for authentication, session continuity and fraud prevention."
                                )
                        ),
                        new LegalSectionResponse(
                                "Purposes And Legal Bases",
                                List.of(
                                        "We process account, billing and workspace data to provide the Opex service under Article 6(1)(b) GDPR.",
                                        "We process optional open-banking data only after a dedicated confirmation for the banking feature and to keep the connection active.",
                                        "We may retain financial and tax-related records where a legal obligation applies under Article 6(1)(c) GDPR.",
                                        "We use limited technical and security data under Article 6(1)(f) GDPR to defend the service, investigate abuse and maintain availability."
                                )
                        ),
                        new LegalSectionResponse(
                                "Recipients And Processors",
                                legalProperties.getProcessors().stream()
                                        .map(processor -> processor.getName() + ": " + processor.getPurpose() + " (" + processor.getDataCategories() + ").")
                                        .toList()
                        ),
                        new LegalSectionResponse(
                                "Retention",
                                List.of(
                                        "Active account data: " + legalProperties.getRetention().getActiveAccount(),
                                        "Closed account data: " + legalProperties.getRetention().getClosedAccount(),
                                        "Open banking data: " + legalProperties.getRetention().getOpenBankingData(),
                                        "Consent audit trail: " + legalProperties.getRetention().getConsentAudit()
                                )
                        ),
                        new LegalSectionResponse(
                                "Your Rights",
                                List.of(
                                        "You can request access, rectification, erasure, restriction, portability and objection where GDPR conditions apply.",
                                        "You can export the data currently stored for your account directly from the app.",
                                        "You can close the account from the privacy area and contact " + legalProperties.getController().getPrivacyEmail() + " for privacy requests.",
                                        "You can lodge a complaint with your competent supervisory authority. Opex aims to respond to valid GDPR requests within one month."
                                )
                        )
                )
        );
    }

    private LegalDocumentResponse buildTermsOfService() {
        return new LegalDocumentResponse(
                "terms",
                "Terms of Service",
                legalProperties.getPolicy().getTermsVersion(),
                legalProperties.getPolicy().getLastUpdated(),
                "Core contractual rules for using Opex, including user responsibilities and third-party integrations.",
                List.of(
                        new LegalSectionResponse(
                                "Using Opex",
                                List.of(
                                        "You must provide accurate account information and keep login credentials confidential.",
                                        "You may use Opex for budgeting, tax-planning support and optional open-banking synchronization.",
                                        "You must not use the service to violate law, infringe rights or interfere with platform security."
                                )
                        ),
                        new LegalSectionResponse(
                                "Third-Party Services",
                                List.of(
                                        "Authentication is provided through Keycloak-based identity flows.",
                                        "Open-banking connectivity is facilitated through Salt Edge and depends on the rules of your bank and applicable PSD2/Open Finance regimes.",
                                        "Configured infrastructure providers may support hosting, runtime operations or data exports shown in the privacy notice."
                                )
                        ),
                        new LegalSectionResponse(
                                "No Professional Advice",
                                List.of(
                                        "Budgeting, tax estimates and reminders are operational support tools only.",
                                        "Nothing in Opex replaces legal, accounting, tax or investment advice from a qualified professional."
                                )
                        ),
                        new LegalSectionResponse(
                                "Termination And Changes",
                                List.of(
                                        "You can stop using the service and request an export of your current account data at any time.",
                                        "Opex may suspend or close accounts for legal, security or abuse-prevention reasons.",
                                        "When these terms materially change, the app can request a renewed acceptance before continued use."
                                )
                        )
                )
        );
    }

    private LegalDocumentResponse buildCookiePolicy() {
        List<LegalSectionResponse> sections = new ArrayList<>();
        sections.add(new LegalSectionResponse(
                "Strictly Necessary Storage",
                List.of(
                        "The current Opex web application stores only authentication and feature continuity data that are necessary for secure login and essential product flows.",
                        "The current codebase does not set analytics or marketing cookies."
                )
        ));
        sections.add(new LegalSectionResponse(
                "Storage Keys Used By The App",
                legalProperties.getStorageTechnologies().stream()
                        .map(storage -> storage.getKey() + ": " + storage.getPurpose() + " (" + storage.getDuration() + ").")
                        .toList()
        ));
        sections.add(new LegalSectionResponse(
                "Managing Storage",
                List.of(
                        "Authentication storage is cleared when you sign out.",
                        "Browser controls can remove local or session storage, but doing so may interrupt login, PKCE verification or provider selection flows."
                )
        ));

        return new LegalDocumentResponse(
                "cookies",
                "Cookie And Storage Notice",
                legalProperties.getPolicy().getCookieVersion(),
                legalProperties.getPolicy().getLastUpdated(),
                "A notice covering essential browser storage used by Opex for login, provider selection and session continuity.",
                sections
        );
    }

    private LegalDocumentResponse buildOpenBankingNotice() {
        return new LegalDocumentResponse(
                "open-banking",
                "Open Banking Data Notice",
                legalProperties.getPolicy().getOpenBankingVersion(),
                legalProperties.getPolicy().getLastUpdated(),
                "A specific disclosure shown before Opex redirects a user to Salt Edge to connect a bank.",
                List.of(
                        new LegalSectionResponse(
                                "What Happens When You Connect A Bank",
                                List.of(
                                        "Opex shares the minimum identifiers needed to create and maintain your banking connection through Salt Edge.",
                                        "After you authorize with your bank, Opex may import connection metadata, account information, balances and transactions into your workspace."
                                )
                        ),
                        new LegalSectionResponse(
                                "Why We Use The Data",
                                List.of(
                                        "Connected banking data powers dashboards, account setup, budgeting views, transaction histories and tax-buffer calculations.",
                                        "Open-banking access is optional. You can continue using manual accounts without granting this access."
                                )
                        ),
                        new LegalSectionResponse(
                                "Consent Renewal",
                                List.of(
                                        "Bank access approvals can expire under the rules of your bank or open-banking provider, so the app may ask you to renew consent periodically.",
                                        "Do not connect an account unless you are authorized to grant access to the underlying banking data."
                                )
                        )
                )
        );
    }

    private boolean hasCurrentRequiredConsents(User user) {
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
