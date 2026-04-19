package com.opex.backend.user.service;

import com.opex.backend.user.dto.UserUpdateRequest;
import com.opex.backend.user.model.User;
import com.opex.backend.user.service.support.UserValueSupport;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Set;
import java.util.Objects;

@Component
public class UserProfileValidator {

    private static final Set<String> SUPPORTED_LANGUAGES = Set.of("it", "en");

    public void validateAdultBirthDate(LocalDate birthDate) {
        if (birthDate == null) {
            return;
        }

        if (birthDate.isAfter(LocalDate.now().minusYears(18))) {
            throw new IllegalArgumentException("Birth date must belong to an adult user (18+).");
        }
    }

    public void validateGoogleLockedFields(User user, UserUpdateRequest request) {
        if (!"google".equalsIgnoreCase(UserValueSupport.firstNonBlank(user.getIdentityProvider()))) {
            return;
        }

        if (request.getEmail() != null
                && !Objects.equals(UserValueSupport.normalizeForComparison(user.getEmail()), UserValueSupport.normalizeForComparison(request.getEmail()))) {
            throw new IllegalArgumentException("Google-managed email cannot be changed here.");
        }

        if (request.getFirstName() != null
                && !Objects.equals(UserValueSupport.normalizeForComparison(user.getFirstName()), UserValueSupport.normalizeForComparison(request.getFirstName()))) {
            throw new IllegalArgumentException("Google-managed first name cannot be changed here.");
        }

        if (request.getLastName() != null
                && !Objects.equals(UserValueSupport.normalizeForComparison(user.getLastName()), UserValueSupport.normalizeForComparison(request.getLastName()))) {
            throw new IllegalArgumentException("Google-managed last name cannot be changed here.");
        }
    }

    public void validatePreferredLanguage(String preferredLanguage) {
        if (preferredLanguage == null) {
            return;
        }

        if (!SUPPORTED_LANGUAGES.contains(preferredLanguage)) {
            throw new IllegalArgumentException("Preferred language must be one of: it, en.");
        }
    }
}
