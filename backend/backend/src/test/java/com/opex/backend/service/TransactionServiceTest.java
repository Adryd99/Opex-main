package com.opex.backend.service;

import com.opex.backend.dto.TransactionRequest;
import com.opex.backend.model.BankAccount;
import com.opex.backend.model.Transaction;
import com.opex.backend.repository.BankAccountRepository;
import com.opex.backend.repository.BankConnectionRepository;
import com.opex.backend.repository.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private BankConnectionRepository bankConnectionRepository;

    @InjectMocks
    private TransactionService transactionService;

    @Test
    void createLocalTransactionStoresSelectedLocalAccountId() {
        BankAccount localAccount = new BankAccount();
        localAccount.setSaltedgeAccountId("local_acc_1");
        localAccount.setUserId("user-1");
        localAccount.setConnectionId(null);
        localAccount.setIsSaltedge(false);
        localAccount.setBalance(new BigDecimal("100.00"));

        TransactionRequest request = new TransactionRequest();
        request.setBankAccountId("local_acc_1");
        request.setAmount(new BigDecimal("120.50"));
        request.setBookingDate(LocalDate.of(2026, 3, 26));
        request.setCategory("Salary");
        request.setDescription("March income");
        request.setMerchantName("Opex");
        request.setStatus("COMPLETED");
        request.setType("CREDIT");

        when(bankAccountRepository.findBySaltedgeAccountIdAndUserId("local_acc_1", "user-1"))
                .thenReturn(Optional.of(localAccount));
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Transaction created = transactionService.createLocalTransaction("user-1", request);

        assertEquals("user-1", created.getUserId());
        assertEquals("local_acc_1", created.getBankAccountId());
        assertNull(created.getConnectionId());
        assertEquals(Boolean.FALSE, created.getIsSaltedge());
        assertEquals(new BigDecimal("120.50"), created.getAmount());
        assertEquals(new BigDecimal("220.50"), localAccount.getBalance());
        assertTrue(created.getId().startsWith("trx_local_"));
        verify(bankAccountRepository).save(localAccount);
    }

    @Test
    void createLocalExpenseSubtractsFromLocalAccountBalance() {
        BankAccount localAccount = new BankAccount();
        localAccount.setSaltedgeAccountId("local_acc_2");
        localAccount.setUserId("user-1");
        localAccount.setConnectionId(null);
        localAccount.setIsSaltedge(false);
        localAccount.setBalance(new BigDecimal("100.00"));

        TransactionRequest request = new TransactionRequest();
        request.setBankAccountId("local_acc_2");
        request.setAmount(new BigDecimal("25.00"));
        request.setBookingDate(LocalDate.of(2026, 3, 26));
        request.setCategory("Bills");
        request.setDescription("Utility payment");
        request.setMerchantName("Provider");
        request.setStatus("COMPLETED");
        request.setType("DEBIT");

        when(bankAccountRepository.findBySaltedgeAccountIdAndUserId("local_acc_2", "user-1"))
                .thenReturn(Optional.of(localAccount));
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Transaction created = transactionService.createLocalTransaction("user-1", request);

        assertEquals(new BigDecimal("-25.00"), created.getAmount());
        assertEquals(new BigDecimal("75.00"), localAccount.getBalance());
        verify(bankAccountRepository).save(localAccount);
    }

    @Test
    void createLocalTransactionRejectsSaltedgeAccounts() {
        BankAccount saltedgeAccount = new BankAccount();
        saltedgeAccount.setSaltedgeAccountId("se_acc_1");
        saltedgeAccount.setUserId("user-1");
        saltedgeAccount.setIsSaltedge(true);

        TransactionRequest request = new TransactionRequest();
        request.setBankAccountId("se_acc_1");

        when(bankAccountRepository.findBySaltedgeAccountIdAndUserId("se_acc_1", "user-1"))
                .thenReturn(Optional.of(saltedgeAccount));

        RuntimeException error = assertThrows(RuntimeException.class, () ->
                transactionService.createLocalTransaction("user-1", request)
        );

        assertTrue(error.getMessage().contains("conti locali"));
        verify(transactionRepository, never()).save(any(Transaction.class));
    }
}
