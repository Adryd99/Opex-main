package com.opex.backend.banking.saltedge;

import com.opex.backend.common.exception.BadRequestException;
import com.opex.backend.common.exception.ExternalServiceException;
import com.opex.backend.common.exception.ResourceNotFoundException;
import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.banking.model.BankConnectionType;
import com.opex.backend.user.model.User;
import com.opex.backend.banking.repository.BankAccountRepository;
import com.opex.backend.banking.repository.BankConnectionRepository;
import com.opex.backend.banking.repository.TransactionRepository;
import com.opex.backend.user.repository.UserRepository;
import com.opex.backend.banking.saltedge.dto.SaltEdgeConnectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SaltEdgeConnectionLifecycleService {

    private final BankConnectionRepository bankConnectionRepository;
    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final SaltEdgeApiService saltEdgeApiService;

    public String refreshConnection(String userId, String connectionId) {
        BankConnection connection = getOwnedConnection(userId, connectionId);
        User user = getUser(userId);
        validateSaltEdgeConnection(connection);

        if (user.getCustomerId() == null || user.getCustomerId().isBlank()) {
            throw new BadRequestException("Missing Salt Edge customerId. Create a connection first.");
        }

        SaltEdgeConnectResponse refreshResponse = saltEdgeApiService.refreshConnection(resolveExternalConnectionId(connection));
        if (refreshResponse == null || refreshResponse.getData() == null || refreshResponse.getData().getConnectUrl() == null) {
            throw new ExternalServiceException("Unable to refresh Salt Edge connection.");
        }

        return refreshResponse.getData().getConnectUrl();
    }

    @Transactional
    public void removeConnection(String userId, String connectionId) {
        BankConnection connection = getOwnedConnection(userId, connectionId);
        User user = getUser(userId);
        validateSaltEdgeConnection(connection);

        saltEdgeApiService.removeConnection(resolveExternalConnectionId(connection));

        transactionRepository.deleteByConnectionId(connection.getId());
        bankAccountRepository.deleteByConnectionId(connection.getId());
        bankConnectionRepository.delete(connection);

        boolean hasRemainingConnections = !bankConnectionRepository.findByUserIdAndType(userId, BankConnectionType.SALTEDGE).isEmpty();
        user.setIsActiveSaltedge(hasRemainingConnections);
        userRepository.save(user);
    }

    private BankConnection getOwnedConnection(String userId, String connectionId) {
        return bankConnectionRepository.findByIdAndUserId(connectionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Connection not found or not authorized."));
    }

    private User getUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    private void validateSaltEdgeConnection(BankConnection connection) {
        if (connection.getType() != BankConnectionType.SALTEDGE) {
            throw new BadRequestException("Operation denied. This connection is not managed by Salt Edge.");
        }
    }

    private String resolveExternalConnectionId(BankConnection connection) {
        if (connection.getExternalConnectionId() != null && !connection.getExternalConnectionId().isBlank()) {
            return connection.getExternalConnectionId();
        }
        return connection.getId();
    }
}
