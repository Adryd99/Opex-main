package com.opex.keycloak.onboarding.requiredactions;

import com.opex.keycloak.onboarding.constants.OnboardingAttributeNames;
import com.opex.keycloak.onboarding.constants.OnboardingRequiredActionIds;
import com.opex.keycloak.onboarding.support.BrokeredIdentitySupport;
import com.opex.keycloak.onboarding.support.OnboardingStepNavigationSupport;
import com.opex.keycloak.onboarding.support.SecondFactorSupport;
import jakarta.ws.rs.core.MultivaluedMap;
import org.keycloak.Config;
import org.keycloak.authentication.InitiatedActionSupport;
import org.keycloak.authentication.RequiredActionContext;
import org.keycloak.authentication.RequiredActionFactory;
import org.keycloak.authentication.RequiredActionProvider;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.UserModel;
import org.keycloak.models.utils.FormMessage;

import java.util.List;
import java.util.Set;

public final class SecuritySetupChoiceRequiredAction implements RequiredActionProvider, RequiredActionFactory {

    private static final String SECURITY_CHOICE_FIELD = "securitySetupChoice";
    private static final String SECURITY_CHOICE_TOTP = "totp";
    private static final String SECURITY_CHOICE_WEBAUTHN = "webauthn";
    private static final String SECURITY_CHOICE_LATER = "later";
    private static final Set<String> ALLOWED_CHOICES = Set.of(
        SECURITY_CHOICE_TOTP,
        SECURITY_CHOICE_WEBAUTHN,
        SECURITY_CHOICE_LATER
    );

    @Override
    public InitiatedActionSupport initiatedActionSupport() {
        return InitiatedActionSupport.SUPPORTED;
    }

    @Override
    public void evaluateTriggers(RequiredActionContext context) {
    }

    @Override
    public void requiredActionChallenge(RequiredActionContext context) {
        if (BrokeredIdentitySupport.isCurrentBrokeredGoogleLogin(context)) {
            BrokeredIdentitySupport.rememberCurrentBrokerProvider(context);
            UserModel user = context.getUser();
            user.removeRequiredAction(OnboardingRequiredActionIds.OPTIONAL_CONFIGURE_TOTP);
            user.removeRequiredAction(OnboardingRequiredActionIds.OPTIONAL_WEBAUTHN_REGISTER);
            OnboardingStepNavigationSupport.ensureRequiredAction(context, OnboardingRequiredActionIds.PROFILE_BASICS);
            OnboardingStepNavigationSupport.restoreDeferredRequiredAction(context);
            context.success();
            return;
        }

        context.challenge(createResponse(context, null, null));
    }

    @Override
    public void processAction(RequiredActionContext context) {
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();
        String selectedChoice = normalize(formData.getFirst(SECURITY_CHOICE_FIELD));

        if (selectedChoice == null || !ALLOWED_CHOICES.contains(selectedChoice)) {
            context.challenge(
                createResponse(
                    context,
                    formData,
                    List.of(new FormMessage(SECURITY_CHOICE_FIELD, "securitySetupChoiceRequiredError"))
                )
            );
            return;
        }

        UserModel user = context.getUser();
        user.setSingleAttribute(OnboardingAttributeNames.PREFERRED_SECOND_FACTOR, selectedChoice);

        switch (selectedChoice) {
            case SECURITY_CHOICE_TOTP -> {
                user.setSingleAttribute(OnboardingAttributeNames.SECOND_FACTOR_ENROLLMENT_DEFERRED, Boolean.FALSE.toString());
                SecondFactorSupport.clearConfiguredState(user);
                user.addRequiredAction(OnboardingRequiredActionIds.OPTIONAL_CONFIGURE_TOTP);
                user.removeRequiredAction(OnboardingRequiredActionIds.OPTIONAL_WEBAUTHN_REGISTER);
            }
            case SECURITY_CHOICE_WEBAUTHN -> {
                user.setSingleAttribute(OnboardingAttributeNames.SECOND_FACTOR_ENROLLMENT_DEFERRED, Boolean.FALSE.toString());
                SecondFactorSupport.clearConfiguredState(user);
                user.addRequiredAction(OnboardingRequiredActionIds.OPTIONAL_WEBAUTHN_REGISTER);
                user.removeRequiredAction(OnboardingRequiredActionIds.OPTIONAL_CONFIGURE_TOTP);
            }
            default -> {
                user.setSingleAttribute(OnboardingAttributeNames.SECOND_FACTOR_ENROLLMENT_DEFERRED, Boolean.TRUE.toString());
                SecondFactorSupport.clearConfiguredState(user);
                user.removeRequiredAction(OnboardingRequiredActionIds.OPTIONAL_CONFIGURE_TOTP);
                user.removeRequiredAction(OnboardingRequiredActionIds.OPTIONAL_WEBAUTHN_REGISTER);
            }
        }

        OnboardingStepNavigationSupport.ensureRequiredAction(context, OnboardingRequiredActionIds.PROFILE_BASICS);
        OnboardingStepNavigationSupport.restoreDeferredRequiredAction(context);
        context.success();
    }

    private jakarta.ws.rs.core.Response createResponse(
        RequiredActionContext context,
        MultivaluedMap<String, String> formData,
        List<FormMessage> errors
    ) {
        String currentChoice = formData != null
            ? normalize(formData.getFirst(SECURITY_CHOICE_FIELD))
            : normalize(context.getUser().getFirstAttribute(OnboardingAttributeNames.PREFERRED_SECOND_FACTOR));

        var form = context.form()
            .setUser(context.getUser())
            .setAttribute("currentSecuritySetupChoice", currentChoice);

        if (formData != null) {
            form.setFormData(formData);
        }

        if (errors != null && !errors.isEmpty()) {
            form.setErrors(errors);
        }

        return form.createForm("security-setup-choice.ftl");
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim().toLowerCase();
        return normalized.isEmpty() ? null : normalized;
    }

    @Override
    public RequiredActionProvider create(KeycloakSession session) {
        return this;
    }

    @Override
    public void init(Config.Scope config) {
    }

    @Override
    public void postInit(KeycloakSessionFactory factory) {
    }

    @Override
    public String getDisplayText() {
        return "Security setup choice";
    }

    @Override
    public String getId() {
        return OnboardingRequiredActionIds.SECURITY_SETUP_CHOICE;
    }

    @Override
    public void close() {
    }
}
