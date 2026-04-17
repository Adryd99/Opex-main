package com.opex.backend.tax.service;

import com.opex.backend.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaxEstimationService {

    private final List<TaxCountryEstimator> estimators;

    public TaxEstimate estimate(User user, BigDecimal grossIncome, BigDecimal businessExpenses) {
        TaxUserContext userContext = new TaxUserContext(user);
        BigDecimal safeGrossIncome = grossIncome != null ? grossIncome : BigDecimal.ZERO;
        BigDecimal safeBusinessExpenses = businessExpenses != null ? businessExpenses : BigDecimal.ZERO;

        return estimators.stream()
                .filter(estimator -> estimator.supports(userContext))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No tax estimator available for the selected user profile."))
                .estimate(userContext, safeGrossIncome, safeBusinessExpenses);
    }
}
