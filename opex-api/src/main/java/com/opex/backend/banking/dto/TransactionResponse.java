package com.opex.backend.banking.dto;

import com.opex.backend.banking.model.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionResponse(
        String id,
        String userId,
        String connectionId,
        String bankAccountId,
        BigDecimal amount,
        LocalDate bookingDate,
        String category,
        String description,
        String merchantName,
        String status,
        String type,
        Boolean isSaltedge
) {
    public static TransactionResponse from(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getUserId(),
                transaction.getConnectionId(),
                transaction.getBankAccountId(),
                transaction.getAmount(),
                transaction.getBookingDate(),
                transaction.getCategory(),
                transaction.getDescription(),
                transaction.getMerchantName(),
                transaction.getStatus(),
                transaction.getType(),
                transaction.getIsSaltedge()
        );
    }
}
