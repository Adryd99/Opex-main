package com.opex.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class YearlyAggregation {
    private String connectionId;
    private int year;
    private BigDecimal totalBalance;
    private BigDecimal totalIncome;
    private BigDecimal totalExpenses;
}
