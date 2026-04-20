package com.opex.backend.banking.service;

import com.opex.backend.banking.dto.BankAccountResponse;
import com.opex.backend.banking.dto.BankConnectionResponse;
import com.opex.backend.banking.dto.ManualBankConnectionRequest;
import com.opex.backend.banking.dto.ManualBankConnectionUpdateRequest;
import com.opex.backend.banking.model.BankAccount;
import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.banking.model.BankConnectionType;
import com.opex.backend.banking.repository.BankAccountRepository;
import com.opex.backend.banking.repository.BankConnectionRepository;
import com.opex.backend.banking.repository.TransactionRepository;
import com.opex.backend.common.exception.BadRequestException;
import com.opex.backend.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BankConnectionService {

    private static final String MANUAL_CONNECTION_STATUS = "manual";

    private final BankConnectionRepository bankConnectionRepository;
    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;

    public List<BankConnection> getUserConnections(String userId) {
        return bankConnectionRepository.findByUserId(userId);
    }

    public List<BankConnectionResponse> getUserConnectionResponses(String userId) {
        List<BankConnection> connections = bankConnectionRepository.findByUserId(userId);
        Map<String, List<BankAccountResponse>> accountsByConnectionId = bankAccountRepository.findByUserId(userId).stream()
                .filter(account -> !isBlank(account.getConnectionId()))
                .map(BankAccountResponse::from)
                .collect(Collectors.groupingBy(BankAccountResponse::connectionId));

        return connections.stream()
                .sorted((left, right) -> {
                    String leftName = left.getProviderName() != null ? left.getProviderName() : "";
                    String rightName = right.getProviderName() != null ? right.getProviderName() : "";
                    return leftName.compareToIgnoreCase(rightName);
                })
                .map(connection -> BankConnectionResponse.from(
                        connection,
                        accountsByConnectionId.getOrDefault(connection.getId(), List.of())
                ))
                .toList();
    }

    @Transactional
    public BankConnection createManualConnection(String userId, ManualBankConnectionRequest request) {
        String providerName = normalizeProviderName(request != null ? request.getProviderName() : null);
        if (providerName.isBlank()) {
            throw new BadRequestException("providerName is required");
        }

        BankConnection connection = new BankConnection();
        connection.setId("manual_" + UUID.randomUUID());
        connection.setUserId(userId);
        connection.setProviderName(providerName);
        connection.setType(BankConnectionType.MANUAL);
        connection.setExternalConnectionId(null);
        connection.setStatus(MANUAL_CONNECTION_STATUS);
        connection.setCreatedAt(LocalDate.now());
        return bankConnectionRepository.save(connection);
    }

    public BankConnection getOwnedConnection(String userId, String connectionId) {
        return bankConnectionRepository.findByIdAndUserId(connectionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Bank connection not found or not authorized."));
    }

    public BankConnection getOwnedConnectionByType(String userId, String connectionId, BankConnectionType type) {
        return bankConnectionRepository.findByIdAndUserIdAndType(connectionId, userId, type)
                .orElseThrow(() -> new ResourceNotFoundException("Bank connection not found or not authorized."));
    }

    @Transactional
    public BankConnection updateManualConnection(String userId, String connectionId, ManualBankConnectionUpdateRequest request) {
        BankConnection connection = getOwnedConnectionByType(userId, connectionId, BankConnectionType.MANUAL);
        String providerName = normalizeProviderName(request != null ? request.getProviderName() : null);
        if (providerName.isBlank()) {
            throw new BadRequestException("providerName is required");
        }

        String previousProviderName = normalizeProviderName(connection.getProviderName());
        connection.setProviderName(providerName);

        List<BankAccount> accounts = bankAccountRepository.findByUserIdAndConnectionId(userId, connectionId);
        for (BankAccount account : accounts) {
            if (!hasCustomAccountLabel(account, previousProviderName)) {
                account.setInstitutionName(providerName);
                bankAccountRepository.save(account);
            }
        }

        return bankConnectionRepository.save(connection);
    }

    @Transactional
    public void deleteManualConnection(String userId, String connectionId) {
        BankConnection connection = getOwnedConnectionByType(userId, connectionId, BankConnectionType.MANUAL);
        transactionRepository.deleteByUserIdAndConnectionId(userId, connection.getId());
        bankAccountRepository.deleteByUserIdAndConnectionId(userId, connection.getId());
        bankConnectionRepository.delete(connection);
    }

    private String normalizeProviderName(String providerName) {
        return providerName != null ? providerName.trim() : "";
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private boolean hasCustomAccountLabel(BankAccount account, String providerName) {
        String currentLabel = normalizeProviderName(account.getInstitutionName());
        return !currentLabel.isBlank() && !currentLabel.equalsIgnoreCase(providerName);
    }
}
