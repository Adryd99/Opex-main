package com.opex.keycloak.onboarding.support;

import com.opex.keycloak.onboarding.constants.OnboardingRequiredActionIds;
import jakarta.ws.rs.core.MultivaluedMap;
import org.keycloak.authentication.RequiredActionContext;
import org.keycloak.models.UserModel;

public final class SecuritySetupFlowSupport {

    public static final String BACK_TO_SECURITY_CHOICE_FIELD = "backToSecurityChoice";
    private static final String WEBAUTH_CHALLENGE_NOTE = "WEBAUTH_CHALLENGE";

    private SecuritySetupFlowSupport() {
    }

    public static boolean shouldGoBackToSecurityChoice(MultivaluedMap<String, String> formData) {
        if (formData == null) {
            return false;
        }

        String requestedValue = formData.getFirst(BACK_TO_SECURITY_CHOICE_FIELD);
        return requestedValue != null && Boolean.parseBoolean(requestedValue);
    }

    public static void returnToSecurityChoice(RequiredActionContext context, String currentActionId) {
        UserModel user = context.getUser();

        user.removeRequiredAction(currentActionId);
        user.removeRequiredAction(OnboardingRequiredActionIds.OPTIONAL_CONFIGURE_TOTP);
        user.removeRequiredAction(OnboardingRequiredActionIds.OPTIONAL_WEBAUTHN_REGISTER);
        user.addRequiredAction(OnboardingRequiredActionIds.SECURITY_SETUP_CHOICE);

        context.getAuthenticationSession().removeAuthNote(WEBAUTH_CHALLENGE_NOTE);
        context.success();
    }
}
