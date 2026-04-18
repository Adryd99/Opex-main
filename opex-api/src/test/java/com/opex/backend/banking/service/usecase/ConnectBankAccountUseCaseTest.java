package com.opex.backend.banking.service.usecase;

import com.opex.backend.banking.dto.BankConnectionUrlResponse;
import com.opex.backend.banking.service.BankIntegrationService;
import com.opex.backend.legal.dto.BankIntegrationConsentRequest;
import com.opex.backend.legal.service.LegalService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConnectBankAccountUseCaseTest {

    @Mock
    private LegalService legalService;

    @Mock
    private BankIntegrationService bankIntegrationService;

    @InjectMocks
    private ConnectBankAccountUseCase connectBankAccountUseCase;

    @Test
    void executeCoordinatesConsentAndConnectUrlCreation() {
        BankIntegrationConsentRequest request = new BankIntegrationConsentRequest(true, "2026-04-09", List.of("accounts"));
        when(bankIntegrationService.createUserAndGetConnectUrl("user-1", request)).thenReturn("https://connect.example.com");

        BankConnectionUrlResponse response = connectBankAccountUseCase.execute("user-1", request);

        assertEquals("https://connect.example.com", response.connectUrl());
        verify(legalService).recordOpenBankingConsent("user-1", request);
        verify(bankIntegrationService).createUserAndGetConnectUrl("user-1", request);
    }
}
