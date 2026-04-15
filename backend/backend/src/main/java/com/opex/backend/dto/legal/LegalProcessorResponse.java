package com.opex.backend.dto.legal;

public record LegalProcessorResponse(
        String name,
        String purpose,
        String dataCategories,
        String region
) {
}
