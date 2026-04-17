package com.opex.backend.legal.dto;

public record LegalProcessorResponse(
        String name,
        String purpose,
        String dataCategories,
        String region
) {
}
