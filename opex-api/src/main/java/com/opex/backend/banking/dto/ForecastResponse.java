package com.opex.backend.banking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ForecastResponse {

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class HistoricalPoint {
        private String key;      // "2025-01"
        private String label;    // "Jan 25"
        private BigDecimal income;
        private BigDecimal expenses; // always positive
        private BigDecimal net;
    }

    private List<HistoricalPoint> historical;
    private List<ForecastPoint> forecast;
    private String trend;        // "GROWING" | "DECLINING" | "STABLE"
    private int monthsOfData;
}
