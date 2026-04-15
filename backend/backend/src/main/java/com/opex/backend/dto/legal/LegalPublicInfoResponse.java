package com.opex.backend.dto.legal;

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
