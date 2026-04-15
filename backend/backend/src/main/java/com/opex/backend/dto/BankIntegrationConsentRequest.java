package com.opex.backend.dto;

import java.util.List;

public record BankIntegrationConsentRequest(
        Boolean acceptOpenBankingNotice,
        String openBankingNoticeVersion,
        List<String> scopes
) {
}
