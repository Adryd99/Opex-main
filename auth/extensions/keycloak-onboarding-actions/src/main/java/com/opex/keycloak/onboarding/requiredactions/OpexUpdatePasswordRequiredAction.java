package com.opex.keycloak.onboarding.requiredactions;

import com.opex.keycloak.onboarding.constants.OnboardingRequiredActionIds;
import jakarta.ws.rs.core.MultivaluedHashMap;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;
import java.util.List;
import org.keycloak.authentication.AuthenticatorUtil;
import org.keycloak.authentication.RequiredActionContext;
import org.keycloak.authentication.RequiredActionProvider;
import org.keycloak.authentication.requiredactions.UpdatePassword;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.ModelException;
import org.keycloak.models.UserCredentialModel;
import org.keycloak.models.utils.FormMessage;
import org.keycloak.services.validation.Validation;

public final class OpexUpdatePasswordRequiredAction extends UpdatePassword {

    private static final String CURRENT_PASSWORD_FIELD = "password-current";
    private static final int MAX_AUTH_AGE_SECONDS = 315360000;

    @Override
    public void requiredActionChallenge(RequiredActionContext context) {
        context.challenge(createResponse(context, null, null));
    }

    @Override
    public void processAction(RequiredActionContext context) {
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();
        String currentPassword = normalize(formData.getFirst(CURRENT_PASSWORD_FIELD));
        String newPassword = formData.getFirst("password-new");
        String passwordConfirm = formData.getFirst("password-confirm");

        if (currentPassword == null) {
            context.challenge(createResponse(context, formData, List.of(new FormMessage(CURRENT_PASSWORD_FIELD, "missingCurrentPasswordMessage"))));
            return;
        }

        boolean currentPasswordValid = context.getUser()
            .credentialManager()
            .isValid(UserCredentialModel.password(currentPassword));

        if (!currentPasswordValid) {
            context.challenge(createResponse(context, formData, List.of(new FormMessage(CURRENT_PASSWORD_FIELD, "invalidCurrentPasswordMessage"))));
            return;
        }

        if (Validation.isBlank(newPassword)) {
            context.challenge(createResponse(context, formData, List.of(new FormMessage("password", "missingPasswordMessage"))));
            return;
        }

        if (!newPassword.equals(passwordConfirm)) {
            context.challenge(createResponse(context, formData, List.of(new FormMessage("password-confirm", "notMatchPasswordMessage"))));
            return;
        }

        if ("on".equals(formData.getFirst("logout-sessions"))) {
            AuthenticatorUtil.logoutOtherSessions(context);
        }

        try {
            context.getUser()
                .credentialManager()
                .updateCredential(UserCredentialModel.password(newPassword, false));
            context.success();
        } catch (ModelException exception) {
            context.challenge(createResponse(
                context,
                formData,
                List.of(new FormMessage("password", exception.getMessage(), exception.getParameters()))
            ));
        } catch (Exception exception) {
            context.challenge(createResponse(
                context,
                formData,
                List.of(new FormMessage("password", exception.getMessage()))
            ));
        }
    }

    @Override
    public int getMaxAuthAge() {
        return MAX_AUTH_AGE_SECONDS;
    }

    @Override
    public int getMaxAuthAge(KeycloakSession session) {
        return MAX_AUTH_AGE_SECONDS;
    }

    @Override
    public RequiredActionProvider create(KeycloakSession session) {
        return new OpexUpdatePasswordRequiredAction();
    }

    @Override
    public String getDisplayText() {
        return "Opex update password";
    }

    @Override
    public String getId() {
        return OnboardingRequiredActionIds.OPEX_UPDATE_PASSWORD;
    }

    private Response createResponse(
        RequiredActionContext context,
        MultivaluedMap<String, String> formData,
        List<FormMessage> errors
    ) {
        var form = context.form()
            .setAttribute("username", context.getUser().getUsername())
            .setAttribute("opexCurrentPasswordRequired", Boolean.TRUE);

        if (formData != null) {
            MultivaluedMap<String, String> sanitizedFormData = new MultivaluedHashMap<>(formData);
            sanitizedFormData.remove(CURRENT_PASSWORD_FIELD);
            sanitizedFormData.remove("password-new");
            sanitizedFormData.remove("password-confirm");
            form.setFormData(sanitizedFormData);
        }

        if (errors != null && !errors.isEmpty()) {
            form.setErrors(errors);
        }

        return form.createForm("login-update-password.ftl");
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
