package com.opex.backend.controller;

import com.opex.backend.dto.legal.LegalConsentRequest;
import com.opex.backend.dto.legal.LegalPublicInfoResponse;
import com.opex.backend.model.User;
import com.opex.backend.service.LegalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/legal")
@RequiredArgsConstructor
public class LegalController {

    private final LegalService legalService;

    @GetMapping("/public")
    public ResponseEntity<LegalPublicInfoResponse> getPublicInfo() {
        return ResponseEntity.ok(legalService.getPublicInfo());
    }

    @PutMapping("/consents")
    public ResponseEntity<?> acceptRequiredConsents(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody LegalConsentRequest request) {
        String userId = jwt.getClaimAsString("sub");
        try {
            return ResponseEntity.ok(legalService.acceptRequiredConsents(userId, request));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(exception.getMessage());
        }
    }

    @GetMapping(value = "/export", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<byte[]> exportUserData(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("sub");
        byte[] payload = legalService.exportUserData(userId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"opex-data-export-" + LocalDate.now() + ".json\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload);
    }
}
