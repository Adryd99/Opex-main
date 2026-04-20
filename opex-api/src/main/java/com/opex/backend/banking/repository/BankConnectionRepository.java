package com.opex.backend.banking.repository;

import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.banking.model.BankConnectionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankConnectionRepository extends JpaRepository<BankConnection, String> {
    List<BankConnection> findByUserId(String userId);
    List<BankConnection> findByUserIdAndType(String userId, BankConnectionType type);
    Optional<BankConnection> findByIdAndUserId(String id, String userId);
    Optional<BankConnection> findByIdAndUserIdAndType(String id, String userId, BankConnectionType type);
    Optional<BankConnection> findByExternalConnectionIdAndType(String externalConnectionId, BankConnectionType type);
}
