package com.opex.backend.dto.legal;

public record LegalControllerContactResponse(
        String name,
        String address,
        String privacyEmail,
        String dpoEmail,
        String supportEmail,
        String supervisoryAuthority
) {
}
