package com.opex.keycloak.onboarding.support;

import com.opex.keycloak.onboarding.constants.OnboardingAttributeNames;
import org.keycloak.authentication.RequiredActionContext;
import org.keycloak.authentication.authenticators.broker.AbstractIdpAuthenticator;
import org.keycloak.authentication.authenticators.broker.util.SerializedBrokeredIdentityContext;

public final class BrokeredIdentitySupport {

    static final String GOOGLE_PROVIDER_ID = "google";
    private static final String BROKER_PROVIDER_ID_NOTE = "OPEX_BROKER_PROVIDER_ID";

    private BrokeredIdentitySupport() {
    }

    public static boolean isCurrentBrokeredGoogleLogin(RequiredActionContext context) {
        return GOOGLE_PROVIDER_ID.equalsIgnoreCase(getBrokerProviderId(context))
            || GOOGLE_PROVIDER_ID.equalsIgnoreCase(context.getUser().getFirstAttribute(OnboardingAttributeNames.IDENTITY_PROVIDER));
    }

    public static void rememberCurrentBrokerProvider(RequiredActionContext context) {
        String providerId = getCurrentBrokerProviderId(context);

        if (providerId == null) {
            return;
        }

        context.getAuthenticationSession().setAuthNote(BROKER_PROVIDER_ID_NOTE, providerId);
        context.getUser().setSingleAttribute(OnboardingAttributeNames.IDENTITY_PROVIDER, providerId);
    }

    private static String getBrokerProviderId(RequiredActionContext context) {
        String currentProviderId = getCurrentBrokerProviderId(context);

        if (currentProviderId != null) {
            return currentProviderId;
        }

        String rememberedProviderId = context.getAuthenticationSession().getAuthNote(BROKER_PROVIDER_ID_NOTE);
        return rememberedProviderId == null || rememberedProviderId.isBlank() ? null : rememberedProviderId.trim();
    }

    private static String getCurrentBrokerProviderId(RequiredActionContext context) {
        SerializedBrokeredIdentityContext brokerContext = SerializedBrokeredIdentityContext.readFromAuthenticationSession(
            context.getAuthenticationSession(),
            AbstractIdpAuthenticator.BROKERED_CONTEXT_NOTE
        );

        if (brokerContext == null) {
            return null;
        }

        String providerId = brokerContext.getIdentityProviderId();
        return providerId == null || providerId.isBlank() ? null : providerId.trim();
    }
}
