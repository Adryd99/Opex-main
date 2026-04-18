package com.opex.backend.banking.service.usecase;

import com.opex.backend.banking.dto.BankSyncResponse;
import com.opex.backend.banking.service.BankIntegrationService;
import com.opex.backend.notification.service.NotificationTriggerService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SyncBankAccountsUseCaseTest {

    @Mock
    private BankIntegrationService bankIntegrationService;

    @Mock
    private NotificationTriggerService notificationTriggerService;

    @InjectMocks
    private SyncBankAccountsUseCase syncBankAccountsUseCase;

    @Test
    void executeWrapsSuccessfulSyncIntoResponse() {
        when(bankIntegrationService.syncBankData("user-1")).thenReturn("user-1");

        BankSyncResponse response = syncBankAccountsUseCase.execute("user-1");

        assertEquals("user-1", response.syncedUserId());
    }

    @Test
    void executeTriggersNotificationOnSyncFailure() {
        when(bankIntegrationService.syncBankData("user-1")).thenThrow(new RuntimeException("boom"));

        assertThrows(RuntimeException.class, () -> syncBankAccountsUseCase.execute("user-1"));

        verify(notificationTriggerService).onSyncError("user-1", null);
    }
}
