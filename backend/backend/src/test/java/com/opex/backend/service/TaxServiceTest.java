package com.opex.backend.service;

import com.opex.backend.dto.TaxBufferDashboardResponse;
import com.opex.backend.model.User;
import com.opex.backend.repository.BankAccountRepository;
import com.opex.backend.repository.BankConnectionRepository;
import com.opex.backend.repository.TaxRepository;
import com.opex.backend.repository.TransactionRepository;
import com.opex.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaxServiceTest {

    @Mock
    private TaxRepository taxRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private BankConnectionRepository bankConnectionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TaxService taxService;

    @Test
    void getTaxDeadlinesBuildsDutchQuarterlyScheduleFor2026() {
        User user = new User();
        user.setId("user-1");
        user.setResidence("Netherlands (NL)");
        user.setVatFrequency("Quarterly");

        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(taxRepository.findByUserIdOrderByDeadlineAsc("user-1")).thenReturn(List.of());

        List<TaxBufferDashboardResponse.TaxDeadlineItem> deadlines = taxService.getTaxDeadlines("user-1", 2026, 20);

        assertEquals(7, deadlines.size());
        assertEquals(LocalDate.of(2026, 1, 31), deadlines.get(0).getDueDate());
        assertEquals("Q4 2025", deadlines.get(0).getPeriodLabel());
        assertEquals(LocalDate.of(2026, 4, 30), deadlines.get(1).getDueDate());
        assertEquals("Q1 2026", deadlines.get(1).getPeriodLabel());
        assertTrue(deadlines.stream().anyMatch(item ->
                "Income tax return".equals(item.getTitle()) &&
                        LocalDate.of(2026, 5, 1).equals(item.getDueDate())
        ));
        assertTrue(deadlines.stream().anyMatch(item ->
                "Income tax postponement request".equals(item.getTitle()) &&
                        LocalDate.of(2026, 5, 1).equals(item.getDueDate())
        ));
        assertEquals(LocalDate.of(2027, 1, 31), deadlines.get(deadlines.size() - 1).getDueDate());
        assertEquals("Q4 2026", deadlines.get(deadlines.size() - 1).getPeriodLabel());
    }
}
