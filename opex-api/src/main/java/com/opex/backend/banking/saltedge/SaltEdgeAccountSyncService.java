package com.opex.backend.banking.saltedge;

import com.opex.backend.banking.model.BankAccount;
import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.banking.model.Transaction;
import com.opex.backend.banking.repository.BankAccountRepository;
import com.opex.backend.banking.repository.TransactionRepository;
import com.opex.backend.banking.saltedge.dto.SaltEdgeAccountResponse;
import com.opex.backend.banking.saltedge.dto.SaltEdgeTransactionResponse;
import com.opex.backend.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class SaltEdgeAccountSyncService {

    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;
    private final SaltEdgeApiService saltEdgeApiService;

    public void syncConnection(User user, BankConnection connection) {
        SaltEdgeAccountResponse accountsResponse = saltEdgeApiService.getAccounts(connection.getId());
        if (accountsResponse == null || accountsResponse.getData() == null) {
            return;
        }

        for (SaltEdgeAccountResponse.AccountItem accountItem : accountsResponse.getData()) {
            syncAccount(user, connection, accountItem);
        }
    }

    private void syncAccount(User user, BankConnection connection, SaltEdgeAccountResponse.AccountItem accountItem) {
        BankAccount account = bankAccountRepository.findById(accountItem.getId()).orElseGet(BankAccount::new);
        account.setSaltedgeAccountId(accountItem.getId());
        account.setUserId(user.getId());
        account.setConnectionId(connection.getId());
        account.setBalance(accountItem.getBalance());
        account.setCurrency(accountItem.getCurrencyCode());
        account.setIsSaltedge(true);

        if (!hasText(account.getInstitutionName())) {
            account.setInstitutionName(connection.getProviderName());
        }
        if (!hasText(account.getNature())) {
            account.setNature(accountItem.getNature());
        }
        if (account.getIsForTax() == null) {
            account.setIsForTax(false);
        }

        bankAccountRepository.save(account);
        syncTransactions(user, connection, accountItem);
    }

    private void syncTransactions(User user, BankConnection connection, SaltEdgeAccountResponse.AccountItem accountItem) {
        SaltEdgeTransactionResponse transactionsResponse =
                saltEdgeApiService.getTransactions(connection.getId(), accountItem.getId());
        if (transactionsResponse == null || transactionsResponse.getData() == null) {
            return;
        }

        for (SaltEdgeTransactionResponse.TransactionItem transactionItem : transactionsResponse.getData()) {
            Transaction transaction = transactionRepository.findById(transactionItem.getId()).orElse(new Transaction());
            transaction.setId(transactionItem.getId());
            transaction.setUserId(user.getId());
            transaction.setConnectionId(connection.getId());
            transaction.setAmount(transactionItem.getAmount());
            transaction.setBookingDate(transactionItem.getMadeOn());
            transaction.setCategory(transactionItem.getCategory());
            transaction.setDescription(transactionItem.getDescription());
            transaction.setStatus(transactionItem.getStatus());
            transaction.setType(resolveTransactionType(transactionItem.getAmount()));
            transaction.setIsSaltedge(true);

            if (transactionItem.getExtra() != null && transactionItem.getExtra().containsKey("merchant_name")) {
                transaction.setMerchantName((String) transactionItem.getExtra().get("merchant_name"));
            }

            transactionRepository.save(transaction);
        }
    }

    private String resolveTransactionType(BigDecimal amount) {
        BigDecimal safeAmount = amount != null ? amount : BigDecimal.ZERO;
        return safeAmount.compareTo(BigDecimal.ZERO) >= 0 ? "CREDIT" : "DEBIT";
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
