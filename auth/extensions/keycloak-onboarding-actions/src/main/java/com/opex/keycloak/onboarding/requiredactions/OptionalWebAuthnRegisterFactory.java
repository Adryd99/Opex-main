package com.opex.keycloak.onboarding.requiredactions;

import com.webauthn4j.verifier.attestation.trustworthiness.certpath.CertPathTrustworthinessVerifier;
import com.opex.keycloak.onboarding.constants.OnboardingRequiredActionIds;
import org.keycloak.authentication.requiredactions.WebAuthnRegister;
import org.keycloak.authentication.requiredactions.WebAuthnRegisterFactory;
import org.keycloak.models.KeycloakSession;

public final class OptionalWebAuthnRegisterFactory extends WebAuthnRegisterFactory {

    @Override
    protected WebAuthnRegister createProvider(
        KeycloakSession session,
        CertPathTrustworthinessVerifier certPathTrustworthinessVerifier
    ) {
        return new OptionalWebAuthnRegister(session, certPathTrustworthinessVerifier);
    }

    @Override
    public String getId() {
        return OnboardingRequiredActionIds.OPTIONAL_WEBAUTHN_REGISTER;
    }

    @Override
    public String getDisplayText() {
        return "Optional WebAuthn Register";
    }
}
