package com.opex.backend.tax.service;

import com.opex.backend.tax.dto.TaxBufferDashboardResponse;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class TaxCalendarExporter {

    public String exportCalendar(List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines) {
        String nowUtc = LocalDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'"));

        StringBuilder builder = new StringBuilder();
        builder.append("BEGIN:VCALENDAR\r\n");
        builder.append("VERSION:2.0\r\n");
        builder.append("PRODID:-//Opex//Tax Buffer//EN\r\n");
        builder.append("CALSCALE:GREGORIAN\r\n");
        builder.append("METHOD:PUBLISH\r\n");

        for (TaxBufferDashboardResponse.TaxDeadlineItem item : deadlines) {
            if (item.getDueDate() == null) {
                continue;
            }

            builder.append("BEGIN:VEVENT\r\n");
            builder.append("UID:")
                    .append(TaxDeadlineSupport.escapeIcsText(TaxDeadlineSupport.resolveDeadlineIdentity(item)))
                    .append("@opex\r\n");
            builder.append("DTSTAMP:").append(nowUtc).append("\r\n");
            builder.append("DTSTART;VALUE=DATE:")
                    .append(item.getDueDate().format(DateTimeFormatter.BASIC_ISO_DATE))
                    .append("\r\n");
            builder.append("SUMMARY:")
                    .append(TaxDeadlineSupport.escapeIcsText(Optional.ofNullable(item.getTitle()).orElse("Tax deadline")))
                    .append("\r\n");
            builder.append("DESCRIPTION:")
                    .append(TaxDeadlineSupport.escapeIcsText(
                            Optional.ofNullable(item.getDescription())
                                    .orElse("Tax deadline - status: " + Optional.ofNullable(item.getStatus()).orElse("Upcoming"))
                    ))
                    .append("\r\n");
            builder.append("END:VEVENT\r\n");
        }

        builder.append("END:VCALENDAR\r\n");
        return builder.toString();
    }
}
