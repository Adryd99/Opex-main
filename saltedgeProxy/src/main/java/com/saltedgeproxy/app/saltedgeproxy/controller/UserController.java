package com.saltedgeproxy.app.saltedgeproxy.controller;

import com.saltedgeproxy.app.saltedgeproxy.dto.*;
import com.saltedgeproxy.app.saltedgeproxy.model.BankAccount;
import com.saltedgeproxy.app.saltedgeproxy.model.BankConnection;
import com.saltedgeproxy.app.saltedgeproxy.model.Transaction;
import com.saltedgeproxy.app.saltedgeproxy.model.User;
import com.saltedgeproxy.app.saltedgeproxy.repository.*;
import com.saltedgeproxy.app.saltedgeproxy.service.SaltEdgeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BankAccountRepository bankAccountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private SaltEdgeService saltEdgeService;

    @Autowired
    private BankConnectionRepository bankConnectionRepository;

    @PostMapping("/{id}")
    public ResponseEntity<String> createUser(@PathVariable String id) {
        System.out.println("Creating user: " + id);
        // Recupero l'utente dal database (precedentemente inserito via Keycloak o altro processo)
        Optional<User> userOpt = userRepository.findById(id);

        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        Map<String, Object> customerData = new HashMap<>();
        customerData.put("email", user.getEmail() != null ? user.getEmail() : user.getId());

        // 1. Creazione Customer su SaltEdge solo se mancante
        if (user.getCustomerId() == null) {
            SaltEdgeCustomerResponse customerResponse = saltEdgeService.createCustomer(customerData);
            if (customerResponse == null || customerResponse.getData() == null || customerResponse.getData().getCustomerId() == null) {
                return ResponseEntity.internalServerError().body("Unable to create SaltEdge customer");
            }
            user.setCustomerId(customerResponse.getData().getCustomerId());
        }

        user.setIsActiveSaltedge(true);
        User savedUser = userRepository.save(user);

        // 2. Ogni chiamata createUser deve sempre creare una nuova connection e restituire la connect URL
        SaltEdgeConnectResponse connectResponse = saltEdgeService.connectConnection(savedUser.getCustomerId(), customerData);
        if (connectResponse == null || connectResponse.getData() == null || connectResponse.getData().getConnectUrl() == null) {
            return ResponseEntity.internalServerError().body("Unable to create SaltEdge connection");
        }

        // 3. Recuperiamo e aggiorniamo lo stato connessioni, ma senza fare sync di account/transazioni.
        SaltEdgeConnectionsResponse connectionsResponse = saltEdgeService.getConnections(savedUser.getCustomerId());
        upsertConnections(savedUser, connectionsResponse);

        return ResponseEntity.ok(connectResponse.getData().getConnectUrl());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        return userRepository.findById(id).map(user -> {
            user.setIsActiveSaltedge(false);
            userRepository.save(user);
            // Dovremmo anche rimuovere o disattivare le connessioni?
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/sync")
    public ResponseEntity<String> syncUser(@PathVariable String id) {
        return userRepository.findById(id).map(user -> {
            if (user.getCustomerId() == null) {
                return ResponseEntity.badRequest().body("Missing customerId. Call createUser first.");
            }

            // Ogni sync rilegge le connessioni da SaltEdge (nuove connection possibili dopo il connect flow)
            SaltEdgeConnectionsResponse connectionsResponse = saltEdgeService.getConnections(user.getCustomerId());
            upsertConnections(user, connectionsResponse);

            java.util.List<BankConnection> connections = bankConnectionRepository.findByUserId(user.getId());
            for (BankConnection connection : connections) {
                syncConnectionData(user, connection);
            }
            return ResponseEntity.ok(user.getId());
        }).orElse(ResponseEntity.notFound().build());
    }

    private void upsertConnections(User user, SaltEdgeConnectionsResponse connectionsResponse) {
        if (connectionsResponse == null || connectionsResponse.getData() == null) {
            return;
        }

        for (SaltEdgeConnectionsResponse.ConnectionItem cItem : connectionsResponse.getData()) {
            BankConnection connection = bankConnectionRepository.findById(cItem.getId()).orElse(new BankConnection());
            connection.setId(cItem.getId());
            connection.setUserId(user.getId());
            connection.setProviderName(cItem.getProviderName());
            connection.setStatus(cItem.getStatus());
            if (connection.getCreatedAt() == null) {
                connection.setCreatedAt(java.time.LocalDate.now());
            }
            bankConnectionRepository.save(connection);
        }
    }

    private void syncConnectionData(User user, BankConnection connection) {
        // 1. Get Accounts
        SaltEdgeAccountResponse accountsResponse = saltEdgeService.getAccounts(connection.getId());
        if (accountsResponse != null && accountsResponse.getData() != null) {
            for (SaltEdgeAccountResponse.AccountItem item : accountsResponse.getData()) {
                BankAccount account = bankAccountRepository.findById(item.getId()).orElse(new BankAccount());
                account.setSaltedgeAccountId(item.getId());
                account.setUserId(user.getId());
                account.setConnectionId(connection.getId());
                account.setBalance(item.getBalance());
                account.setInstitutionName(item.getName()); // Usiamo il nome del conto
                account.setCurrency(item.getCurrencyCode());
//                account.setNature(item.getNature());
                account.setIsSaltedge(true);
                if (account.getIsForTax() == null) account.setIsForTax(false);

                bankAccountRepository.save(account);

                // 2. Get Transactions for this account
                SaltEdgeTransactionResponse transactionsResponse = saltEdgeService.getTransactions(connection.getId(), item.getId());
                if (transactionsResponse != null && transactionsResponse.getData() != null) {
                    for (SaltEdgeTransactionResponse.TransactionItem tItem : transactionsResponse.getData()) {
                        Transaction transaction = transactionRepository.findById(tItem.getId()).orElse(new Transaction());
                        transaction.setId(tItem.getId());
                        transaction.setUserId(user.getId());
                        transaction.setConnectionId(connection.getId());
                        transaction.setAmount(tItem.getAmount());
                        transaction.setBookingDate(tItem.getMadeOn()); // Mapping Saltedge made_on -> booking_date
                        transaction.setCategory(tItem.getCategory());
                        transaction.setDescription(tItem.getDescription());
                        transaction.setStatus(tItem.getStatus());
                        transaction.setType(tItem.getAmount().compareTo(java.math.BigDecimal.ZERO) >= 0 ? "CREDIT" : "DEBIT");
                        transaction.setIsSaltedge(true);

                        if (tItem.getExtra() != null && tItem.getExtra().containsKey("merchant_name")) {
                            transaction.setMerchantName((String) tItem.getExtra().get("merchant_name"));
                        }

                        transactionRepository.save(transaction);
                    }
                }
            }
        }
    }
}
