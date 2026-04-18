package com.opex.backend.legal.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opex.backend.banking.repository.BankAccountRepository;
import com.opex.backend.banking.repository.BankConnectionRepository;
import com.opex.backend.banking.repository.TransactionRepository;
import com.opex.backend.legal.service.support.LegalConsentAuditFactory;
import com.opex.backend.tax.repository.TaxRepository;
import com.opex.backend.user.model.User;
import com.opex.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LegalExportService {

    private static final String EXPORT_FORMAT_VERSION = "2026-04-09";

    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final BankAccountRepository bankAccountRepository;
    private final BankConnectionRepository bankConnectionRepository;
    private final TransactionRepository transactionRepository;
    private final TaxRepository taxRepository;
    private final LegalDocumentCatalogService legalDocumentCatalogService;
    private final LegalConsentAuditFactory legalConsentAuditFactory;

    public byte[] exportUserData(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        var publicInfo = legalDocumentCatalogService.getPublicInfo();
        Map<String, Object> export = new LinkedHashMap<>();
        export.put("formatVersion", EXPORT_FORMAT_VERSION);
        export.put("generatedAt", OffsetDateTime.now(ZoneOffset.UTC));
        export.put("controller", publicInfo.controller());
        export.put("policyVersions", legalDocumentCatalogService.getCurrentPolicyVersions());
        export.put("consentAudit", legalConsentAuditFactory.buildConsentAudit(user));
        export.put("storageTechnologies", publicInfo.storageTechnologies());
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
}
