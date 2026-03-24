package com.opex.backend.repository;

import com.opex.backend.dto.AggregatedBalanceResponse;
import com.opex.backend.dto.MonthlyAggregation;
import com.opex.backend.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {

    // Restituisce TUTTE le transazioni di un utente (paginate) a prescindere dal conto
    Page<Transaction> findByUserId(String userId, Pageable pageable);

    // Restituisce tutte le transazioni di un utente (non paginato), utile per dashboard/analytics
    List<Transaction> findByUserId(String userId);

    // Variante filtrata per connectionId, utile per provider filter nella Tax Buffer UI
    List<Transaction> findByUserIdAndConnectionId(String userId, String connectionId);

    // Trova una singola transazione verificando che sia davvero dell'utente
    Optional<Transaction> findByIdAndUserId(String id, String userId);

    // Aggrega tutte le transazioni per connectionId: totale, entrate (>0), uscite (<0)
    @Query("SELECT new com.opex.backend.dto.AggregatedBalanceResponse(" +
            "t.connectionId, " +
            "SUM(t.amount), " +
            "SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), " +
            "SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END)) " +
            "FROM Transaction t " +
            "WHERE t.userId = :userId AND t.connectionId IS NOT NULL " +
            "GROUP BY t.connectionId " +
            "ORDER BY t.connectionId")
    List<AggregatedBalanceResponse> aggregateTransactionsByConnectionId(@Param("userId") String userId);

    // Aggrega gli importi per connectionId e mese; quarter e anno vengono derivati nel service
    @Query("SELECT new com.opex.backend.dto.MonthlyAggregation(" +
            "t.connectionId, " +
            "YEAR(t.bookingDate), " +
            "MONTH(t.bookingDate), " +
            "SUM(t.amount), " +
            "SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), " +
            "SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END)) " +
            "FROM Transaction t " +
            "WHERE t.userId = :userId AND t.connectionId IS NOT NULL " +
            "GROUP BY t.connectionId, YEAR(t.bookingDate), MONTH(t.bookingDate) " +
            "ORDER BY t.connectionId, YEAR(t.bookingDate), MONTH(t.bookingDate)")
    List<MonthlyAggregation> aggregateByConnectionIdAndMonth(@Param("userId") String userId);
}
