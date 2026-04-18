package com.opex.backend.common.web;

public record ApiValidationError(
        String field,
        String message
) {
}
