package com.opex.keycloak.onboarding.support;

import com.opex.keycloak.onboarding.constants.OnboardingAttributeNames;
import org.keycloak.authentication.RequiredActionContext;
import org.keycloak.models.UserModel;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

public final class SecondFactorSupport {

    private SecondFactorSupport() {
    }

    public static void clearConfiguredState(UserModel user) {
        user.removeAttribute(OnboardingAttributeNames.SECOND_FACTOR_METHOD);
        user.removeAttribute(OnboardingAttributeNames.SECOND_FACTOR_CONFIGURED_AT);
    }

    public static void markConfigured(RequiredActionContext context, String method) {
        if (context.getStatus() != RequiredActionContext.Status.SUCCESS) {
            return;
        }

        UserModel user = context.getUser();
        user.setSingleAttribute(OnboardingAttributeNames.SECOND_FACTOR_METHOD, method);
        user.setSingleAttribute(OnboardingAttributeNames.SECOND_FACTOR_CONFIGURED_AT, OffsetDateTime.now(ZoneOffset.UTC).toString());
        user.setSingleAttribute(OnboardingAttributeNames.SECOND_FACTOR_ENROLLMENT_DEFERRED, Boolean.FALSE.toString());
    }
}
