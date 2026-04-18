package com.opex.backend.banking.dto;

import com.opex.backend.banking.model.BankAccount;

import java.math.BigDecimal;

public record BankAccountResponse(
        String saltedgeAccountId,
        String userId,
        String connectionId,
        BigDecimal balance,
        String institutionName,
        String country,
        String currency,
        Boolean isForTax,
        String nature,
        Boolean isSaltedge
) {
    public static BankAccountResponse from(BankAccount account) {
        return new BankAccountResponse(
                account.getSaltedgeAccountId(),
                account.getUserId(),
                account.getConnectionId(),
                account.getBalance(),
                account.getInstitutionName(),
                account.getCountry(),
                account.getCurrency(),
                account.getIsForTax(),
                account.getNature(),
                account.getIsSaltedge()
        );
    }
}
