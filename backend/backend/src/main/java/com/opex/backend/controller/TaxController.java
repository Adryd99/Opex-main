package com.opex.backend.controller;

import com.opex.backend.dto.TaxBufferDashboardResponse;
import com.opex.backend.dto.TaxRequest;
import com.opex.backend.model.Tax;
import com.opex.backend.service.TaxService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/taxes")
@RequiredArgsConstructor
public class TaxController {

    private final TaxService taxService;

    // 1. Ritorna la lista paginata di TUTTE le tasse (Esterne + Locali)
    @GetMapping("/my-taxes")
    public ResponseEntity<Page<Tax>> getMyTaxes(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String userId = jwt.getClaimAsString("sub");
        Page<Tax> taxes = taxService.getUserTaxes(userId, page, size);
        return ResponseEntity.ok(taxes);
    }

    // 2. Dashboard Tax Buffer completa (summary + breakdown + split + deadlines + activity)
    @GetMapping("/buffer/dashboard")
    public ResponseEntity<TaxBufferDashboardResponse> getTaxBufferDashboard(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String connectionId,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "4") int deadlinesLimit,
            @RequestParam(defaultValue = "5") int activityLimit) {
        String userId = jwt.getClaimAsString("sub");
        return ResponseEntity.ok(taxService.getTaxBufferDashboard(userId, connectionId, year, deadlinesLimit, activityLimit));
    }

    // 3. Lista provider disponibile per il filtro "All Providers"
    @GetMapping("/buffer/providers")
    public ResponseEntity<List<TaxBufferDashboardResponse.ProviderItem>> getTaxBufferProviders(
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("sub");
        return ResponseEntity.ok(taxService.getAvailableProviders(userId));
    }

    // 4. Lista deadline fiscali (utile anche per schermata estesa)
    @GetMapping("/buffer/deadlines")
    public ResponseEntity<List<TaxBufferDashboardResponse.TaxDeadlineItem>> getTaxBufferDeadlines(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "20") int limit) {
        String userId = jwt.getClaimAsString("sub");
        return ResponseEntity.ok(taxService.getTaxDeadlines(userId, year, limit));
    }

    // 5. Storico activity Tax Buffer (View Full History)
    @GetMapping("/buffer/activity")
    public ResponseEntity<List<TaxBufferDashboardResponse.BufferActivityItem>> getTaxBufferActivity(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String connectionId,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "50") int limit) {
        String userId = jwt.getClaimAsString("sub");
        return ResponseEntity.ok(taxService.getBufferActivity(userId, connectionId, year, limit));
    }

    // 6. Export calendario (.ics) delle scadenze fiscali
    @GetMapping(value = "/buffer/calendar", produces = "text/calendar")
    public ResponseEntity<String> exportTaxCalendar(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Integer year) {
        String userId = jwt.getClaimAsString("sub");
        String calendar = taxService.exportCalendar(userId, year);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"tax-deadlines.ics\"")
                .contentType(MediaType.parseMediaType("text/calendar"))
                .body(calendar);
    }

    // 7. Crea una tassa manuale
    @PostMapping("/local")
    public ResponseEntity<Tax> createLocalTax(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody TaxRequest request) {
        String userId = jwt.getClaimAsString("sub");
        return ResponseEntity.ok(taxService.createLocalTax(userId, request));
    }

    // 8. Modifica una tassa manuale
    @PatchMapping("/local/{taxId}")
    public ResponseEntity<Tax> updateLocalTax(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String taxId,
            @RequestBody TaxRequest request) {
        String userId = jwt.getClaimAsString("sub");
        return ResponseEntity.ok(taxService.updateLocalTax(userId, taxId, request));
    }

    // 9. Elimina una tassa manuale
    @DeleteMapping("/local/{taxId}")
    public ResponseEntity<Void> deleteLocalTax(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String taxId) {
        String userId = jwt.getClaimAsString("sub");
        taxService.deleteLocalTax(userId, taxId);
        // Ritorniamo 204 No Content, che è lo standard REST quando si elimina qualcosa con successo
        return ResponseEntity.noContent().build();
    }
}
