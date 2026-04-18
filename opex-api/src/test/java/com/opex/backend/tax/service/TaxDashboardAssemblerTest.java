package com.opex.backend.tax.service;

import com.opex.backend.tax.dto.TaxBufferDashboardResponse;
import com.opex.backend.tax.service.support.TaxBufferComputation;
import com.opex.backend.user.model.User;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TaxDashboardAssemblerTest {

    private final TaxDashboardAssembler taxDashboardAssembler = new TaxDashboardAssembler();

    @Test
    void assembleUsesGrossIncomeForVatWarningAndHidesBlankConnectionId() {
        User user = new User();
        user.setResidence("Netherlands (NL)");
        user.setTaxRegime("KOR");
        TaxUserContext userContext = new TaxUserContext(user);

        TaxBufferComputation computation = new TaxBufferComputation(
                new BigDecimal("25000"),
                new BigDecimal("12000"),
                new BigDecimal("1000"),
                new BigDecimal("500"),
                new BigDecimal("1500"),
                new BigDecimal("2000"),
                new BigDecimal("3000"),
                new BigDecimal("100"),
                new BigDecimal("1900"),
                new BigDecimal("5"),
                new BigDecimal("100"),
                new BigDecimal("23000")
        );

        TaxBufferDashboardResponse response = taxDashboardAssembler.assemble(
                "",
                2026,
                "EUR",
                userContext,
                computation,
                List.of(),
                List.of(),
                List.of()
        );

        assertNull(response.getSelectedConnectionId());
        assertEquals("KOR", response.getVat().getRegime());
        assertTrue(response.getVat().getWarningMessage().contains("Dutch KOR threshold"));
        assertFalse(response.getSafeMode().getCompliant());
    }

    @Test
    void assembleMarksDashboardAsNonCompliantWhenThereAreOverdueDeadlines() {
        User user = new User();
        user.setResidence("Italy (IT)");
        TaxUserContext userContext = new TaxUserContext(user);

        TaxBufferComputation computation = new TaxBufferComputation(
                new BigDecimal("5000"),
                new BigDecimal("5000"),
                new BigDecimal("0"),
                new BigDecimal("0"),
                new BigDecimal("0"),
                new BigDecimal("0"),
                new BigDecimal("0"),
                new BigDecimal("0"),
                new BigDecimal("0"),
                new BigDecimal("100"),
                new BigDecimal("0"),
                new BigDecimal("5000")
        );

        TaxBufferDashboardResponse.TaxDeadlineItem overdue = new TaxBufferDashboardResponse.TaxDeadlineItem(
                "deadline-1",
                "VAT return",
                LocalDate.of(2026, 4, 30),
                "OVERDUE",
                BigDecimal.TEN,
                "EUR",
                "VAT",
                "Q1 2026",
                null,
                true
        );

        TaxBufferDashboardResponse response = taxDashboardAssembler.assemble(
                "conn-1",
                2026,
                "EUR",
                userContext,
                computation,
                List.of(overdue),
                List.of(),
                List.of()
        );

        assertEquals("conn-1", response.getSelectedConnectionId());
        assertFalse(response.getSafeMode().getCompliant());
        assertEquals("You have overdue tax deadlines.", response.getSafeMode().getMessage());
    }
}
