package com.opex.backend.banking.saltedge;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SaltEdgeApiServiceTest {

    private final SaltEdgeApiService saltEdgeApiService = new SaltEdgeApiService();

    @Test
    void normalizeConsentScopesReturnsDefaultsWhenScopesAreMissing() {
        assertEquals(
                List.of("accounts", "transactions"),
                saltEdgeApiService.normalizeConsentScopes(null)
        );
    }

    @Test
    void normalizeConsentScopesMapsLegacyAliasesAndDeduplicatesValues() {
        assertEquals(
                List.of("accounts", "transactions", "holder_info"),
                saltEdgeApiService.normalizeConsentScopes(
                        List.of("account_details", "balances", "transactions", "holder_info", "accounts", "invalid")
                )
        );
    }
}
