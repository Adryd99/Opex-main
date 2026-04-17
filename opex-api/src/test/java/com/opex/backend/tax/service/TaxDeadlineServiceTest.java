package com.opex.backend.tax.service;

import com.opex.backend.tax.dto.TaxBufferDashboardResponse;
import com.opex.backend.user.model.User;
import com.opex.backend.tax.repository.TaxRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaxDeadlineServiceTest {

    @Mock
    private TaxRepository taxRepository;

    @InjectMocks
    private TaxDeadlineService taxDeadlineService;

    @Test
    void getTaxDeadlinesBuildsDutchQuarterlyScheduleFor2026() {
        User user = new User();
        user.setId("user-1");
        user.setResidence("Netherlands (NL)");
        user.setVatFrequency("Quarterly");

        when(taxRepository.findByUserIdOrderByDeadlineAsc("user-1")).thenReturn(List.of());

        List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines =
                taxDeadlineService.getTaxDeadlines("user-1", user, 2026, 20);

        assertEquals(7, deadlines.size());
        assertEquals(LocalDate.of(2026, 1, 31), deadlines.get(0).getDueDate());
        assertEquals("Q4 2025", deadlines.get(0).getPeriodLabel());
        assertEquals(LocalDate.of(2026, 4, 30), deadlines.get(1).getDueDate());
        assertEquals("Q1 2026", deadlines.get(1).getPeriodLabel());
        assertTrue(deadlines.stream().anyMatch(item ->
                "Income tax return".equals(item.getTitle())
                        && LocalDate.of(2026, 5, 1).equals(item.getDueDate())
        ));
        assertTrue(deadlines.stream().anyMatch(item ->
                "Income tax postponement request".equals(item.getTitle())
                        && LocalDate.of(2026, 5, 1).equals(item.getDueDate())
        ));
        assertEquals(LocalDate.of(2027, 1, 31), deadlines.get(deadlines.size() - 1).getDueDate());
        assertEquals("Q4 2026", deadlines.get(deadlines.size() - 1).getPeriodLabel());
    }
}
