package com.opex.backend.tax.service;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Order(10)
public class NetherlandsTaxCountryEstimator implements TaxCountryEstimator {

    private static final BigDecimal BRACKET_1_LIMIT = new BigDecimal("75000");
    private static final BigDecimal BRACKET_1_RATE = new BigDecimal("0.3697");
    private static final BigDecimal BRACKET_2_RATE = new BigDecimal("0.4950");
    private static final BigDecimal SELF_EMPLOYED_DEDUCTION = new BigDecimal("5030");
    private static final BigDecimal SME_FACTOR = new BigDecimal("0.86");
    private static final BigDecimal TAX_CREDIT = new BigDecimal("3000");

    @Override
    public boolean supports(TaxUserContext userContext) {
        return userContext.isDutchResidence();
    }

    @Override
    public TaxEstimate estimate(TaxUserContext userContext, BigDecimal grossIncome, BigDecimal businessExpenses) {
        BigDecimal profit = TaxMath.maxZero(grossIncome.subtract(businessExpenses));

        if (userContext.isSelfEmployedByDefault()) {
            profit = TaxMath.maxZero(profit.subtract(SELF_EMPLOYED_DEDUCTION));
        }

        profit = profit.multiply(SME_FACTOR).setScale(TaxMath.MONEY_SCALE, java.math.RoundingMode.HALF_UP);
        BigDecimal taxable = TaxMath.maxZero(profit);

        BigDecimal incomeTax;
        if (taxable.compareTo(BRACKET_1_LIMIT) <= 0) {
            incomeTax = taxable.multiply(BRACKET_1_RATE);
        } else {
            incomeTax = BRACKET_1_LIMIT.multiply(BRACKET_1_RATE)
                    .add(taxable.subtract(BRACKET_1_LIMIT).multiply(BRACKET_2_RATE));
        }

        incomeTax = TaxMath.maxZero(incomeTax.subtract(TAX_CREDIT));

        BigDecimal vatToPay = userContext.isVatExempt()
                ? BigDecimal.ZERO
                : TaxMath.maxZero(grossIncome.subtract(businessExpenses).multiply(userContext.resolveVatRate()));

        return new TaxEstimate(
                TaxMath.money(taxable),
                TaxMath.money(incomeTax),
                TaxMath.money(BigDecimal.ZERO),
                TaxMath.money(vatToPay)
        );
    }
}
