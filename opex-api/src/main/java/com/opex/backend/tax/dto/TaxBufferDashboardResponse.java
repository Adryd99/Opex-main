package com.opex.backend.tax.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaxBufferDashboardResponse {

    private String selectedConnectionId;
    private int year;
    private String currency;
    private Summary summary;
    private IncomeSocialBreakdown incomeSocial;
    private VatBreakdown vat;
    private List<LiabilityItem> liabilitySplit;
    private List<TaxDeadlineItem> deadlines;
    private List<BufferActivityItem> activity;
    private List<ProviderItem> providers;
    private SafeMode safeMode;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private BigDecimal shouldSetAside;
        private BigDecimal alreadySaved;
        private BigDecimal missing;
        private BigDecimal completionPercentage;
        private BigDecimal weeklyTarget;
        private BigDecimal safeToSpend;
        private LocalDate targetDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IncomeSocialBreakdown {
        private BigDecimal taxableIncome;
        private BigDecimal incomeTax;
        private BigDecimal socialContributions;
        private BigDecimal subtotal;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VatBreakdown {
        private String regime;
        private BigDecimal rate;
        private BigDecimal vatLiability;
        private String warningMessage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LiabilityItem {
        private String label;
        private BigDecimal amount;
        private BigDecimal percentage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaxDeadlineItem {
        private String id;
        private String title;
        private LocalDate dueDate;
        private String status;
        private BigDecimal amount;
        private String currency;
        private String category;
        private String periodLabel;
        private String description;
        private Boolean systemGenerated;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BufferActivityItem {
        private String id;
        private String title;
        private LocalDate date;
        private BigDecimal amount;
        private String direction;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProviderItem {
        private String connectionId;
        private String providerName;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SafeMode {
        private Boolean compliant;
        private String message;
        private String recommendation;
    }
}
