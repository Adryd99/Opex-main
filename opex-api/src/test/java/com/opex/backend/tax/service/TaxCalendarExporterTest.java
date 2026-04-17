package com.opex.backend.tax.service;

import com.opex.backend.tax.dto.TaxBufferDashboardResponse;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TaxCalendarExporterTest {

    private final TaxCalendarExporter taxCalendarExporter = new TaxCalendarExporter();

    @Test
    void exportCalendarBuildsIcsAndEscapesEventText() {
        TaxBufferDashboardResponse.TaxDeadlineItem deadline = new TaxBufferDashboardResponse.TaxDeadlineItem(
                "deadline-1",
                "VAT, return; Q1",
                LocalDate.of(2026, 4, 30),
                "Upcoming",
                BigDecimal.ZERO,
                "EUR",
                "VAT",
                "Q1 2026",
                "Pay, file; now",
                true
        );

        TaxBufferDashboardResponse.TaxDeadlineItem ignored = new TaxBufferDashboardResponse.TaxDeadlineItem(
                "deadline-2",
                "Ignored deadline",
                null,
                "Upcoming",
                BigDecimal.ZERO,
                "EUR",
                "VAT",
                null,
                null,
                true
        );

        String calendar = taxCalendarExporter.exportCalendar(List.of(deadline, ignored));

        assertTrue(calendar.contains("BEGIN:VCALENDAR"));
        assertTrue(calendar.contains("BEGIN:VEVENT"));
        assertTrue(calendar.contains("SUMMARY:VAT\\, return\\; Q1"));
        assertTrue(calendar.contains("DESCRIPTION:Pay\\, file\\; now"));
        assertTrue(calendar.contains("DTSTART;VALUE=DATE:20260430"));
        assertFalse(calendar.contains("Ignored deadline"));
    }
}
