package com.opex.backend.banking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class TimeAggregatedResponse {
    private List<MonthlyAggregation> byMonth;
    private List<QuarterlyAggregation> byQuarter;
    private List<YearlyAggregation> byYear;
}
