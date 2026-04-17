package com.opex.backend.banking.repository;

import com.opex.backend.banking.model.BankConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankConnectionRepository extends JpaRepository<BankConnection, String> {
    List<BankConnection> findByUserId(String userId);
    Optional<BankConnection> findByIdAndUserId(String id, String userId);
}
