package com.opex.backend.banking.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "bank_connection")
@Getter
@Setter
@NoArgsConstructor
public class BankConnection {

    @Id
    private String id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "provider_name")
    private String providerName;

    @Enumerated(EnumType.STRING)
    @Column(name = "connection_type")
    private BankConnectionType type;

    @Column(name = "external_connection_id")
    private String externalConnectionId;

    private String status;

    @Column(name = "created_at")
    private LocalDate createdAt;
}
