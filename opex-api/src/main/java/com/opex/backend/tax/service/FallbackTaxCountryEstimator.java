package com.opex.backend.tax.service;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class FallbackTaxCountryEstimator implements TaxCountryEstimator {

    private static final BigDecimal FALLBACK_INCOME_TAX_RATE = new BigDecimal("0.3697");

    @Override
    public boolean supports(TaxUserContext userContext) {
        return true;
    }

    @Override
    public TaxEstimate estimate(TaxUserContext userContext, BigDecimal grossIncome, BigDecimal businessExpenses) {
        BigDecimal profit = TaxMath.maxZero(grossIncome.subtract(businessExpenses));
        BigDecimal incomeTax = profit.multiply(FALLBACK_INCOME_TAX_RATE);
        BigDecimal vatToPay = userContext.isVatExempt()
                ? BigDecimal.ZERO
                : TaxMath.maxZero(grossIncome.subtract(businessExpenses).multiply(userContext.resolveVatRate()));

        return new TaxEstimate(
                TaxMath.money(profit),
                TaxMath.money(incomeTax),
                TaxMath.money(BigDecimal.ZERO),
                TaxMath.money(vatToPay)
        );
    }
}
