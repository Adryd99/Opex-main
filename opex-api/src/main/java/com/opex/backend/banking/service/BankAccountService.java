package com.opex.backend.banking.service;

import com.opex.backend.banking.dto.AggregatedBalanceResponse;
import com.opex.backend.banking.dto.BankAccountRequest;
import com.opex.backend.banking.dto.SaltedgeBankAccountUpdateRequest;
import com.opex.backend.banking.dto.TimeAggregatedResponse;
import com.opex.backend.banking.model.BankAccount;
import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.banking.model.BankConnectionType;
import com.opex.backend.banking.repository.BankAccountRepository;
import com.opex.backend.common.exception.BadRequestException;
import com.opex.backend.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final BankingAnalyticsService bankingAnalyticsService;
    private final BankConnectionService bankConnectionService;

    public List<AggregatedBalanceResponse> getAggregatedBalances(String userId) {
        return bankingAnalyticsService.getAggregatedAccountBalances(userId);
    }

    public TimeAggregatedResponse getTimeAggregatedBalances(String userId) {
        return bankingAnalyticsService.getTimeAggregatedBalances(userId);
    }

    public Page<BankAccount> getUserAccounts(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return bankAccountRepository.findByUserId(userId, pageable);
    }

    @Transactional
    public BankAccount createLocalAccountInConnection(String userId, String connectionId, BankAccountRequest request) {
        BankConnection connection = bankConnectionService.getOwnedConnectionByType(userId, connectionId, BankConnectionType.MANUAL);

        BankAccount account = new BankAccount();
        account.setSaltedgeAccountId("local_" + UUID.randomUUID());
        account.setUserId(userId);
        account.setIsSaltedge(false);
        account.setConnectionId(connection.getId());
        account.setBalance(request.getBalance());
        account.setInstitutionName(resolveLocalAccountName(request, connection));
        account.setCountry(request.getCountry());
        account.setCurrency(request.getCurrency());
        account.setIsForTax(request.getIsForTax());
        account.setNature(request.getNature());
        return bankAccountRepository.save(account);
    }

    @Transactional
    public BankAccount updateLocalAccountInConnection(String userId, String connectionId, String accountId, BankAccountRequest request) {
        bankConnectionService.getOwnedConnectionByType(userId, connectionId, BankConnectionType.MANUAL);

        BankAccount account = getOwnedAccount(userId, accountId);
        if (Boolean.TRUE.equals(account.getIsSaltedge())) {
            throw new BadRequestException("Operation denied. Use the Salt Edge endpoint to modify this account.");
        }
        if (!connectionId.equals(account.getConnectionId())) {
            throw new ResourceNotFoundException("Bank account not found in the selected manual connection.");
        }

        applyLocalAccountUpdates(account, request);
        return bankAccountRepository.save(account);
    }

    @Transactional
    public BankAccount updateSaltedgeAccount(String userId, String accountId, SaltedgeBankAccountUpdateRequest request) {
        BankAccount account = getOwnedAccount(userId, accountId);

        if (!Boolean.TRUE.equals(account.getIsSaltedge())) {
            throw new BadRequestException("Operation denied. This endpoint supports Salt Edge accounts only.");
        }

        applyEditableSaltEdgeFields(account, request);
        return bankAccountRepository.save(account);
    }

    private void applyLocalAccountUpdates(BankAccount account, BankAccountRequest request) {
        if (request.getBalance() != null) {
            account.setBalance(request.getBalance());
        }
        if (request.getCountry() != null) {
            account.setCountry(request.getCountry());
        }
        if (request.getCurrency() != null) {
            account.setCurrency(request.getCurrency());
        }
        if (request.getInstitutionName() != null) {
            account.setInstitutionName(request.getInstitutionName());
        }
        if (request.getIsForTax() != null) {
            account.setIsForTax(request.getIsForTax());
        }
        if (request.getNature() != null) {
            account.setNature(request.getNature());
        }
    }

    private void applyEditableSaltEdgeFields(BankAccount account, SaltedgeBankAccountUpdateRequest request) {
        if (request.getInstitutionName() != null) {
            account.setInstitutionName(request.getInstitutionName());
        }
        if (request.getIsForTax() != null) {
            account.setIsForTax(request.getIsForTax());
        }
        if (request.getNature() != null) {
            account.setNature(request.getNature());
        }
    }

    private BankAccount getOwnedAccount(String userId, String accountId) {
        return bankAccountRepository.findBySaltedgeAccountIdAndUserId(accountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found or not authorized."));
    }

    private String resolveLocalAccountName(BankAccountRequest request, BankConnection connection) {
        String accountName = normalizeInstitutionName(request != null ? request.getInstitutionName() : null);
        if (!accountName.isBlank()) {
            return accountName;
        }

        if (connection.getProviderName() != null && !connection.getProviderName().isBlank()) {
            return connection.getProviderName();
        }

        throw new BadRequestException("institutionName is required");
    }

    private String normalizeInstitutionName(String institutionName) {
        return institutionName != null ? institutionName.trim() : "";
    }
}
