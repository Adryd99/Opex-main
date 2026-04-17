package com.opex.backend.tax.service;

import java.math.BigDecimal;

public record TaxEstimate(
        BigDecimal taxableIncome,
        BigDecimal incomeTax,
        BigDecimal socialContributions,
        BigDecimal vatToPay
) {
}
