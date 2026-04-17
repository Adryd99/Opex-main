package com.opex.backend.legal.dto;

public record LegalControllerContactResponse(
        String name,
        String address,
        String privacyEmail,
        String dpoEmail,
        String supportEmail,
        String supervisoryAuthority
) {
}
