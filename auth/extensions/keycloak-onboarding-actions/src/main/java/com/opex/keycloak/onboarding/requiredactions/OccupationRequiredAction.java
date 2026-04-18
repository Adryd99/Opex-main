package com.opex.keycloak.onboarding.requiredactions;

import com.opex.keycloak.onboarding.constants.OnboardingAttributeNames;
import com.opex.keycloak.onboarding.constants.OnboardingRequiredActionIds;
import com.opex.keycloak.onboarding.support.OnboardingStepNavigationSupport;
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

public final class OccupationRequiredAction implements RequiredActionProvider, RequiredActionFactory {

    private static final int MAX_OCCUPATION_LENGTH = 100;

    @Override
    public InitiatedActionSupport initiatedActionSupport() {
        return InitiatedActionSupport.SUPPORTED;
    }

    @Override
    public void evaluateTriggers(RequiredActionContext context) {
    }

    @Override
    public void requiredActionChallenge(RequiredActionContext context) {
        boolean forceDisplay = OnboardingStepNavigationSupport.shouldForceDisplay(context, getId());
        String currentOccupation = normalize(context.getUser().getFirstAttribute(OnboardingAttributeNames.OCCUPATION));

        if (!forceDisplay && currentOccupation != null) {
            OnboardingStepNavigationSupport.ensureRequiredAction(context, OnboardingRequiredActionIds.LEGAL_ACCEPTANCE);
            OnboardingStepNavigationSupport.restoreDeferredRequiredAction(context);
            context.success();
            return;
        }

        context.challenge(createResponse(context, null, null));
    }

    @Override
    public void processAction(RequiredActionContext context) {
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();

        if (OnboardingStepNavigationSupport.shouldGoBack(formData)) {
            OnboardingStepNavigationSupport.returnToPreviousStep(
                context,
                OnboardingRequiredActionIds.COUNTRY_SELECTION,
                OnboardingRequiredActionIds.OCCUPATION
            );
            return;
        }

        if (OnboardingStepNavigationSupport.shouldSkip(formData)) {
            OnboardingStepNavigationSupport.clearForcedDisplay(context, getId());
            OnboardingStepNavigationSupport.ensureRequiredAction(context, OnboardingRequiredActionIds.LEGAL_ACCEPTANCE);
            OnboardingStepNavigationSupport.restoreDeferredRequiredAction(context);
            context.success();
            return;
        }

        String occupation = normalize(formData.getFirst(OnboardingAttributeNames.OCCUPATION));

        if (occupation == null || occupation.isBlank()) {
            context.challenge(createResponse(context, formData, List.of(new FormMessage(OnboardingAttributeNames.OCCUPATION, "occupationRequiredError"))));
            return;
        }

        if (occupation.length() > MAX_OCCUPATION_LENGTH) {
            context.challenge(createResponse(context, formData, List.of(new FormMessage(OnboardingAttributeNames.OCCUPATION, "occupationTooLongError"))));
            return;
        }

        UserModel user = context.getUser();
        user.setSingleAttribute(OnboardingAttributeNames.OCCUPATION, occupation);
        OnboardingStepNavigationSupport.clearForcedDisplay(context, getId());
        OnboardingStepNavigationSupport.ensureRequiredAction(context, OnboardingRequiredActionIds.LEGAL_ACCEPTANCE);
        OnboardingStepNavigationSupport.restoreDeferredRequiredAction(context);
        context.success();
    }

    private jakarta.ws.rs.core.Response createResponse(
        RequiredActionContext context,
        MultivaluedMap<String, String> formData,
        List<FormMessage> errors
    ) {
        String currentOccupation = formData != null
            ? normalize(formData.getFirst(OnboardingAttributeNames.OCCUPATION))
            : normalize(context.getUser().getFirstAttribute(OnboardingAttributeNames.OCCUPATION));

        var form = context.form()
            .setUser(context.getUser())
            .setAttribute("currentOccupation", currentOccupation)
            .setAttribute("occupationMaxLength", MAX_OCCUPATION_LENGTH);

        if (formData != null) {
            form.setFormData(formData);
        }

        if (errors != null && !errors.isEmpty()) {
            form.setErrors(errors);
        }

        return form.createForm("occupation.ftl");
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }

        return value.trim();
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
        return "Occupation";
    }

    @Override
    public String getId() {
        return OnboardingRequiredActionIds.OCCUPATION;
    }

    @Override
    public void close() {
    }
}
