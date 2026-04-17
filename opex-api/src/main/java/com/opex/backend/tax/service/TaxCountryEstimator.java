package com.opex.backend.tax.service;

import java.math.BigDecimal;

public interface TaxCountryEstimator {

    boolean supports(TaxUserContext userContext);

    TaxEstimate estimate(TaxUserContext userContext, BigDecimal grossIncome, BigDecimal businessExpenses);
}
