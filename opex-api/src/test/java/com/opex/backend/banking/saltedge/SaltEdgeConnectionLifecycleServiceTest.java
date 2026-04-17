package com.opex.backend.banking.saltedge;

import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.user.model.User;
import com.opex.backend.banking.repository.BankAccountRepository;
import com.opex.backend.banking.repository.BankConnectionRepository;
import com.opex.backend.banking.repository.TransactionRepository;
import com.opex.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SaltEdgeConnectionLifecycleServiceTest {

    @Mock
    private BankConnectionRepository bankConnectionRepository;

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SaltEdgeApiService saltEdgeApiService;

    @InjectMocks
    private SaltEdgeConnectionLifecycleService saltEdgeConnectionLifecycleService;

    @Test
    void removeConnectionDeletesLocalDataAndUpdatesSaltedgeFlag() {
        BankConnection connection = new BankConnection();
        connection.setId("conn-1");
        connection.setUserId("user-1");

        User user = new User("user-1", "user@example.com", "User", "One");
        user.setIsActiveSaltedge(true);

        when(bankConnectionRepository.findByIdAndUserId("conn-1", "user-1")).thenReturn(Optional.of(connection));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(bankConnectionRepository.findByUserId("user-1")).thenReturn(List.of());

        saltEdgeConnectionLifecycleService.removeConnection("user-1", "conn-1");

        verify(saltEdgeApiService).removeConnection("conn-1");
        verify(transactionRepository).deleteByConnectionId("conn-1");
        verify(bankAccountRepository).deleteByConnectionId("conn-1");
        verify(bankConnectionRepository).delete(connection);

        ArgumentCaptor<User> savedUserCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUserCaptor.capture());
        assertEquals(Boolean.FALSE, savedUserCaptor.getValue().getIsActiveSaltedge());
    }
}
