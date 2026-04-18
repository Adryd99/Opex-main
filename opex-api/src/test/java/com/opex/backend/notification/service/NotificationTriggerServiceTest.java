package com.opex.backend.notification.service;

import com.opex.backend.banking.repository.BankAccountRepository;
import com.opex.backend.banking.repository.BankConnectionRepository;
import com.opex.backend.tax.repository.TaxRepository;
import com.opex.backend.user.model.User;
import com.opex.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationTriggerServiceTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private BankConnectionRepository bankConnectionRepository;

    @Mock
    private TaxRepository taxRepository;

    @InjectMocks
    private NotificationTriggerService notificationTriggerService;

    @Test
    void onSyncErrorCreatesNotificationWhenUserHasEnabledThePreference() {
        User user = new User("user-1", "user@example.com", "User", "One");
        user.setNotifySyncErrors(true);

        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        notificationTriggerService.onSyncError("user-1", "Test Bank");

        verify(notificationService).createNotification(
                user,
                "danger",
                "Bank Sync Error",
                "Unable to sync data from Test Bank. Please reconnect your account.",
                "WifiOff"
        );
    }

    @Test
    void onSyncErrorDoesNothingWhenPreferenceIsDisabled() {
        User user = new User("user-1", "user@example.com", "User", "One");
        user.setNotifySyncErrors(false);

        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        notificationTriggerService.onSyncError("user-1", "Test Bank");

        verify(notificationService, never()).createNotification(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }
}
