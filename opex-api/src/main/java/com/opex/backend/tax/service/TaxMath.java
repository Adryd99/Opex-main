package com.opex.backend.tax.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class TaxMath {

    public static final int MONEY_SCALE = 2;
    public static final BigDecimal ZERO_RATE = new BigDecimal("0.00");
    public static final String DEFAULT_CURRENCY = "EUR";

    private TaxMath() {
    }

    public static BigDecimal money(BigDecimal value) {
        return (value != null ? value : BigDecimal.ZERO).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal maxZero(BigDecimal value) {
        BigDecimal safeValue = value != null ? value : BigDecimal.ZERO;
        return safeValue.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : safeValue;
    }

    public static BigDecimal percentage(BigDecimal numerator, BigDecimal denominator) {
        if (denominator == null || denominator.compareTo(BigDecimal.ZERO) <= 0) {
            return ZERO_RATE;
        }

        BigDecimal safeNumerator = numerator != null ? numerator : BigDecimal.ZERO;
        BigDecimal rawPercentage = safeNumerator
                .divide(denominator, 6, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));

        if (rawPercentage.compareTo(new BigDecimal("100")) > 0) {
            rawPercentage = new BigDecimal("100");
        }

        return rawPercentage.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }
}
