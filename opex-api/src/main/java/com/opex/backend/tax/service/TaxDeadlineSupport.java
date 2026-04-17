package com.opex.backend.tax.service;

import com.opex.backend.tax.dto.TaxBufferDashboardResponse;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.Locale;
import java.util.Optional;

public final class TaxDeadlineSupport {

    private TaxDeadlineSupport() {
    }

    public static boolean isPaidStatus(String status) {
        if (status == null) {
            return false;
        }

        String normalized = status.trim().toUpperCase(Locale.ROOT);
        return "PAID".equals(normalized) || "COMPLETED".equals(normalized);
    }

    public static String resolveDeadlineStatus(String status, LocalDate dueDate) {
        if (isPaidStatus(status)) {
            return "PAID".equalsIgnoreCase(Optional.ofNullable(status).orElse("")) ? "Paid" : "Completed";
        }
        if (dueDate != null && dueDate.isBefore(LocalDate.now())) {
            return "Overdue";
        }
        return "Upcoming";
    }

    public static Comparator<TaxBufferDashboardResponse.TaxDeadlineItem> deadlineComparator() {
        return Comparator.comparing(
                        TaxBufferDashboardResponse.TaxDeadlineItem::getDueDate,
                        Comparator.nullsLast(Comparator.naturalOrder())
                )
                .thenComparing(item -> Optional.ofNullable(item.getTitle()).orElse(""), String.CASE_INSENSITIVE_ORDER)
                .thenComparing(item -> Optional.ofNullable(item.getPeriodLabel()).orElse(""), String.CASE_INSENSITIVE_ORDER);
    }

    public static String resolveDeadlineIdentity(TaxBufferDashboardResponse.TaxDeadlineItem item) {
        String id = Optional.ofNullable(item.getId()).orElse("").trim();
        if (!id.isEmpty()) {
            return id;
        }

        return (Optional.ofNullable(item.getTitle()).orElse("").trim().toLowerCase(Locale.ROOT) + "|"
                + Optional.ofNullable(item.getDueDate()).map(LocalDate::toString).orElse("") + "|"
                + Optional.ofNullable(item.getPeriodLabel()).orElse("").trim().toLowerCase(Locale.ROOT));
    }

    public static String escapeIcsText(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("\\", "\\\\")
                .replace(",", "\\,")
                .replace(";", "\\;")
                .replace("\n", "\\n");
    }
}
