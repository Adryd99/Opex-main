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
import java.util.Set;

public final class CountrySelectionRequiredAction implements RequiredActionProvider, RequiredActionFactory {

    private static final List<String> ALLOWED_COUNTRIES = List.of("IT", "NL", "BE", "DE");

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
        String currentCountry = normalize(context.getUser().getFirstAttribute(OnboardingAttributeNames.COUNTRY));

        if (!forceDisplay && currentCountry != null) {
            OnboardingStepNavigationSupport.ensureRequiredAction(context, OnboardingRequiredActionIds.OCCUPATION);
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
                OnboardingRequiredActionIds.PROFILE_BASICS,
                OnboardingRequiredActionIds.COUNTRY_SELECTION
            );
            return;
        }

        if (OnboardingStepNavigationSupport.shouldSkip(formData)) {
            OnboardingStepNavigationSupport.clearForcedDisplay(context, getId());
            OnboardingStepNavigationSupport.ensureRequiredAction(context, OnboardingRequiredActionIds.OCCUPATION);
            OnboardingStepNavigationSupport.restoreDeferredRequiredAction(context);
            context.success();
            return;
        }

        String countryCode = normalize(formData.getFirst(OnboardingAttributeNames.COUNTRY));

        if (countryCode == null || countryCode.isBlank()) {
            context.challenge(createResponse(context, formData, List.of(new FormMessage(OnboardingAttributeNames.COUNTRY, "countrySelectionRequiredError"))));
            return;
        }

        if (!Set.copyOf(ALLOWED_COUNTRIES).contains(countryCode)) {
            context.challenge(createResponse(context, formData, List.of(new FormMessage(OnboardingAttributeNames.COUNTRY, "countrySelectionInvalidError"))));
            return;
        }

        UserModel user = context.getUser();
        user.setSingleAttribute(OnboardingAttributeNames.COUNTRY, countryCode);
        OnboardingStepNavigationSupport.clearForcedDisplay(context, getId());
        OnboardingStepNavigationSupport.ensureRequiredAction(context, OnboardingRequiredActionIds.OCCUPATION);
        OnboardingStepNavigationSupport.restoreDeferredRequiredAction(context);
        context.success();
    }

    private jakarta.ws.rs.core.Response createResponse(
        RequiredActionContext context,
        MultivaluedMap<String, String> formData,
        List<FormMessage> errors
    ) {
        String currentCountry = formData != null
            ? normalize(formData.getFirst(OnboardingAttributeNames.COUNTRY))
            : normalize(context.getUser().getFirstAttribute(OnboardingAttributeNames.COUNTRY));

        var form = context.form()
            .setUser(context.getUser())
            .setAttribute("currentCountry", currentCountry)
            .setAttribute("allowedCountries", ALLOWED_COUNTRIES);

        if (formData != null) {
            form.setFormData(formData);
        }

        if (errors != null && !errors.isEmpty()) {
            form.setErrors(errors);
        }

        return form.createForm("country-selection.ftl");
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }

        return value.trim().toUpperCase();
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
        return "Country selection";
    }

    @Override
    public String getId() {
        return OnboardingRequiredActionIds.COUNTRY_SELECTION;
    }

    @Override
    public void close() {
    }
}
