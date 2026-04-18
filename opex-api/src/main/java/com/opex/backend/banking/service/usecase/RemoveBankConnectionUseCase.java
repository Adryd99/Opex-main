package com.opex.backend.banking.service.usecase;

import com.opex.backend.banking.service.BankIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RemoveBankConnectionUseCase {

    private final BankIntegrationService bankIntegrationService;

    public void execute(String userId, String connectionId) {
        bankIntegrationService.removeConnection(userId, connectionId);
    }
}
