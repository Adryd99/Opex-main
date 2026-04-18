package com.opex.backend.tax.dto;

import com.opex.backend.tax.model.Tax;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TaxResponse(
        String id,
        String userId,
        LocalDate deadline,
        String name,
        String status,
        BigDecimal amount,
        String currency,
        Boolean isExternal
) {
    public static TaxResponse from(Tax tax) {
        return new TaxResponse(
                tax.getId(),
                tax.getUserId(),
                tax.getDeadline(),
                tax.getName(),
                tax.getStatus(),
                tax.getAmount(),
                tax.getCurrency(),
                tax.getIsExternal()
        );
    }
}
