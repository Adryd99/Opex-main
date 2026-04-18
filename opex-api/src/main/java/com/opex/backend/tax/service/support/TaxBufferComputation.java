package com.opex.backend.tax.service.support;

import java.math.BigDecimal;

public record TaxBufferComputation(
        BigDecimal grossIncome,
        BigDecimal taxableIncome,
        BigDecimal incomeTax,
        BigDecimal socialContributions,
        BigDecimal subtotal,
        BigDecimal vatLiability,
        BigDecimal shouldSetAside,
        BigDecimal alreadySaved,
        BigDecimal missing,
        BigDecimal completionPercentage,
        BigDecimal weeklyTarget,
        BigDecimal safeToSpend
) {
}
