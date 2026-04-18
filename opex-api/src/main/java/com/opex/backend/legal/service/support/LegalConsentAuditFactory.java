package com.opex.backend.legal.service.support;

import com.opex.backend.user.model.User;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class LegalConsentAuditFactory {

    public List<Map<String, Object>> buildConsentAudit(User user) {
        return List.of(
                        buildConsentEvent("privacyPolicy", user.getPrivacyPolicyVersion(), user.getPrivacyAcceptedAt()),
                        buildConsentEvent("termsOfService", user.getTermsOfServiceVersion(), user.getTermsAcceptedAt()),
                        buildConsentEvent("cookiePolicy", user.getCookiePolicyVersion(), user.getCookiePolicyAcknowledgedAt()),
                        buildConsentEvent("openBankingNotice", user.getOpenBankingNoticeVersion(), user.getOpenBankingNoticeAcceptedAt())
                ).stream()
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
}
