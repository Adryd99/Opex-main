package com.opex.backend.dto.legal;

import java.util.List;

public record LegalSectionResponse(
        String title,
        List<String> bullets
) {
}
