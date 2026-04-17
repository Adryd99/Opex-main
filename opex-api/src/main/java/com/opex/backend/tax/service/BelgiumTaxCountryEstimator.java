package com.opex.backend.tax.service;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Order(20)
public class BelgiumTaxCountryEstimator implements TaxCountryEstimator {

    private static final BigDecimal SOC_B1_LIMIT = new BigDecimal("75024.54");
    private static final BigDecimal SOC_RATE_1 = new BigDecimal("0.205");
    private static final BigDecimal SOC_B2_LIMIT = new BigDecimal("110562.42");
    private static final BigDecimal SOC_RATE_2 = new BigDecimal("0.1416");
    private static final BigDecimal SOC_MIN_BASE = new BigDecimal("17374.08");
    private static final BigDecimal SIDE_LOWER = new BigDecimal("1922.16");
    private static final BigDecimal SIDE_RATE = new BigDecimal("0.105");
    private static final BigDecimal TAX_B1_LIMIT = new BigDecimal("15200");
    private static final BigDecimal TAX_B2_LIMIT = new BigDecimal("26830");
    private static final BigDecimal TAX_B3_LIMIT = new BigDecimal("46440");
    private static final BigDecimal TAX_CREDIT = new BigDecimal("2000");

    @Override
    public boolean supports(TaxUserContext userContext) {
        return userContext.isBelgianResidence();
    }

    @Override
    public TaxEstimate estimate(TaxUserContext userContext, BigDecimal grossIncome, BigDecimal businessExpenses) {
        BigDecimal profit = TaxMath.maxZero(grossIncome.subtract(businessExpenses));
        BigDecimal vatToPay = userContext.isVatExempt()
                ? BigDecimal.ZERO
                : TaxMath.maxZero(grossIncome.subtract(businessExpenses).multiply(userContext.resolveVatRate()));

        BigDecimal social = userContext.isMainActivityByDefault()
                ? computeMainActivitySocial(profit)
                : computeSideActivitySocial(profit);

        BigDecimal taxable = TaxMath.maxZero(profit.subtract(social));
        BigDecimal incomeTax = TaxMath.maxZero(computeIncomeTax(taxable).subtract(TAX_CREDIT));

        return new TaxEstimate(
                TaxMath.money(taxable),
                TaxMath.money(incomeTax),
                TaxMath.money(social),
                TaxMath.money(vatToPay)
        );
    }

    private BigDecimal computeMainActivitySocial(BigDecimal profit) {
        BigDecimal social;
        if (profit.compareTo(BigDecimal.ZERO) <= 0) {
            social = BigDecimal.ZERO;
        } else if (profit.compareTo(SOC_B1_LIMIT) <= 0) {
            social = profit.multiply(SOC_RATE_1);
        } else if (profit.compareTo(SOC_B2_LIMIT) <= 0) {
            social = SOC_B1_LIMIT.multiply(SOC_RATE_1)
                    .add(profit.subtract(SOC_B1_LIMIT).multiply(SOC_RATE_2));
        } else {
            social = SOC_B1_LIMIT.multiply(SOC_RATE_1)
                    .add(SOC_B2_LIMIT.subtract(SOC_B1_LIMIT).multiply(SOC_RATE_2))
                    .add(profit.subtract(SOC_B2_LIMIT).multiply(SOC_RATE_1));
        }

        BigDecimal minimumContribution = SOC_MIN_BASE.multiply(SOC_RATE_1);
        return social.max(minimumContribution);
    }

    private BigDecimal computeSideActivitySocial(BigDecimal profit) {
        if (profit.compareTo(SIDE_LOWER) <= 0) {
            return BigDecimal.ZERO;
        }
        if (profit.compareTo(SOC_MIN_BASE) <= 0) {
            return profit.subtract(SIDE_LOWER).multiply(SIDE_RATE);
        }

        return SOC_MIN_BASE.subtract(SIDE_LOWER).multiply(SIDE_RATE)
                .add(profit.subtract(SOC_MIN_BASE).multiply(SOC_RATE_1));
    }

    private BigDecimal computeIncomeTax(BigDecimal taxable) {
        if (taxable.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal tax = BigDecimal.ZERO;
        if (taxable.compareTo(TAX_B1_LIMIT) <= 0) {
            return taxable.multiply(new BigDecimal("0.25"));
        }

        tax = TAX_B1_LIMIT.multiply(new BigDecimal("0.25"));
        if (taxable.compareTo(TAX_B2_LIMIT) <= 0) {
            return tax.add(taxable.subtract(TAX_B1_LIMIT).multiply(new BigDecimal("0.40")));
        }

        tax = tax.add(TAX_B2_LIMIT.subtract(TAX_B1_LIMIT).multiply(new BigDecimal("0.40")));
        if (taxable.compareTo(TAX_B3_LIMIT) <= 0) {
            return tax.add(taxable.subtract(TAX_B2_LIMIT).multiply(new BigDecimal("0.45")));
        }

        tax = tax.add(TAX_B3_LIMIT.subtract(TAX_B2_LIMIT).multiply(new BigDecimal("0.45")));
        return tax.add(taxable.subtract(TAX_B3_LIMIT).multiply(new BigDecimal("0.50")));
    }
}
