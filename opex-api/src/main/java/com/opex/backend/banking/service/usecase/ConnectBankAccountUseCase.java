package com.opex.backend.banking.service.usecase;

import com.opex.backend.banking.dto.BankConnectionUrlResponse;
import com.opex.backend.banking.service.BankIntegrationService;
import com.opex.backend.legal.dto.BankIntegrationConsentRequest;
import com.opex.backend.legal.service.LegalService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ConnectBankAccountUseCase {

    private static final Logger log = LoggerFactory.getLogger(ConnectBankAccountUseCase.class);

    private final LegalService legalService;
    private final BankIntegrationService bankIntegrationService;

    public BankConnectionUrlResponse execute(String userId, BankIntegrationConsentRequest request) {
        log.info("Creating bank connection for user '{}'", userId);
        legalService.recordOpenBankingConsent(userId, request);
        String connectUrl = bankIntegrationService.createUserAndGetConnectUrl(userId, request);
        return new BankConnectionUrlResponse(connectUrl);
    }
}
