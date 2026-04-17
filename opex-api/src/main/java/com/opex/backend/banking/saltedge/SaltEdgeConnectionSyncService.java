package com.opex.backend.banking.saltedge;

import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.banking.repository.BankConnectionRepository;
import com.opex.backend.banking.saltedge.dto.SaltEdgeConnectionsResponse;
import com.opex.backend.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class SaltEdgeConnectionSyncService {

    private final BankConnectionRepository bankConnectionRepository;

    public void upsertConnections(User user, SaltEdgeConnectionsResponse connectionsResponse) {
        if (connectionsResponse == null || connectionsResponse.getData() == null) {
            return;
        }

        for (SaltEdgeConnectionsResponse.ConnectionItem item : connectionsResponse.getData()) {
            BankConnection connection = bankConnectionRepository.findById(item.getId()).orElse(new BankConnection());
            connection.setId(item.getId());
            connection.setUserId(user.getId());
            connection.setProviderName(item.getProviderName());
            connection.setStatus(item.getStatus());

            if (connection.getCreatedAt() == null) {
                connection.setCreatedAt(LocalDate.now());
            }

            bankConnectionRepository.save(connection);
        }
    }
}
