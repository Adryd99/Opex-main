package com.opex.backend.repository;

import com.opex.backend.dto.AggregatedBalanceResponse;
import com.opex.backend.model.BankAccount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, String> {

    // Trova tutti i conti dell'utente
    Page<BankAccount> findByUserId(String userId, Pageable pageable);

    // Trova un conto specifico controllando anche il proprietario (previene accessi illeciti)
    Optional<BankAccount> findBySaltedgeAccountIdAndUserId(String saltedgeAccountId, String userId);

    // Aggrega i balance per connection_id: totalBalance, totalIncome (>0), totalExpenses (<0)
    @Query("SELECT new com.opex.backend.dto.AggregatedBalanceResponse(" +
            "b.connectionId, " +
            "SUM(b.balance), " +
            "SUM(CASE WHEN b.balance > 0 THEN b.balance ELSE 0 END), " +
            "SUM(CASE WHEN b.balance < 0 THEN b.balance ELSE 0 END)) " +
            "FROM BankAccount b WHERE b.userId = :userId GROUP BY b.connectionId")
    List<AggregatedBalanceResponse> aggregateBalancesByConnectionId(@Param("userId") String userId);
}