package com.opex.backend.banking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ForecastPoint {
    private String key;                 // e.g. "2025-07"
    private String label;               // e.g. "Jul 25"
    private BigDecimal predictedIncome;
    private BigDecimal predictedExpenses; // always positive
    private BigDecimal predictedNet;
}
