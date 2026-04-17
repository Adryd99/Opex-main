package com.opex.backend.common.security;

import com.opex.backend.common.exception.UnauthorizedException;
import org.springframework.security.oauth2.jwt.Jwt;

public record AuthenticatedUser(
        String userId,
        String email,
        String firstName,
        String lastName
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
                jwt.getClaimAsString("family_name")
        );
    }
}
