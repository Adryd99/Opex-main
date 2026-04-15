package com.opex.backend.dto.legal;

public record LegalStorageTechnologyResponse(
        String name,
        String key,
        String purpose,
        String duration,
        boolean essential
) {
}
