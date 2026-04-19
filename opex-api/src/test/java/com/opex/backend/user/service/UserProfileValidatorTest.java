package com.opex.backend.user.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class UserProfileValidatorTest {

    private final UserProfileValidator userProfileValidator = new UserProfileValidator();

    @Test
    void validatePreferredLanguageAcceptsSupportedValues() {
        assertDoesNotThrow(() -> userProfileValidator.validatePreferredLanguage("it"));
        assertDoesNotThrow(() -> userProfileValidator.validatePreferredLanguage("en"));
        assertDoesNotThrow(() -> userProfileValidator.validatePreferredLanguage(null));
    }

    @Test
    void validatePreferredLanguageRejectsUnsupportedValues() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> userProfileValidator.validatePreferredLanguage("fr")
        );

        assertEquals("Preferred language must be one of: it, en.", exception.getMessage());
    }
}
