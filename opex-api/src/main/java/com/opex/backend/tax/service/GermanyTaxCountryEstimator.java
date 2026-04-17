package com.opex.backend.tax.service;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Order(30)
public class GermanyTaxCountryEstimator implements TaxCountryEstimator {

    private static final BigDecimal HEALTH_RATE = new BigDecimal("0.16");
    private static final BigDecimal MIN_HEALTH = new BigDecimal("2500");
    private static final BigDecimal TAX_FREE_LIMIT = new BigDecimal("11604");
    private static final BigDecimal TAX_B2_LIMIT = new BigDecimal("30000");
    private static final BigDecimal TAX_B3_LIMIT = new BigDecimal("70000");

    @Override
    public boolean supports(TaxUserContext userContext) {
        return userContext.isGermanResidence();
    }

    @Override
    public TaxEstimate estimate(TaxUserContext userContext, BigDecimal grossIncome, BigDecimal businessExpenses) {
        BigDecimal profit = TaxMath.maxZero(grossIncome.subtract(businessExpenses));
        BigDecimal vatToPay = userContext.isVatExempt()
                ? BigDecimal.ZERO
                : TaxMath.maxZero(grossIncome.subtract(businessExpenses).multiply(userContext.resolveVatRate()));

        BigDecimal health = profit.multiply(HEALTH_RATE).max(MIN_HEALTH);
        BigDecimal social = health;
        BigDecimal taxable = TaxMath.maxZero(profit.subtract(social));
        BigDecimal incomeTax = computeIncomeTax(taxable);

        return new TaxEstimate(
                TaxMath.money(taxable),
                TaxMath.money(incomeTax),
                TaxMath.money(social),
                TaxMath.money(vatToPay)
        );
    }

    private BigDecimal computeIncomeTax(BigDecimal taxable) {
        if (taxable.compareTo(TAX_FREE_LIMIT) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal tax = BigDecimal.ZERO;
        if (taxable.compareTo(TAX_B2_LIMIT) <= 0) {
            return taxable.subtract(TAX_FREE_LIMIT).multiply(new BigDecimal("0.20"));
        }

        tax = TAX_B2_LIMIT.subtract(TAX_FREE_LIMIT).multiply(new BigDecimal("0.20"));
        if (taxable.compareTo(TAX_B3_LIMIT) <= 0) {
            return tax.add(taxable.subtract(TAX_B2_LIMIT).multiply(new BigDecimal("0.30")));
        }

        tax = tax.add(TAX_B3_LIMIT.subtract(TAX_B2_LIMIT).multiply(new BigDecimal("0.30")));
        return tax.add(taxable.subtract(TAX_B3_LIMIT).multiply(new BigDecimal("0.42")));
    }
}
