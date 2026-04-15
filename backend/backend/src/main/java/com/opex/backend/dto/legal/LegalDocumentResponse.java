package com.opex.backend.dto.legal;

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
