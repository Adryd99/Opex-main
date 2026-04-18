package com.opex.keycloak.onboarding.support;

import jakarta.ws.rs.core.MultivaluedMap;
import org.keycloak.authentication.RequiredActionContext;
import org.keycloak.models.UserModel;

public final class OnboardingStepNavigationSupport {

    public static final String NAVIGATE_BACK_FIELD = "navigateBack";
    public static final String SKIP_CURRENT_STEP_FIELD = "skipCurrentStep";

    private static final String RESUME_REQUIRED_ACTION_NOTE = "OPEX_RESUME_REQUIRED_ACTION";
    private static final String FORCE_REQUIRED_ACTION_NOTE = "OPEX_FORCE_REQUIRED_ACTION";
    private static final String FORCE_REQUIRED_ACTION_ATTRIBUTE = "opexForceRequiredAction";

    private OnboardingStepNavigationSupport() {
    }

    public static boolean shouldGoBack(MultivaluedMap<String, String> formData) {
        return hasBooleanFlag(formData, NAVIGATE_BACK_FIELD);
    }

    public static boolean shouldSkip(MultivaluedMap<String, String> formData) {
        return hasBooleanFlag(formData, SKIP_CURRENT_STEP_FIELD);
    }

    public static void returnToPreviousStep(RequiredActionContext context, String previousActionId, String currentActionId) {
        UserModel user = context.getUser();

        context.getAuthenticationSession().setAuthNote(RESUME_REQUIRED_ACTION_NOTE, currentActionId);
        context.getAuthenticationSession().setAuthNote(FORCE_REQUIRED_ACTION_NOTE, previousActionId);
        user.setSingleAttribute(FORCE_REQUIRED_ACTION_ATTRIBUTE, previousActionId);
        user.addRequiredAction(previousActionId);
        context.success();
    }

    public static boolean shouldForceDisplay(RequiredActionContext context, String requiredActionId) {
        String forcedRequiredAction = context.getAuthenticationSession().getAuthNote(FORCE_REQUIRED_ACTION_NOTE);
        if (forcedRequiredAction != null && forcedRequiredAction.equals(requiredActionId)) {
            return true;
        }

        String forcedRequiredActionAttribute = context.getUser().getFirstAttribute(FORCE_REQUIRED_ACTION_ATTRIBUTE);
        return forcedRequiredActionAttribute != null && forcedRequiredActionAttribute.equals(requiredActionId);
    }

    public static void clearForcedDisplay(RequiredActionContext context, String requiredActionId) {
        String forcedRequiredAction = context.getAuthenticationSession().getAuthNote(FORCE_REQUIRED_ACTION_NOTE);
        String forcedRequiredActionAttribute = context.getUser().getFirstAttribute(FORCE_REQUIRED_ACTION_ATTRIBUTE);

        if (forcedRequiredAction != null && forcedRequiredAction.equals(requiredActionId)) {
            context.getAuthenticationSession().removeAuthNote(FORCE_REQUIRED_ACTION_NOTE);
        }

        if (forcedRequiredActionAttribute != null && forcedRequiredActionAttribute.equals(requiredActionId)) {
            context.getUser().removeAttribute(FORCE_REQUIRED_ACTION_ATTRIBUTE);
        }
    }

    public static void restoreDeferredRequiredAction(RequiredActionContext context) {
        String deferredRequiredAction = context.getAuthenticationSession().getAuthNote(RESUME_REQUIRED_ACTION_NOTE);

        if (deferredRequiredAction == null || deferredRequiredAction.isBlank()) {
            return;
        }

        context.getUser().addRequiredAction(deferredRequiredAction);
        context.getAuthenticationSession().setAuthNote(FORCE_REQUIRED_ACTION_NOTE, deferredRequiredAction);
        context.getUser().setSingleAttribute(FORCE_REQUIRED_ACTION_ATTRIBUTE, deferredRequiredAction);
        context.getAuthenticationSession().removeAuthNote(RESUME_REQUIRED_ACTION_NOTE);
    }

    public static void ensureRequiredAction(RequiredActionContext context, String requiredActionId) {
        context.getUser().addRequiredAction(requiredActionId);
    }

    private static boolean hasBooleanFlag(MultivaluedMap<String, String> formData, String fieldName) {
        if (formData == null) {
            return false;
        }

        String value = formData.getFirst(fieldName);
        return value != null && Boolean.parseBoolean(value);
    }
}
