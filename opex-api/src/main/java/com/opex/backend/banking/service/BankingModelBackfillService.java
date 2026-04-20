package com.opex.backend.banking.service;

import com.opex.backend.banking.model.BankAccount;
import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.banking.model.BankConnectionType;
import com.opex.backend.banking.model.Transaction;
import com.opex.backend.banking.repository.BankAccountRepository;
import com.opex.backend.banking.repository.BankConnectionRepository;
import com.opex.backend.banking.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class BankingModelBackfillService implements ApplicationRunner {

    private static final String MANUAL_CONNECTION_STATUS = "manual";
    private static final String DEFAULT_MANUAL_PROVIDER_NAME = "Manual bank";

    private final BankConnectionRepository bankConnectionRepository;
    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        backfillExistingConnections();
        backfillMissingSaltEdgeConnectionsFromAccounts();
        backfillLegacyLocalAccounts();
    }

    private void backfillExistingConnections() {
        for (BankConnection connection : bankConnectionRepository.findAll()) {
            boolean changed = false;

            if (connection.getType() == null) {
                connection.setType(BankConnectionType.SALTEDGE);
                changed = true;
            }

            if (connection.getType() == BankConnectionType.SALTEDGE
                    && isBlank(connection.getExternalConnectionId())) {
                connection.setExternalConnectionId(connection.getId());
                changed = true;
            }

            if (connection.getType() == BankConnectionType.MANUAL) {
                if (!MANUAL_CONNECTION_STATUS.equalsIgnoreCase(connection.getStatus())) {
                    connection.setStatus(MANUAL_CONNECTION_STATUS);
                    changed = true;
                }
                if (!isBlank(connection.getExternalConnectionId())) {
                    connection.setExternalConnectionId(null);
                    changed = true;
                }
            }

            if (changed) {
                bankConnectionRepository.save(connection);
            }
        }
    }

    private void backfillMissingSaltEdgeConnectionsFromAccounts() {
        for (BankAccount account : bankAccountRepository.findByConnectionIdIsNotNullAndIsSaltedgeTrue()) {
            String connectionId = account.getConnectionId();
            if (isBlank(connectionId) || bankConnectionRepository.findById(connectionId).isPresent()) {
                continue;
            }

            BankConnection connection = new BankConnection();
            connection.setId(connectionId);
            connection.setUserId(account.getUserId());
            connection.setProviderName(resolveProviderName(account));
            connection.setType(BankConnectionType.SALTEDGE);
            connection.setExternalConnectionId(connectionId);
            connection.setStatus(null);
            connection.setCreatedAt(LocalDate.now());
            bankConnectionRepository.save(connection);
        }
    }

    private void backfillLegacyLocalAccounts() {
        List<BankAccount> legacyLocalAccounts = bankAccountRepository.findByConnectionIdIsNullAndIsSaltedgeFalse();
        for (BankAccount account : legacyLocalAccounts) {
            BankConnection connection = new BankConnection();
            connection.setId("manual_" + UUID.randomUUID());
            connection.setUserId(account.getUserId());
            connection.setProviderName(resolveProviderName(account));
            connection.setType(BankConnectionType.MANUAL);
            connection.setExternalConnectionId(null);
            connection.setStatus(MANUAL_CONNECTION_STATUS);
            connection.setCreatedAt(LocalDate.now());
            bankConnectionRepository.save(connection);

            account.setConnectionId(connection.getId());
            bankAccountRepository.save(account);

            List<Transaction> transactions = transactionRepository.findByUserIdAndBankAccountId(
                    account.getUserId(),
                    account.getSaltedgeAccountId()
            );
            for (Transaction transaction : transactions) {
                if (isBlank(transaction.getConnectionId())) {
                    transaction.setConnectionId(connection.getId());
                    transactionRepository.save(transaction);
                }
            }
        }
    }

    private String resolveProviderName(BankAccount account) {
        if (!isBlank(account.getInstitutionName())) {
            return account.getInstitutionName().trim();
        }
        return DEFAULT_MANUAL_PROVIDER_NAME;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
