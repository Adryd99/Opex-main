package com.opex.backend.banking.saltedge;

import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.banking.model.BankConnectionType;
import com.opex.backend.banking.repository.BankConnectionRepository;
import com.opex.backend.banking.saltedge.dto.SaltEdgeConnectionsResponse;
import com.opex.backend.common.exception.BadRequestException;
import com.opex.backend.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SaltEdgeBankSyncService {

    private final BankConnectionRepository bankConnectionRepository;
    private final SaltEdgeApiService saltEdgeApiService;
    private final SaltEdgeConnectionSyncService saltEdgeConnectionSyncService;
    private final SaltEdgeAccountSyncService saltEdgeAccountSyncService;

    public void syncUserData(User user) {
        if (user.getCustomerId() == null || user.getCustomerId().isBlank()) {
            throw new BadRequestException("Missing customerId. Call createUser first.");
        }

        SaltEdgeConnectionsResponse connectionsResponse = saltEdgeApiService.getConnections(user.getCustomerId());
        upsertConnections(user, connectionsResponse);

        for (BankConnection connection : bankConnectionRepository.findByUserIdAndType(user.getId(), BankConnectionType.SALTEDGE)) {
            saltEdgeAccountSyncService.syncConnection(user, connection);
        }
    }

    public void upsertConnections(User user, SaltEdgeConnectionsResponse connectionsResponse) {
        saltEdgeConnectionSyncService.upsertConnections(user, connectionsResponse);
    }
}
