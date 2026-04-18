package com.opex.backend.common.security;

import com.opex.backend.common.exception.UnauthorizedException;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

public record AuthenticatedUser(
        String userId,
        String email,
        String firstName,
        String lastName,
        LocalDate birthDate,
        String country,
        String occupation,
        Boolean legalAccepted,
        String profilePicture,
        String identityProvider
) {

    public static AuthenticatedUser fromJwt(Jwt jwt) {
        String userId = jwt.getClaimAsString("sub");
        if (userId == null || userId.isBlank()) {
            throw new UnauthorizedException("Authenticated user id is missing from the access token.");
        }

        return new AuthenticatedUser(
                userId,
                jwt.getClaimAsString("email"),
                jwt.getClaimAsString("given_name"),
                jwt.getClaimAsString("family_name"),
                parseLocalDate(jwt.getClaimAsString("birthDate")),
                jwt.getClaimAsString("country"),
                jwt.getClaimAsString("occupation"),
                parseBoolean(jwt.getClaim("legalAccepted")),
                jwt.getClaimAsString("profilePicture"),
                jwt.getClaimAsString("identityProvider")
        );
    }

    private static LocalDate parseLocalDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }

    private static Boolean parseBoolean(Object value) {
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }
        if (value instanceof String stringValue && !stringValue.isBlank()) {
            return Boolean.parseBoolean(stringValue);
        }
        return null;
    }
}
