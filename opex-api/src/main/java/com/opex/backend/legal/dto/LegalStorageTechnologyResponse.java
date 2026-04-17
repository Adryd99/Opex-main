package com.opex.backend.legal.dto;

public record LegalStorageTechnologyResponse(
        String name,
        String key,
        String purpose,
        String duration,
        boolean essential
) {
}
