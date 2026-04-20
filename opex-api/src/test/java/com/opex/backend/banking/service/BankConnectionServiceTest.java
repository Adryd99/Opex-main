package com.opex.backend.banking.service;

import com.opex.backend.banking.dto.BankConnectionResponse;
import com.opex.backend.banking.dto.ManualBankConnectionRequest;
import com.opex.backend.banking.dto.ManualBankConnectionUpdateRequest;
import com.opex.backend.banking.model.BankAccount;
import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.banking.model.BankConnectionType;
import com.opex.backend.banking.repository.BankAccountRepository;
import com.opex.backend.banking.repository.BankConnectionRepository;
import com.opex.backend.banking.repository.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BankConnectionServiceTest {

    @Mock
    private BankConnectionRepository bankConnectionRepository;

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private BankConnectionService bankConnectionService;

    @Test
    void createManualConnectionCreatesDedicatedContainer() {
        ManualBankConnectionRequest request = new ManualBankConnectionRequest();
        request.setProviderName("Household bank");

        when(bankConnectionRepository.save(any(BankConnection.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        BankConnection created = bankConnectionService.createManualConnection("user-1", request);

        assertNotNull(created.getId());
        assertTrue(created.getId().startsWith("manual_"));
        assertEquals("user-1", created.getUserId());
        assertEquals("Household bank", created.getProviderName());
        assertEquals(BankConnectionType.MANUAL, created.getType());
        assertNull(created.getExternalConnectionId());
        assertEquals("manual", created.getStatus());
        assertNotNull(created.getCreatedAt());
    }

    @Test
    void updateManualConnectionRenamesInheritedAccountLabelsOnly() {
        BankConnection connection = new BankConnection();
        connection.setId("manual_conn_1");
        connection.setUserId("user-1");
        connection.setProviderName("Old bank");
        connection.setType(BankConnectionType.MANUAL);

        BankAccount inheritedLabelAccount = new BankAccount();
        inheritedLabelAccount.setSaltedgeAccountId("local_1");
        inheritedLabelAccount.setConnectionId("manual_conn_1");
        inheritedLabelAccount.setInstitutionName("Old bank");

        BankAccount customLabelAccount = new BankAccount();
        customLabelAccount.setSaltedgeAccountId("local_2");
        customLabelAccount.setConnectionId("manual_conn_1");
        customLabelAccount.setInstitutionName("Emergency reserve");

        ManualBankConnectionUpdateRequest request = new ManualBankConnectionUpdateRequest();
        request.setProviderName("New bank");

        when(bankConnectionRepository.findByIdAndUserIdAndType("manual_conn_1", "user-1", BankConnectionType.MANUAL))
                .thenReturn(Optional.of(connection));
        when(bankAccountRepository.findByUserIdAndConnectionId("user-1", "manual_conn_1"))
                .thenReturn(List.of(inheritedLabelAccount, customLabelAccount));
        when(bankConnectionRepository.save(any(BankConnection.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(bankAccountRepository.save(any(BankAccount.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        BankConnection updated = bankConnectionService.updateManualConnection("user-1", "manual_conn_1", request);

        assertEquals("New bank", updated.getProviderName());
        assertEquals("New bank", inheritedLabelAccount.getInstitutionName());
        assertEquals("Emergency reserve", customLabelAccount.getInstitutionName());
        verify(bankAccountRepository).save(inheritedLabelAccount);
        verify(bankAccountRepository, never()).save(customLabelAccount);
    }

    @Test
    void getUserConnectionResponsesIncludesNestedAccounts() {
        BankConnection connection = new BankConnection();
        connection.setId("manual_conn_1");
        connection.setUserId("user-1");
        connection.setProviderName("Manual bank");
        connection.setType(BankConnectionType.MANUAL);
        connection.setStatus("manual");
        connection.setCreatedAt(LocalDate.of(2026, 4, 20));

        BankAccount account = new BankAccount();
        account.setSaltedgeAccountId("local_1");
        account.setUserId("user-1");
        account.setConnectionId("manual_conn_1");
        account.setInstitutionName("Checking");
        account.setBalance(new BigDecimal("200.00"));
        account.setCurrency("EUR");
        account.setIsSaltedge(false);

        when(bankConnectionRepository.findByUserId("user-1")).thenReturn(List.of(connection));
        when(bankAccountRepository.findByUserId("user-1")).thenReturn(List.of(account));

        List<BankConnectionResponse> responses = bankConnectionService.getUserConnectionResponses("user-1");

        assertEquals(1, responses.size());
        BankConnectionResponse response = responses.get(0);
        assertEquals("manual_conn_1", response.id());
        assertEquals(BankConnectionType.MANUAL, response.type());
        assertEquals(1, response.accountCount());
        assertEquals(new BigDecimal("200.00"), response.totalBalance());
        assertEquals(1, response.accounts().size());
        assertEquals("local_1", response.accounts().get(0).saltedgeAccountId());
    }

    @Test
    void deleteManualConnectionRemovesTransactionsAccountsAndContainer() {
        BankConnection connection = new BankConnection();
        connection.setId("manual_conn_1");
        connection.setUserId("user-1");
        connection.setProviderName("Manual bank");
        connection.setType(BankConnectionType.MANUAL);

        when(bankConnectionRepository.findByIdAndUserIdAndType("manual_conn_1", "user-1", BankConnectionType.MANUAL))
                .thenReturn(Optional.of(connection));
        doNothing().when(transactionRepository).deleteByUserIdAndConnectionId("user-1", "manual_conn_1");
        doNothing().when(bankAccountRepository).deleteByUserIdAndConnectionId("user-1", "manual_conn_1");

        bankConnectionService.deleteManualConnection("user-1", "manual_conn_1");

        verify(transactionRepository).deleteByUserIdAndConnectionId("user-1", "manual_conn_1");
        verify(bankAccountRepository).deleteByUserIdAndConnectionId("user-1", "manual_conn_1");
        verify(bankConnectionRepository).delete(connection);
    }
}
