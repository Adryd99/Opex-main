package com.opex.backend.legal.dto;

import java.util.List;

public record LegalPublicInfoResponse(
        LegalControllerContactResponse controller,
        List<LegalProcessorResponse> processors,
        List<LegalStorageTechnologyResponse> storageTechnologies,
        LegalDocumentResponse privacyPolicy,
        LegalDocumentResponse termsOfService,
        LegalDocumentResponse cookiePolicy,
        LegalDocumentResponse openBankingNotice
) {
}
