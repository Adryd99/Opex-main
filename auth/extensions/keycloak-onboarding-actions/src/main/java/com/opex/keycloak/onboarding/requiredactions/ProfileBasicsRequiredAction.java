package com.opex.keycloak.onboarding.requiredactions;

import com.opex.keycloak.onboarding.constants.OnboardingAttributeNames;
import com.opex.keycloak.onboarding.constants.OnboardingRequiredActionIds;
import com.opex.keycloak.onboarding.support.BrokeredIdentitySupport;
import com.opex.keycloak.onboarding.support.OnboardingStepNavigationSupport;
import jakarta.ws.rs.core.MultivaluedHashMap;
import jakarta.ws.rs.core.MultivaluedMap;
import org.keycloak.authentication.RequiredActionContext;
import org.keycloak.authentication.requiredactions.UpdateProfile;
import org.keycloak.events.EventBuilder;
import org.keycloak.events.EventType;
import org.keycloak.models.UserModel;
import org.keycloak.models.utils.FormMessage;
import org.keycloak.services.validation.Validation;
import org.keycloak.userprofile.AttributeChangeListener;
import org.keycloak.userprofile.EventAuditingAttributeChangeListener;
import org.keycloak.userprofile.UserProfile;
import org.keycloak.userprofile.UserProfileContext;
import org.keycloak.userprofile.UserProfileProvider;
import org.keycloak.userprofile.ValidationException;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

public final class ProfileBasicsRequiredAction extends UpdateProfile {

    private static final int MINIMUM_AGE = 18;
    private static final int MAX_NAME_LENGTH = 100;

    @Override
    public String getDisplayText() {
        return "Profile basics";
    }

    @Override
    public String getId() {
        return OnboardingRequiredActionIds.PROFILE_BASICS;
    }

    @Override
    public void evaluateTriggers(RequiredActionContext context) {
        UserModel user = context.getUser();

        if (needsFirstName(user) || needsLastName(user) || needsBirthDate(user)) {
            user.addRequiredAction(getId());
        }
    }

    @Override
    public void requiredActionChallenge(RequiredActionContext context) {
        if (
            !OnboardingStepNavigationSupport.shouldForceDisplay(context, getId()) &&
            !needsFirstName(context.getUser()) &&
            !needsLastName(context.getUser()) &&
            !needsBirthDate(context.getUser())
        ) {
            OnboardingStepNavigationSupport.ensureRequiredAction(context, OnboardingRequiredActionIds.COUNTRY_SELECTION);
            OnboardingStepNavigationSupport.restoreDeferredRequiredAction(context);
            context.success();
            return;
        }

        context.challenge(createResponse(context, null, null));
    }

    @Override
    public void processAction(RequiredActionContext context) {
        EventBuilder event = context.getEvent();
        event.event(EventType.UPDATE_PROFILE).detail("context", OnboardingRequiredActionIds.PROFILE_BASICS);

        MultivaluedMap<String, String> formData = new MultivaluedHashMap<>(context.getHttpRequest().getDecodedFormParameters());
        UserModel user = context.getUser();
        boolean forceDisplay = OnboardingStepNavigationSupport.shouldForceDisplay(context, getId());
        boolean requiresFirstName = needsFirstName(user);
        boolean requiresLastName = needsLastName(user);
        boolean requiresBirthDate = needsBirthDate(user) || forceDisplay;

        if (OnboardingStepNavigationSupport.shouldGoBack(formData)) {
            OnboardingStepNavigationSupport.returnToPreviousStep(
                context,
                OnboardingRequiredActionIds.SECURITY_SETUP_CHOICE,
                OnboardingRequiredActionIds.PROFILE_BASICS
            );
            return;
        }

        normalizeField(formData, "firstName");
        normalizeField(formData, "lastName");
        normalizeField(formData, OnboardingAttributeNames.BIRTH_DATE);

        ensureCurrentUserDefaults(formData, user, requiresFirstName, requiresLastName, requiresBirthDate);

        List<FormMessage> manualErrors = validateProfileBasics(formData, requiresFirstName, requiresLastName, requiresBirthDate);
        if (!manualErrors.isEmpty()) {
            context.challenge(createResponse(context, formData, manualErrors));
            return;
        }

        UserProfileProvider userProfileProvider = context.getSession().getProvider(UserProfileProvider.class);
        UserProfile userProfile = userProfileProvider.create(UserProfileContext.UPDATE_PROFILE, formData, user);

        try {
            userProfile.update(
                false,
                new AttributeChangeListener[]{
                    new EventAuditingAttributeChangeListener(userProfile, event)
                }
            );
            OnboardingStepNavigationSupport.clearForcedDisplay(context, getId());
            OnboardingStepNavigationSupport.ensureRequiredAction(context, OnboardingRequiredActionIds.COUNTRY_SELECTION);
            OnboardingStepNavigationSupport.restoreDeferredRequiredAction(context);
            context.success();
        } catch (ValidationException validationException) {
            List<FormMessage> validationErrors = new ArrayList<>(Validation.getFormErrorsFromValidation(validationException.getErrors()));
            context.challenge(createResponse(context, formData, validationErrors));
        }
    }

    private static List<FormMessage> validateProfileBasics(
        MultivaluedMap<String, String> formData,
        boolean requiresFirstName,
        boolean requiresLastName,
        boolean requiresBirthDate
    ) {
        List<FormMessage> errors = new ArrayList<>();

        if (requiresFirstName) {
            validateNameField(errors, formData, "firstName", "First name is required.");
        }
        if (requiresLastName) {
            validateNameField(errors, formData, "lastName", "Last name is required.");
        }
        if (requiresBirthDate) {
            validateBirthDate(errors, formData.getFirst(OnboardingAttributeNames.BIRTH_DATE));
        }

        return errors;
    }

    @Override
    protected jakarta.ws.rs.core.Response createResponse(
        RequiredActionContext context,
        jakarta.ws.rs.core.MultivaluedMap<String, String> formData,
        List<FormMessage> errors
    ) {
        UserModel user = context.getUser();
        boolean forceDisplay = OnboardingStepNavigationSupport.shouldForceDisplay(context, getId());
        boolean brokeredGoogleLogin = BrokeredIdentitySupport.isCurrentBrokeredGoogleLogin(context);
        boolean showFirstNameField = needsFirstName(user);
        boolean showLastNameField = needsLastName(user);
        boolean showBirthDateField = needsBirthDate(user) || forceDisplay;

        var form = context.form()
            .setAttribute("profileBasicsShowFirstNameField", showFirstNameField)
            .setAttribute("profileBasicsShowLastNameField", showLastNameField)
            .setAttribute("profileBasicsShowBirthDateField", showBirthDateField)
            .setAttribute("profileBasicsBrokeredGoogleLogin", brokeredGoogleLogin)
            .setAttribute("profileBasicsCurrentFirstName", defaultString(user.getFirstName()))
            .setAttribute("profileBasicsCurrentLastName", defaultString(user.getLastName()))
            .setAttribute("profileBasicsCurrentBirthDate", defaultString(user.getFirstAttribute(OnboardingAttributeNames.BIRTH_DATE)));

        if (formData != null) {
            form.setFormData(formData);
        }

        if (errors != null && !errors.isEmpty()) {
            form.setErrors(errors);
        }

        return form.createForm("login-update-profile.ftl");
    }

    private static void validateNameField(
        List<FormMessage> errors,
        MultivaluedMap<String, String> formData,
        String fieldName,
        String requiredMessage
    ) {
        String value = formData.getFirst(fieldName);

        if (value == null || value.isBlank()) {
            errors.add(new FormMessage(fieldName, requiredMessage));
            return;
        }

        if (value.length() > MAX_NAME_LENGTH) {
            errors.add(new FormMessage(fieldName, "This field must not exceed 100 characters."));
        }
    }

    private static void validateBirthDate(List<FormMessage> errors, String birthDateRawValue) {
        if (birthDateRawValue == null || birthDateRawValue.isBlank()) {
            errors.add(new FormMessage(OnboardingAttributeNames.BIRTH_DATE, "Birth date is required."));
            return;
        }

        final LocalDate birthDate;

        try {
            birthDate = LocalDate.parse(birthDateRawValue);
        } catch (DateTimeParseException exception) {
            errors.add(new FormMessage(OnboardingAttributeNames.BIRTH_DATE, "Birth date must use ISO format YYYY-MM-DD."));
            return;
        }

        LocalDate latestAllowedBirthDate = LocalDate.now(ZoneOffset.UTC).minusYears(MINIMUM_AGE);

        if (birthDate.isAfter(latestAllowedBirthDate)) {
            errors.add(new FormMessage(OnboardingAttributeNames.BIRTH_DATE, "You must be at least 18 years old."));
        }
    }

    private static void normalizeField(MultivaluedMap<String, String> formData, String fieldName) {
        String value = formData.getFirst(fieldName);

        if (value == null) {
            return;
        }

        formData.putSingle(fieldName, value.trim());
    }

    private static void ensureCurrentUserDefaults(
        MultivaluedMap<String, String> formData,
        UserModel user,
        boolean requiresFirstName,
        boolean requiresLastName,
        boolean requiresBirthDate
    ) {
        if (!requiresFirstName) {
            formData.putSingle("firstName", user.getFirstName());
        }

        if (!requiresLastName) {
            formData.putSingle("lastName", user.getLastName());
        }

        if (!requiresBirthDate) {
            formData.putSingle(OnboardingAttributeNames.BIRTH_DATE, user.getFirstAttribute(OnboardingAttributeNames.BIRTH_DATE));
        }
    }

    private static boolean needsFirstName(UserModel user) {
        return isBlank(user.getFirstName());
    }

    private static boolean needsLastName(UserModel user) {
        return isBlank(user.getLastName());
    }

    private static boolean needsBirthDate(UserModel user) {
        return isBlank(user.getFirstAttribute(OnboardingAttributeNames.BIRTH_DATE));
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String defaultString(String value) {
        return value == null ? "" : value;
    }
}
