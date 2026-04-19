package com.opex.keycloak.onboarding.requiredactions;

import com.webauthn4j.verifier.attestation.trustworthiness.certpath.CertPathTrustworthinessVerifier;
import com.opex.keycloak.onboarding.constants.OnboardingRequiredActionIds;
import com.opex.keycloak.onboarding.support.SecondFactorSupport;
import com.opex.keycloak.onboarding.support.SecuritySetupFlowSupport;
import jakarta.ws.rs.core.MultivaluedMap;
import org.keycloak.authentication.RequiredActionContext;
import org.keycloak.authentication.requiredactions.WebAuthnRegister;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.credential.WebAuthnCredentialModel;

public final class OptionalWebAuthnRegister extends WebAuthnRegister {

    public OptionalWebAuthnRegister(
        KeycloakSession session,
        CertPathTrustworthinessVerifier certPathTrustworthinessVerifier
    ) {
        super(session, certPathTrustworthinessVerifier);
    }

    @Override
    public void processAction(RequiredActionContext context) {
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();

        if (SecuritySetupFlowSupport.shouldGoBackToSecurityChoice(formData)) {
            SecuritySetupFlowSupport.returnToSecurityChoice(context, OnboardingRequiredActionIds.OPTIONAL_WEBAUTHN_REGISTER);
            return;
        }

        super.processAction(context);

        if (context.getUser().credentialManager().isConfiguredFor(WebAuthnCredentialModel.TYPE_TWOFACTOR)) {
            SecondFactorSupport.markConfigured(context, "webauthn");
            SecondFactorSupport.ensureRecoveryCodesRequiredAction(context);
        }
    }
}
