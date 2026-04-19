package com.opex.keycloak.onboarding.requiredactions;

import com.opex.keycloak.onboarding.constants.OnboardingRequiredActionIds;
import com.opex.keycloak.onboarding.support.SecondFactorSupport;
import com.opex.keycloak.onboarding.support.SecuritySetupFlowSupport;
import jakarta.ws.rs.core.MultivaluedMap;
import org.keycloak.authentication.RequiredActionContext;
import org.keycloak.authentication.requiredactions.UpdateTotp;
import org.keycloak.models.credential.OTPCredentialModel;

public final class OptionalConfigureTotpRequiredAction extends UpdateTotp {

    @Override
    public void processAction(RequiredActionContext context) {
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();

        if (SecuritySetupFlowSupport.shouldGoBackToSecurityChoice(formData)) {
            SecuritySetupFlowSupport.returnToSecurityChoice(context, getId());
            return;
        }

        super.processAction(context);

        if (context.getUser().credentialManager().isConfiguredFor(OTPCredentialModel.TYPE)) {
            SecondFactorSupport.markConfigured(context, "totp");
            SecondFactorSupport.ensureRecoveryCodesRequiredAction(context);
        }
    }

    @Override
    public String getDisplayText() {
        return "Optional configure OTP";
    }

    @Override
    public String getId() {
        return OnboardingRequiredActionIds.OPTIONAL_CONFIGURE_TOTP;
    }
}
