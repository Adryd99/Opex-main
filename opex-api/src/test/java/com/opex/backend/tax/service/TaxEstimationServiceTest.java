package com.opex.backend.tax.service;

import com.opex.backend.user.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TaxEstimationServiceTest {

    private TaxEstimationService taxEstimationService;

    @BeforeEach
    void setUp() {
        taxEstimationService = new TaxEstimationService(List.of(
                new NetherlandsTaxCountryEstimator(),
                new BelgiumTaxCountryEstimator(),
                new GermanyTaxCountryEstimator(),
                new ItalyTaxCountryEstimator(),
                new FallbackTaxCountryEstimator()
        ));
    }

    @Test
    void estimateUsesItalyForfettarioStrategy() {
        User user = new User();
        user.setResidence("Italy (IT)");
        user.setTaxRegime("Forfettario");
        user.setStartup(true);
        user.setActivityType("consultant");

        TaxEstimate estimate = taxEstimationService.estimate(
                user,
                new BigDecimal("100000"),
                new BigDecimal("5000")
        );

        assertEquals(new BigDecimal("57720.00"), estimate.taxableIncome());
        assertEquals(new BigDecimal("2886.00"), estimate.incomeTax());
        assertEquals(new BigDecimal("20280.00"), estimate.socialContributions());
        assertEquals(new BigDecimal("0.00"), estimate.vatToPay());
    }

    @Test
    void estimateFallsBackForUnknownResidence() {
        User user = new User();
        user.setResidence("Spain");

        TaxEstimate estimate = taxEstimationService.estimate(
                user,
                new BigDecimal("10000"),
                new BigDecimal("2000")
        );

        assertEquals(new BigDecimal("8000.00"), estimate.taxableIncome());
        assertEquals(new BigDecimal("2957.60"), estimate.incomeTax());
        assertEquals(new BigDecimal("0.00"), estimate.socialContributions());
        assertEquals(new BigDecimal("1680.00"), estimate.vatToPay());
    }
}
