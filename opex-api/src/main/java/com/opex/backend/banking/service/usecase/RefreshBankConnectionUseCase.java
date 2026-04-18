package com.opex.backend.banking.service.usecase;

import com.opex.backend.banking.dto.BankConnectionRefreshResponse;
import com.opex.backend.banking.service.BankIntegrationService;
import com.opex.backend.notification.service.NotificationTriggerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RefreshBankConnectionUseCase {

    private final BankIntegrationService bankIntegrationService;
    private final NotificationTriggerService notificationTriggerService;

    public BankConnectionRefreshResponse execute(String userId, String connectionId) {
        try {
            return bankIntegrationService.refreshConnection(userId, connectionId);
        } catch (RuntimeException exception) {
            notificationTriggerService.onSyncError(userId, null);
            throw exception;
        }
    }
}
