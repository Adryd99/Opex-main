package com.opex.backend.legal.service;

import com.opex.backend.legal.dto.BankIntegrationConsentRequest;
import com.opex.backend.legal.dto.LegalConsentRequest;
import com.opex.backend.legal.dto.LegalPublicInfoResponse;
import com.opex.backend.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LegalService {

    private final LegalDocumentCatalogService legalDocumentCatalogService;
    private final LegalConsentService legalConsentService;
    private final OpenBankingConsentService openBankingConsentService;
    private final LegalExportService legalExportService;

    public LegalPublicInfoResponse getPublicInfo() {
        return legalDocumentCatalogService.getPublicInfo();
    }

    public User acceptRequiredConsents(String userId, LegalConsentRequest request) {
        return legalConsentService.acceptRequiredConsents(userId, request);
    }

    public User recordOpenBankingConsent(String userId, BankIntegrationConsentRequest request) {
        return openBankingConsentService.recordOpenBankingConsent(userId, request);
    }

    public byte[] exportUserData(String userId) {
        return legalExportService.exportUserData(userId);
    }
}
