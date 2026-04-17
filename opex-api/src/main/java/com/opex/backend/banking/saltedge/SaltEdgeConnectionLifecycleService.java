package com.opex.backend.banking.saltedge;

import com.opex.backend.common.exception.BadRequestException;
import com.opex.backend.common.exception.ExternalServiceException;
import com.opex.backend.common.exception.ResourceNotFoundException;
import com.opex.backend.banking.model.BankConnection;
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

        if (user.getCustomerId() == null || user.getCustomerId().isBlank()) {
            throw new BadRequestException("Missing Salt Edge customerId. Create a connection first.");
        }

        SaltEdgeConnectResponse refreshResponse = saltEdgeApiService.refreshConnection(connection.getId());
        if (refreshResponse == null || refreshResponse.getData() == null || refreshResponse.getData().getConnectUrl() == null) {
            throw new ExternalServiceException("Unable to refresh Salt Edge connection.");
        }

        return refreshResponse.getData().getConnectUrl();
    }

    @Transactional
    public void removeConnection(String userId, String connectionId) {
        BankConnection connection = getOwnedConnection(userId, connectionId);
        User user = getUser(userId);

        saltEdgeApiService.removeConnection(connection.getId());

        transactionRepository.deleteByConnectionId(connection.getId());
        bankAccountRepository.deleteByConnectionId(connection.getId());
        bankConnectionRepository.delete(connection);

        boolean hasRemainingConnections = !bankConnectionRepository.findByUserId(userId).isEmpty();
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
}
