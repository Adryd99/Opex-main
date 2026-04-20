package com.opex.backend.banking.dto;

import com.opex.backend.banking.model.BankConnection;
import com.opex.backend.banking.model.BankConnectionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

public record BankConnectionResponse(
        String id,
        String userId,
        String providerName,
        BankConnectionType type,
        String externalConnectionId,
        String status,
        LocalDate createdAt,
        int accountCount,
        BigDecimal totalBalance,
        List<BankAccountResponse> accounts
) {
    public static BankConnectionResponse from(BankConnection connection, List<BankAccountResponse> accounts) {
        List<BankAccountResponse> normalizedAccounts = accounts == null
                ? List.of()
                : accounts.stream()
                .sorted(Comparator
                        .comparing(BankAccountResponse::institutionName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                        .thenComparing(BankAccountResponse::saltedgeAccountId, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();

        BigDecimal totalBalance = normalizedAccounts.stream()
                .map(BankAccountResponse::balance)
                .filter(balance -> balance != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new BankConnectionResponse(
                connection.getId(),
                connection.getUserId(),
                connection.getProviderName(),
                connection.getType(),
                connection.getExternalConnectionId(),
                connection.getStatus(),
                connection.getCreatedAt(),
                normalizedAccounts.size(),
                totalBalance,
                normalizedAccounts
        );
    }
}
