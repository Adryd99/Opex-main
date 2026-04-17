package com.opex.backend.legal.dto;

import java.util.List;

public record LegalSectionResponse(
        String title,
        List<String> bullets
) {
}
