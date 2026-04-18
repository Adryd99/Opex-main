package com.opex.backend.banking.service.usecase;

import com.opex.backend.banking.dto.BankSyncResponse;
import com.opex.backend.banking.service.BankIntegrationService;
import com.opex.backend.notification.service.NotificationTriggerService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SyncBankAccountsUseCase {

    private static final Logger log = LoggerFactory.getLogger(SyncBankAccountsUseCase.class);

    private final BankIntegrationService bankIntegrationService;
    private final NotificationTriggerService notificationTriggerService;

    public BankSyncResponse execute(String userId) {
        log.info("Synchronizing bank data for user '{}'", userId);

        try {
            return new BankSyncResponse(bankIntegrationService.syncBankData(userId));
        } catch (RuntimeException exception) {
            notificationTriggerService.onSyncError(userId, null);
            throw exception;
        }
    }
}
