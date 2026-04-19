package com.opex.backend.user.dto;

import jakarta.validation.constraints.NotBlank;

public record UserPrimarySecondFactorRequest(
        @NotBlank(message = "Primary second-factor method is required.")
        String method
) {
}
