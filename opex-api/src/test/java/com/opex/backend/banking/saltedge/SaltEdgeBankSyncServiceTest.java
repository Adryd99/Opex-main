package com.opex.backend.banking.saltedge;

import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.banking.model.BankConnectionType;
import com.opex.backend.banking.saltedge.dto.SaltEdgeConnectionsResponse;
import com.opex.backend.common.exception.BadRequestException;
import com.opex.backend.user.model.User;
import com.opex.backend.banking.repository.BankConnectionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SaltEdgeBankSyncServiceTest {

    @Mock
    private BankConnectionRepository bankConnectionRepository;

    @Mock
    private SaltEdgeApiService saltEdgeApiService;

    @Mock
    private SaltEdgeConnectionSyncService saltEdgeConnectionSyncService;

    @Mock
    private SaltEdgeAccountSyncService saltEdgeAccountSyncService;

    @InjectMocks
    private SaltEdgeBankSyncService saltEdgeBankSyncService;

    @Test
    void syncUserDataCoordinatesConnectionAndAccountSync() {
        User user = new User("user-1", "user@example.com", "User", "One");
        user.setCustomerId("customer-1");

        BankConnection connection = new BankConnection();
        connection.setId("conn-1");
        connection.setUserId("user-1");
        connection.setType(BankConnectionType.SALTEDGE);

        BankConnection manualConnection = new BankConnection();
        manualConnection.setId("manual-1");
        manualConnection.setUserId("user-1");
        manualConnection.setType(BankConnectionType.MANUAL);

        SaltEdgeConnectionsResponse connectionsResponse = new SaltEdgeConnectionsResponse();

        when(saltEdgeApiService.getConnections("customer-1")).thenReturn(connectionsResponse);
        when(bankConnectionRepository.findByUserIdAndType("user-1", BankConnectionType.SALTEDGE))
                .thenReturn(List.of(connection));

        saltEdgeBankSyncService.syncUserData(user);

        verify(saltEdgeConnectionSyncService).upsertConnections(user, connectionsResponse);
        verify(saltEdgeAccountSyncService).syncConnection(user, connection);
    }

    @Test
    void syncUserDataRequiresCustomerId() {
        User user = new User("user-1", "user@example.com", "User", "One");

        assertThrows(BadRequestException.class, () -> saltEdgeBankSyncService.syncUserData(user));
    }
}
