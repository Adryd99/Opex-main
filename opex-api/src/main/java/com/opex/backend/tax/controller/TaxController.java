package com.opex.backend.tax.controller;

import com.opex.backend.tax.dto.TaxBufferDashboardResponse;
import com.opex.backend.tax.dto.TaxRequest;
import com.opex.backend.tax.dto.TaxResponse;
import com.opex.backend.tax.model.Tax;
import com.opex.backend.common.security.AuthenticatedUser;
import com.opex.backend.tax.service.TaxService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/taxes")
@RequiredArgsConstructor
public class TaxController {

    private final TaxService taxService;

    @GetMapping("/my-taxes")
    public ResponseEntity<Page<TaxResponse>> getMyTaxes(
            AuthenticatedUser authenticatedUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<Tax> taxes = taxService.getUserTaxes(authenticatedUser.userId(), page, size);
        return ResponseEntity.ok(taxes.map(TaxResponse::from));
    }

    @GetMapping("/buffer/dashboard")
    public ResponseEntity<TaxBufferDashboardResponse> getTaxBufferDashboard(
            AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String connectionId,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "4") int deadlinesLimit,
            @RequestParam(defaultValue = "5") int activityLimit
    ) {
        return ResponseEntity.ok(
                taxService.getTaxBufferDashboard(authenticatedUser.userId(), connectionId, year, deadlinesLimit, activityLimit)
        );
    }

    @GetMapping("/buffer/providers")
    public ResponseEntity<List<TaxBufferDashboardResponse.ProviderItem>> getTaxBufferProviders(
            AuthenticatedUser authenticatedUser
    ) {
        return ResponseEntity.ok(taxService.getAvailableProviders(authenticatedUser.userId()));
    }

    @GetMapping("/buffer/deadlines")
    public ResponseEntity<List<TaxBufferDashboardResponse.TaxDeadlineItem>> getTaxBufferDeadlines(
            AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(taxService.getTaxDeadlines(authenticatedUser.userId(), year, limit));
    }

    @GetMapping("/buffer/activity")
    public ResponseEntity<List<TaxBufferDashboardResponse.BufferActivityItem>> getTaxBufferActivity(
            AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String connectionId,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return ResponseEntity.ok(taxService.getBufferActivity(authenticatedUser.userId(), connectionId, year, limit));
    }

    @GetMapping(value = "/buffer/calendar", produces = "text/calendar")
    public ResponseEntity<String> exportTaxCalendar(
            AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) Integer year
    ) {
        String calendar = taxService.exportCalendar(authenticatedUser.userId(), year);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"tax-deadlines.ics\"")
                .contentType(MediaType.parseMediaType("text/calendar"))
                .body(calendar);
    }

    @PostMapping("/local")
    public ResponseEntity<TaxResponse> createLocalTax(
            AuthenticatedUser authenticatedUser,
            @Valid @RequestBody TaxRequest request
    ) {
        return ResponseEntity.ok(TaxResponse.from(taxService.createLocalTax(authenticatedUser.userId(), request)));
    }

    @PatchMapping("/local/{taxId}")
    public ResponseEntity<TaxResponse> updateLocalTax(
            AuthenticatedUser authenticatedUser,
            @PathVariable String taxId,
            @Valid @RequestBody TaxRequest request
    ) {
        return ResponseEntity.ok(TaxResponse.from(taxService.updateLocalTax(authenticatedUser.userId(), taxId, request)));
    }

    @DeleteMapping("/local/{taxId}")
    public ResponseEntity<Void> deleteLocalTax(
            AuthenticatedUser authenticatedUser,
            @PathVariable String taxId
    ) {
        taxService.deleteLocalTax(authenticatedUser.userId(), taxId);
        return ResponseEntity.noContent().build();
    }
}
