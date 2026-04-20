package com.opex.backend.banking.service;

import com.opex.backend.banking.dto.BankAccountRequest;
import com.opex.backend.banking.dto.SaltedgeBankAccountUpdateRequest;
import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.banking.model.BankConnectionType;
import com.opex.backend.common.exception.BadRequestException;
import com.opex.backend.common.exception.ResourceNotFoundException;
import com.opex.backend.banking.model.BankAccount;
import com.opex.backend.banking.repository.BankAccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BankAccountServiceTest {

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private BankingAnalyticsService bankingAnalyticsService;

    @Mock
    private BankConnectionService bankConnectionService;

    @InjectMocks
    private BankAccountService bankAccountService;

    @Test
    void createLocalAccountInConnectionUsesExistingManualConnection() {
        BankConnection connection = new BankConnection();
        connection.setId("manual_conn_1");
        connection.setUserId("user-1");
        connection.setProviderName("Manual Bank");
        connection.setType(BankConnectionType.MANUAL);

        BankAccountRequest request = new BankAccountRequest();
        request.setInstitutionName("Main checking");
        request.setBalance(new BigDecimal("150.00"));
        request.setCurrency("EUR");
        request.setCountry("IT");
        request.setIsForTax(true);
        request.setNature("business");

        when(bankConnectionService.getOwnedConnectionByType("user-1", "manual_conn_1", BankConnectionType.MANUAL))
                .thenReturn(connection);
        when(bankAccountRepository.save(any(BankAccount.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        BankAccount created = bankAccountService.createLocalAccountInConnection("user-1", "manual_conn_1", request);

        assertEquals("manual_conn_1", created.getConnectionId());
        assertEquals("Main checking", created.getInstitutionName());
        assertEquals(new BigDecimal("150.00"), created.getBalance());
        assertEquals("EUR", created.getCurrency());
        assertEquals("IT", created.getCountry());
        assertEquals(Boolean.TRUE, created.getIsForTax());
        assertEquals("business", created.getNature());
        assertEquals(Boolean.FALSE, created.getIsSaltedge());
    }

    @Test
    void updateLocalAccountInConnectionRejectsAccountsOutsideSelectedManualConnection() {
        BankConnection connection = new BankConnection();
        connection.setId("manual_conn_1");
        connection.setUserId("user-1");
        connection.setType(BankConnectionType.MANUAL);

        BankAccount account = new BankAccount();
        account.setSaltedgeAccountId("local_acc_1");
        account.setUserId("user-1");
        account.setConnectionId("manual_conn_2");
        account.setIsSaltedge(false);

        when(bankConnectionService.getOwnedConnectionByType("user-1", "manual_conn_1", BankConnectionType.MANUAL))
                .thenReturn(connection);
        when(bankAccountRepository.findBySaltedgeAccountIdAndUserId("local_acc_1", "user-1"))
                .thenReturn(Optional.of(account));

        assertThrows(ResourceNotFoundException.class, () ->
                bankAccountService.updateLocalAccountInConnection("user-1", "manual_conn_1", "local_acc_1", new BankAccountRequest())
        );

        verify(bankAccountRepository, never()).save(any(BankAccount.class));
    }

    @Test
    void updateLocalAccountInConnectionRejectsSaltedgeAccounts() {
        BankConnection connection = new BankConnection();
        connection.setId("manual_conn_1");
        connection.setUserId("user-1");
        connection.setType(BankConnectionType.MANUAL);

        BankAccount account = new BankAccount();
        account.setSaltedgeAccountId("se_acc_1");
        account.setUserId("user-1");
        account.setConnectionId("manual_conn_1");
        account.setIsSaltedge(true);

        when(bankConnectionService.getOwnedConnectionByType("user-1", "manual_conn_1", BankConnectionType.MANUAL))
                .thenReturn(connection);
        when(bankAccountRepository.findBySaltedgeAccountIdAndUserId("se_acc_1", "user-1"))
                .thenReturn(Optional.of(account));

        BadRequestException error = assertThrows(BadRequestException.class, () ->
                bankAccountService.updateLocalAccountInConnection(
                        "user-1",
                        "manual_conn_1",
                        "se_acc_1",
                        new BankAccountRequest()
                )
        );

        assertTrue(error.getMessage().contains("Salt Edge"));
        verify(bankAccountRepository, never()).save(any(BankAccount.class));
    }

    @Test
    void updateSaltedgeAccountUpdatesOnlyEditableFields() {
        BankAccount account = new BankAccount();
        account.setSaltedgeAccountId("se_acc_2");
        account.setUserId("user-1");
        account.setIsSaltedge(true);
        account.setBalance(new BigDecimal("150.00"));
        account.setCountry("IT");
        account.setCurrency("EUR");
        account.setInstitutionName("Original Bank");
        account.setIsForTax(false);
        account.setNature("checking");

        SaltedgeBankAccountUpdateRequest request = new SaltedgeBankAccountUpdateRequest();
        request.setInstitutionName("Custom Label");
        request.setIsForTax(true);
        request.setNature("savings");

        when(bankAccountRepository.findBySaltedgeAccountIdAndUserId("se_acc_2", "user-1"))
                .thenReturn(Optional.of(account));
        when(bankAccountRepository.save(any(BankAccount.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        BankAccount updated = bankAccountService.updateSaltedgeAccount("user-1", "se_acc_2", request);

        assertEquals("Custom Label", updated.getInstitutionName());
        assertEquals(Boolean.TRUE, updated.getIsForTax());
        assertEquals("savings", updated.getNature());
        assertEquals(new BigDecimal("150.00"), updated.getBalance());
        assertEquals("IT", updated.getCountry());
        assertEquals("EUR", updated.getCurrency());
    }

    @Test
    void updateSaltedgeAccountRejectsLocalAccounts() {
        BankAccount account = new BankAccount();
        account.setSaltedgeAccountId("local_acc_1");
        account.setUserId("user-1");
        account.setIsSaltedge(false);

        when(bankAccountRepository.findBySaltedgeAccountIdAndUserId("local_acc_1", "user-1"))
                .thenReturn(Optional.of(account));

        BadRequestException error = assertThrows(BadRequestException.class, () ->
                bankAccountService.updateSaltedgeAccount("user-1", "local_acc_1", new SaltedgeBankAccountUpdateRequest())
        );

        assertTrue(error.getMessage().contains("Salt Edge"));
        verify(bankAccountRepository, never()).save(any(BankAccount.class));
    }
}
