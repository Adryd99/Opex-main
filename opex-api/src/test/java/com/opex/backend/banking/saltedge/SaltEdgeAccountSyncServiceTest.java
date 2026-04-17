package com.opex.backend.banking.saltedge;

import com.opex.backend.banking.model.BankAccount;
import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.banking.repository.BankAccountRepository;
import com.opex.backend.banking.repository.TransactionRepository;
import com.opex.backend.banking.saltedge.dto.SaltEdgeAccountResponse;
import com.opex.backend.banking.saltedge.dto.SaltEdgeTransactionResponse;
import com.opex.backend.user.model.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SaltEdgeAccountSyncServiceTest {

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private SaltEdgeApiService saltEdgeApiService;

    @InjectMocks
    private SaltEdgeAccountSyncService saltEdgeAccountSyncService;

    @Test
    void syncConnectionPreservesLocallyManagedSaltedgeFields() {
        User user = new User("user-1", "user@example.com", "User", "One");

        BankConnection connection = new BankConnection();
        connection.setId("conn-1");
        connection.setUserId("user-1");
        connection.setProviderName("Remote Provider");
        connection.setStatus("active");

        BankAccount existingAccount = new BankAccount();
        existingAccount.setSaltedgeAccountId("acc-1");
        existingAccount.setUserId("user-1");
        existingAccount.setConnectionId("conn-1");
        existingAccount.setInstitutionName("Custom Institution");
        existingAccount.setIsForTax(true);
        existingAccount.setNature("savings");
        existingAccount.setIsSaltedge(true);

        SaltEdgeAccountResponse.AccountItem accountItem = new SaltEdgeAccountResponse.AccountItem();
        accountItem.setId("acc-1");
        accountItem.setConnectionId("conn-1");
        accountItem.setNature("checking");
        accountItem.setBalance(new BigDecimal("245.10"));
        accountItem.setCurrencyCode("EUR");

        SaltEdgeAccountResponse accountResponse = new SaltEdgeAccountResponse();
        accountResponse.setData(List.of(accountItem));

        SaltEdgeTransactionResponse transactionResponse = new SaltEdgeTransactionResponse();
        transactionResponse.setData(List.of());

        when(saltEdgeApiService.getAccounts("conn-1")).thenReturn(accountResponse);
        when(bankAccountRepository.findById("acc-1")).thenReturn(Optional.of(existingAccount));
        when(saltEdgeApiService.getTransactions("conn-1", "acc-1")).thenReturn(transactionResponse);
        when(bankAccountRepository.save(any(BankAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));

        saltEdgeAccountSyncService.syncConnection(user, connection);

        ArgumentCaptor<BankAccount> savedAccountCaptor = ArgumentCaptor.forClass(BankAccount.class);
        verify(bankAccountRepository).save(savedAccountCaptor.capture());

        BankAccount savedAccount = savedAccountCaptor.getValue();
        assertEquals("Custom Institution", savedAccount.getInstitutionName());
        assertEquals(Boolean.TRUE, savedAccount.getIsForTax());
        assertEquals("savings", savedAccount.getNature());
        assertEquals(new BigDecimal("245.10"), savedAccount.getBalance());
        assertEquals("EUR", savedAccount.getCurrency());
        assertTrue(savedAccount.getIsSaltedge());
    }
}
