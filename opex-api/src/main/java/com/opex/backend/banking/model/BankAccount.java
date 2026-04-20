package com.opex.backend.banking.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "bank_account")
@Getter
@Setter
@NoArgsConstructor
public class BankAccount {

    @Id
    @Column(name = "saltedge_account_id")
    private String saltedgeAccountId;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "connection_id")
    private String connectionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "connection_id", referencedColumnName = "id", insertable = false, updatable = false)
    @JsonIgnore
    private BankConnection connection;

    private BigDecimal balance;

    @Column(name = "institution_name")
    private String institutionName;

    private String country;
    private String currency;

    @Column(name = "is_for_tax")
    private Boolean isForTax;

    private String nature;

    @Column(name = "is_saltedge")
    private Boolean isSaltedge;
}
