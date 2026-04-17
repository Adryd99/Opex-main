package com.opex.backend.banking.service;

import com.opex.backend.banking.dto.AggregatedBalanceResponse;
import com.opex.backend.banking.dto.BankAccountRequest;
import com.opex.backend.banking.dto.SaltedgeBankAccountUpdateRequest;
import com.opex.backend.banking.dto.TimeAggregatedResponse;
import com.opex.backend.banking.model.BankAccount;
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
    public BankAccount createLocalAccount(String userId, BankAccountRequest request) {
        BankAccount account = new BankAccount();
        account.setSaltedgeAccountId("local_" + UUID.randomUUID());
        account.setUserId(userId);
        account.setIsSaltedge(false);
        account.setConnectionId(null);
        account.setBalance(request.getBalance());
        account.setInstitutionName(request.getInstitutionName());
        account.setCountry(request.getCountry());
        account.setCurrency(request.getCurrency());
        account.setIsForTax(request.getIsForTax());
        account.setNature(request.getNature());
        return bankAccountRepository.save(account);
    }

    @Transactional
    public BankAccount updateLocalAccount(String userId, String accountId, BankAccountRequest request) {
        BankAccount account = getOwnedAccount(userId, accountId);

        if (Boolean.TRUE.equals(account.getIsSaltedge())) {
            throw new BadRequestException("Operazione negata. Usa l'endpoint SaltEdge per modificare questo conto.");
        }

        applyLocalAccountUpdates(account, request);
        return bankAccountRepository.save(account);
    }

    @Transactional
    public BankAccount updateSaltedgeAccount(String userId, String accountId, SaltedgeBankAccountUpdateRequest request) {
        BankAccount account = getOwnedAccount(userId, accountId);

        if (!Boolean.TRUE.equals(account.getIsSaltedge())) {
            throw new BadRequestException("Operazione negata. Questo endpoint supporta solo conti SaltEdge.");
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
                .orElseThrow(() -> new ResourceNotFoundException("Conto non trovato o non autorizzato"));
    }
}
