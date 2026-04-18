package com.opex.backend.legal.controller;

import com.opex.backend.common.security.AuthenticatedUser;
import com.opex.backend.legal.dto.LegalConsentRequest;
import com.opex.backend.legal.dto.LegalPublicInfoResponse;
import com.opex.backend.legal.service.LegalService;
import com.opex.backend.user.dto.UserResponse;
import com.opex.backend.user.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<UserResponse> acceptRequiredConsents(
            AuthenticatedUser authenticatedUser,
            @Valid @RequestBody LegalConsentRequest request
    ) {
        User updatedUser = legalService.acceptRequiredConsents(authenticatedUser.userId(), request);
        return ResponseEntity.ok(UserResponse.from(updatedUser));
    }

    @GetMapping(value = "/export", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<byte[]> exportUserData(AuthenticatedUser authenticatedUser) {
        byte[] payload = legalService.exportUserData(authenticatedUser.userId());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"opex-data-export-" + LocalDate.now() + ".json\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload);
    }
}
