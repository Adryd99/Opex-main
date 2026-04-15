package com.saltedgeproxy.app.saltedgeproxy.controller;

import com.saltedgeproxy.app.saltedgeproxy.dto.SaltEdgeAccountResponse;
import com.saltedgeproxy.app.saltedgeproxy.dto.SaltEdgeConnectionsResponse;
import com.saltedgeproxy.app.saltedgeproxy.dto.SaltEdgeTransactionResponse;
import com.saltedgeproxy.app.saltedgeproxy.model.BankAccount;
import com.saltedgeproxy.app.saltedgeproxy.model.BankConnection;
import com.saltedgeproxy.app.saltedgeproxy.model.User;
import com.saltedgeproxy.app.saltedgeproxy.repository.BankAccountRepository;
import com.saltedgeproxy.app.saltedgeproxy.repository.BankConnectionRepository;
import com.saltedgeproxy.app.saltedgeproxy.repository.TransactionRepository;
import com.saltedgeproxy.app.saltedgeproxy.repository.UserRepository;
import com.saltedgeproxy.app.saltedgeproxy.service.SaltEdgeService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private SaltEdgeService saltEdgeService;

    @Mock
    private BankConnectionRepository bankConnectionRepository;

    @InjectMocks
    private UserController userController;

    @Test
    void syncUserPreservesLocallyManagedSaltedgeFields() {
        User user = new User("user-1", "user@example.com", "User", "One");
        user.setCustomerId("customer-1");

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

        SaltEdgeConnectionsResponse connectionsResponse = new SaltEdgeConnectionsResponse();
        connectionsResponse.setData(List.of());

        SaltEdgeTransactionResponse transactionResponse = new SaltEdgeTransactionResponse();
        transactionResponse.setData(List.of());

        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(saltEdgeService.getConnections("customer-1")).thenReturn(connectionsResponse);
        when(bankConnectionRepository.findByUserId("user-1")).thenReturn(List.of(connection));
        when(saltEdgeService.getAccounts("conn-1")).thenReturn(accountResponse);
        when(bankAccountRepository.findById("acc-1")).thenReturn(Optional.of(existingAccount));
        when(saltEdgeService.getTransactions("conn-1", "acc-1")).thenReturn(transactionResponse);
        when(bankAccountRepository.save(any(BankAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<String> response = userController.syncUser("user-1");

        assertEquals(HttpStatus.OK, response.getStatusCode());
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
