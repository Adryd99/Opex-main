package com.opex.backend.legal.dto;

import java.util.List;

public record LegalDocumentResponse(
        String slug,
        String title,
        String version,
        String lastUpdated,
        String summary,
        List<LegalSectionResponse> sections
) {
}
