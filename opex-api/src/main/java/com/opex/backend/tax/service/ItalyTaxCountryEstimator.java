package com.opex.backend.tax.service;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Locale;

@Component
@Order(40)
public class ItalyTaxCountryEstimator implements TaxCountryEstimator {

    private static final BigDecimal FORFETTARIO_COEFF_PROFESSIONAL = new BigDecimal("0.78");
    private static final BigDecimal FORFETTARIO_COEFF_RETAIL = new BigDecimal("0.40");
    private static final BigDecimal FORFETTARIO_COEFF_CONSTRUCTION = new BigDecimal("0.86");
    private static final BigDecimal FORFETTARIO_COEFF_OTHER = new BigDecimal("0.67");
    private static final BigDecimal INPS_RATE = new BigDecimal("0.26");
    private static final BigDecimal STARTUP_RATE = new BigDecimal("0.05");
    private static final BigDecimal FORFETTARIO_RATE = new BigDecimal("0.15");
    private static final BigDecimal IRPEF_B1_LIMIT = new BigDecimal("28000");
    private static final BigDecimal IRPEF_B2_LIMIT = new BigDecimal("50000");

    @Override
    public boolean supports(TaxUserContext userContext) {
        return userContext.isItalianResidence();
    }

    @Override
    public TaxEstimate estimate(TaxUserContext userContext, BigDecimal grossIncome, BigDecimal businessExpenses) {
        if (userContext.isForfettarioRegime()) {
            return estimateForfettario(userContext, grossIncome);
        }
        return estimateOrdinario(userContext, grossIncome, businessExpenses);
    }

    private TaxEstimate estimateForfettario(TaxUserContext userContext, BigDecimal grossIncome) {
        BigDecimal coefficient = resolveForfettarioCoefficient(userContext.activityType());
        BigDecimal taxableBase = grossIncome.multiply(coefficient);
        BigDecimal inps = taxableBase.multiply(INPS_RATE);
        BigDecimal taxable = TaxMath.maxZero(taxableBase.subtract(inps));
        BigDecimal rate = userContext.isStartup() ? STARTUP_RATE : FORFETTARIO_RATE;
        BigDecimal incomeTax = taxable.multiply(rate);

        return new TaxEstimate(
                TaxMath.money(taxable),
                TaxMath.money(incomeTax),
                TaxMath.money(inps),
                TaxMath.money(BigDecimal.ZERO)
        );
    }

    private TaxEstimate estimateOrdinario(TaxUserContext userContext, BigDecimal grossIncome, BigDecimal businessExpenses) {
        BigDecimal profit = TaxMath.maxZero(grossIncome.subtract(businessExpenses));
        BigDecimal inps = profit.multiply(INPS_RATE);
        BigDecimal taxable = TaxMath.maxZero(profit.subtract(inps));
        BigDecimal incomeTax = computeIrpef(taxable);
        BigDecimal vatToPay = TaxMath.maxZero(grossIncome.subtract(businessExpenses).multiply(userContext.resolveVatRate()));

        return new TaxEstimate(
                TaxMath.money(taxable),
                TaxMath.money(incomeTax),
                TaxMath.money(inps),
                TaxMath.money(vatToPay)
        );
    }

    private BigDecimal resolveForfettarioCoefficient(String activityType) {
        if (activityType == null) {
            return FORFETTARIO_COEFF_PROFESSIONAL;
        }

        String normalized = activityType.toLowerCase(Locale.ROOT);
        if (normalized.contains("retail") || normalized.contains("e-commerce")
                || normalized.contains("food") || normalized.contains("hospitality")) {
            return FORFETTARIO_COEFF_RETAIL;
        }
        if (normalized.contains("construction") || normalized.contains("real estate")) {
            return FORFETTARIO_COEFF_CONSTRUCTION;
        }
        if (normalized.contains("other")) {
            return FORFETTARIO_COEFF_OTHER;
        }
        return FORFETTARIO_COEFF_PROFESSIONAL;
    }

    private BigDecimal computeIrpef(BigDecimal taxable) {
        if (taxable.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal tax = BigDecimal.ZERO;
        if (taxable.compareTo(IRPEF_B1_LIMIT) <= 0) {
            return taxable.multiply(new BigDecimal("0.23"));
        }

        tax = IRPEF_B1_LIMIT.multiply(new BigDecimal("0.23"));
        if (taxable.compareTo(IRPEF_B2_LIMIT) <= 0) {
            return tax.add(taxable.subtract(IRPEF_B1_LIMIT).multiply(new BigDecimal("0.35")));
        }

        tax = tax.add(IRPEF_B2_LIMIT.subtract(IRPEF_B1_LIMIT).multiply(new BigDecimal("0.35")));
        return tax.add(taxable.subtract(IRPEF_B2_LIMIT).multiply(new BigDecimal("0.43")));
    }
}
