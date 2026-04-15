package com.opex.backend.dto;

import java.util.List;

public record SaltEdgeConsentRequest(
        String policyVersion,
        List<String> scopes
) {
}
