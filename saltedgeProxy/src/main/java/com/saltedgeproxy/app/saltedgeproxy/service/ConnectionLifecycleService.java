package com.saltedgeproxy.app.saltedgeproxy.service;

import com.saltedgeproxy.app.saltedgeproxy.dto.SaltEdgeConnectResponse;
import com.saltedgeproxy.app.saltedgeproxy.model.BankConnection;
import com.saltedgeproxy.app.saltedgeproxy.model.User;
import com.saltedgeproxy.app.saltedgeproxy.repository.BankAccountRepository;
import com.saltedgeproxy.app.saltedgeproxy.repository.BankConnectionRepository;
import com.saltedgeproxy.app.saltedgeproxy.repository.TransactionRepository;
import com.saltedgeproxy.app.saltedgeproxy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConnectionLifecycleService {

    private final BankConnectionRepository bankConnectionRepository;
    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final SaltEdgeService saltEdgeService;

    public String refreshConnection(String userId, String connectionId) {
        BankConnection connection = getOwnedConnection(userId, connectionId);
        User user = getUser(userId);

        if (user.getCustomerId() == null || user.getCustomerId().isBlank()) {
            throw new IllegalStateException("Missing Salt Edge customerId. Create a connection first.");
        }

        SaltEdgeConnectResponse refreshResponse = saltEdgeService.refreshConnection(connection.getId());
        if (refreshResponse == null || refreshResponse.getData() == null || refreshResponse.getData().getConnectUrl() == null) {
            throw new IllegalStateException("Unable to refresh Salt Edge connection.");
        }

        return refreshResponse.getData().getConnectUrl();
    }

    @Transactional
    public void removeConnection(String userId, String connectionId) {
        BankConnection connection = getOwnedConnection(userId, connectionId);
        User user = getUser(userId);

        saltEdgeService.removeConnection(connection.getId());

        transactionRepository.deleteByConnectionId(connection.getId());
        bankAccountRepository.deleteByConnectionId(connection.getId());
        bankConnectionRepository.delete(connection);

        boolean hasRemainingConnections = !bankConnectionRepository.findByUserId(userId).isEmpty();
        user.setIsActiveSaltedge(hasRemainingConnections);
        userRepository.save(user);
    }

    private BankConnection getOwnedConnection(String userId, String connectionId) {
        return bankConnectionRepository.findByIdAndUserId(connectionId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Connection not found or not authorized."));
    }

    private User getUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
    }
}
