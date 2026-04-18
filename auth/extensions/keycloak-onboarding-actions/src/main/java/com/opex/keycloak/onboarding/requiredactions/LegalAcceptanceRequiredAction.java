package com.opex.keycloak.onboarding.requiredactions;

import com.opex.keycloak.onboarding.constants.OnboardingAttributeNames;
import com.opex.keycloak.onboarding.constants.OnboardingRequiredActionIds;
import com.opex.keycloak.onboarding.support.LegalUrlSupport;
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

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

public final class LegalAcceptanceRequiredAction implements RequiredActionProvider, RequiredActionFactory {

    private static final String COOKIE_CHOICE_FIELD = "cookieChoice";
    private static final String COOKIE_CHOICE_ACCEPT = "accept";
    private static final String COOKIE_CHOICE_REJECT = "reject";
    private static final String ACCEPT_PRIVACY_FIELD = "acceptPrivacyPolicy";
    private static final String ACCEPT_TERMS_FIELD = "acceptTermsOfService";
    private static final String STRICTLY_NECESSARY_FIELD = "acceptStrictlyNecessaryCookies";

    @Override
    public InitiatedActionSupport initiatedActionSupport() {
        return InitiatedActionSupport.SUPPORTED;
    }

    @Override
    public void evaluateTriggers(RequiredActionContext context) {
        if (!isLegalAcceptanceComplete(context.getUser())) {
            context.getUser().addRequiredAction(getId());
        }
    }

    @Override
    public void requiredActionChallenge(RequiredActionContext context) {
        context.challenge(createResponse(context, null, null));
    }

    @Override
    public void processAction(RequiredActionContext context) {
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();

        if (OnboardingStepNavigationSupport.shouldGoBack(formData)) {
            OnboardingStepNavigationSupport.returnToPreviousStep(
                context,
                OnboardingRequiredActionIds.OCCUPATION,
                OnboardingRequiredActionIds.LEGAL_ACCEPTANCE
            );
            return;
        }

        List<FormMessage> errors = validate(formData);

        if (!errors.isEmpty()) {
            context.challenge(createResponse(context, formData, errors));
            return;
        }

        String privacyVersion = normalize(formData.getFirst(OnboardingAttributeNames.PRIVACY_POLICY_VERSION));
        String termsVersion = normalize(formData.getFirst(OnboardingAttributeNames.TERMS_OF_SERVICE_VERSION));
        String cookieVersion = normalize(formData.getFirst(OnboardingAttributeNames.COOKIE_POLICY_VERSION));
        String cookieChoice = normalize(formData.getFirst(COOKIE_CHOICE_FIELD));
        boolean acceptCookies = COOKIE_CHOICE_ACCEPT.equals(cookieChoice);

        OffsetDateTime acceptedAt = OffsetDateTime.now(ZoneOffset.UTC);
        UserModel user = context.getUser();

        user.setSingleAttribute(OnboardingAttributeNames.LEGAL_ACCEPTED, Boolean.TRUE.toString());
        user.setSingleAttribute(OnboardingAttributeNames.LEGAL_ACCEPTED_AT, acceptedAt.toString());
        user.setSingleAttribute(OnboardingAttributeNames.PRIVACY_ACCEPTED, Boolean.TRUE.toString());
        user.setSingleAttribute(OnboardingAttributeNames.TERMS_ACCEPTED, Boolean.TRUE.toString());
        user.setSingleAttribute(OnboardingAttributeNames.PRIVACY_ACCEPTED_AT, acceptedAt.toString());
        user.setSingleAttribute(OnboardingAttributeNames.TERMS_ACCEPTED_AT, acceptedAt.toString());
        user.setSingleAttribute(OnboardingAttributeNames.PRIVACY_POLICY_VERSION, privacyVersion);
        user.setSingleAttribute(OnboardingAttributeNames.TERMS_OF_SERVICE_VERSION, termsVersion);
        user.setSingleAttribute(OnboardingAttributeNames.LEGAL_VERSION, privacyVersion + "|" + termsVersion + "|" + cookieVersion);

        if (acceptCookies) {
            user.setSingleAttribute(OnboardingAttributeNames.COOKIE_POLICY_ACKNOWLEDGED, Boolean.TRUE.toString());
            user.setSingleAttribute(OnboardingAttributeNames.COOKIE_POLICY_ACKNOWLEDGED_AT, acceptedAt.toString());
            user.setSingleAttribute(OnboardingAttributeNames.COOKIE_POLICY_VERSION, cookieVersion);
            user.removeAttribute(OnboardingAttributeNames.STRICTLY_NECESSARY_COOKIES_ACKNOWLEDGED);
        } else {
            user.setSingleAttribute(OnboardingAttributeNames.COOKIE_POLICY_ACKNOWLEDGED, Boolean.FALSE.toString());
            user.removeAttribute(OnboardingAttributeNames.COOKIE_POLICY_ACKNOWLEDGED_AT);
            user.removeAttribute(OnboardingAttributeNames.COOKIE_POLICY_VERSION);
            user.setSingleAttribute(OnboardingAttributeNames.STRICTLY_NECESSARY_COOKIES_ACKNOWLEDGED, Boolean.TRUE.toString());
        }

        OnboardingStepNavigationSupport.clearForcedDisplay(context, getId());
        OnboardingStepNavigationSupport.restoreDeferredRequiredAction(context);
        context.success();
    }

    private List<FormMessage> validate(MultivaluedMap<String, String> formData) {
        List<FormMessage> errors = new ArrayList<>();

        if (!isChecked(formData.getFirst(ACCEPT_PRIVACY_FIELD))) {
            errors.add(new FormMessage(ACCEPT_PRIVACY_FIELD, "legalAcceptancePrivacyRequiredError"));
        }

        if (!isChecked(formData.getFirst(ACCEPT_TERMS_FIELD))) {
            errors.add(new FormMessage(ACCEPT_TERMS_FIELD, "legalAcceptanceTermsRequiredError"));
        }

        String cookieChoice = normalize(formData.getFirst(COOKIE_CHOICE_FIELD));
        if (!COOKIE_CHOICE_ACCEPT.equals(cookieChoice) && !COOKIE_CHOICE_REJECT.equals(cookieChoice)) {
            errors.add(new FormMessage(COOKIE_CHOICE_FIELD, "legalAcceptanceCookieChoiceRequiredError"));
        }

        if (COOKIE_CHOICE_REJECT.equals(cookieChoice) && !isChecked(formData.getFirst(STRICTLY_NECESSARY_FIELD))) {
            errors.add(new FormMessage(STRICTLY_NECESSARY_FIELD, "legalAcceptanceStrictlyNecessaryRequiredError"));
        }

        validateVersion(errors, formData, OnboardingAttributeNames.PRIVACY_POLICY_VERSION, "legalAcceptanceVersionsUnavailableError");
        validateVersion(errors, formData, OnboardingAttributeNames.TERMS_OF_SERVICE_VERSION, "legalAcceptanceVersionsUnavailableError");
        validateVersion(errors, formData, OnboardingAttributeNames.COOKIE_POLICY_VERSION, "legalAcceptanceVersionsUnavailableError");

        return errors;
    }

    private void validateVersion(
        List<FormMessage> errors,
        MultivaluedMap<String, String> formData,
        String fieldName,
        String messageKey
    ) {
        if (normalize(formData.getFirst(fieldName)) == null) {
            errors.add(new FormMessage(fieldName, messageKey));
        }
    }

    private jakarta.ws.rs.core.Response createResponse(
        RequiredActionContext context,
        MultivaluedMap<String, String> formData,
        List<FormMessage> errors
    ) {
        String currentCookieChoice = formData != null
            ? normalize(formData.getFirst(COOKIE_CHOICE_FIELD))
            : COOKIE_CHOICE_ACCEPT;

        var form = context.form()
            .setUser(context.getUser())
            .setAttribute("privacyUrl", LegalUrlSupport.resolveDocumentUrl("privacy"))
            .setAttribute("termsUrl", LegalUrlSupport.resolveDocumentUrl("terms"))
            .setAttribute("cookiesUrl", LegalUrlSupport.resolveDocumentUrl("cookies"))
            .setAttribute("legalApiUrl", LegalUrlSupport.resolveApiPublicUrl())
            .setAttribute("currentCookieChoice", currentCookieChoice)
            .setAttribute("strictlyNecessaryChecked", isChecked(formData != null ? formData.getFirst(STRICTLY_NECESSARY_FIELD) : null));

        if (formData != null) {
            form.setFormData(formData);
        }

        if (errors != null && !errors.isEmpty()) {
            form.setErrors(errors);
        }

        return form.createForm("legal-acceptance.ftl");
    }

    private static boolean isChecked(String value) {
        if (value == null) {
            return false;
        }

        String normalized = value.trim();
        return "on".equalsIgnoreCase(normalized) || "true".equalsIgnoreCase(normalized);
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private static boolean isLegalAcceptanceComplete(UserModel user) {
        boolean legalAccepted = Boolean.parseBoolean(user.getFirstAttribute(OnboardingAttributeNames.LEGAL_ACCEPTED));
        boolean privacyAccepted = Boolean.parseBoolean(user.getFirstAttribute(OnboardingAttributeNames.PRIVACY_ACCEPTED));
        boolean termsAccepted = Boolean.parseBoolean(user.getFirstAttribute(OnboardingAttributeNames.TERMS_ACCEPTED));
        boolean cookieAccepted = user.getFirstAttribute(OnboardingAttributeNames.COOKIE_POLICY_ACKNOWLEDGED) != null;
        boolean strictlyNecessaryAcknowledged = Boolean.parseBoolean(
            user.getFirstAttribute(OnboardingAttributeNames.STRICTLY_NECESSARY_COOKIES_ACKNOWLEDGED)
        );
        boolean hasLegalVersion = normalize(user.getFirstAttribute(OnboardingAttributeNames.LEGAL_VERSION)) != null;
        boolean hasPrivacyVersion = normalize(user.getFirstAttribute(OnboardingAttributeNames.PRIVACY_POLICY_VERSION)) != null;
        boolean hasTermsVersion = normalize(user.getFirstAttribute(OnboardingAttributeNames.TERMS_OF_SERVICE_VERSION)) != null;

        return legalAccepted
            && privacyAccepted
            && termsAccepted
            && hasLegalVersion
            && hasPrivacyVersion
            && hasTermsVersion
            && (cookieAccepted || strictlyNecessaryAcknowledged);
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
        return "Legal acceptance";
    }

    @Override
    public String getId() {
        return OnboardingRequiredActionIds.LEGAL_ACCEPTANCE;
    }

    @Override
    public void close() {
    }
}
