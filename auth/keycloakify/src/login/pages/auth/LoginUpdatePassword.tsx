import { useState } from "react";
import type { JSX } from "keycloakify/tools/JSX";
import { useIsPasswordRevealed } from "keycloakify/tools/useIsPasswordRevealed";
import { clsx } from "keycloakify/tools/clsx";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { getKcClsx, type KcClsx } from "keycloakify/login/lib/kcClsx";
import type { PasswordPolicies } from "keycloakify/login/KcContext";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";
import { PasswordRequirements } from "../../components/PasswordRequirements";

export default function LoginUpdatePassword(props: PageProps<Extract<KcContext, { pageId: "login-update-password.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });

    const { msg, msgStr } = i18n;
    const { url, messagesPerField, isAppInitiatedAction, auth } = kcContext;
    const requiresCurrentPassword = "opexCurrentPasswordRequired" in kcContext && kcContext.opexCurrentPasswordRequired === true;
    const passwordPolicies = ("passwordPolicies" in kcContext ? kcContext.passwordPolicies : undefined) as PasswordPolicies | undefined;
    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [hasEditedPasswordSinceError, setHasEditedPasswordSinceError] = useState(false);
    const [hasEditedCurrentPasswordSinceError, setHasEditedCurrentPasswordSinceError] = useState(false);
    const isPasswordMatch = password !== "" && password === passwordConfirm;
    const currentPasswordHasError = messagesPerField.existsError("password-current");
    const currentPasswordServerError = currentPasswordHasError ? messagesPerField.getFirstError("password-current") : undefined;
    const passwordHasError = messagesPerField.existsError("password");
    const passwordConfirmHasError = messagesPerField.existsError("password-confirm") || (passwordConfirm !== "" && !isPasswordMatch);
    const passwordServerError = messagesPerField.existsError("password") ? messagesPerField.getFirstError("password") : undefined;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayMessage={!(passwordHasError || messagesPerField.existsError("password-confirm"))}
            headerNode={
                <>
                    <h1 id="kc-page-title">{msg("updatePasswordTitle")}</h1>
                    <p className="opex-auth-description">{msg(requiresCurrentPassword ? "updatePasswordCurrentDescription" : "updatePasswordDescription")}</p>
                </>
            }
        >
            <form id="kc-passwd-update-form" className="opex-auth-form" action={url.loginAction} method="post">
                {requiresCurrentPassword && (
                    <div className={clsx(kcClsx("kcFormGroupClass"), "opex-auth-field", currentPasswordHasError && "opex-auth-field--error")}>
                        <label htmlFor="password-current" className={kcClsx("kcLabelClass")}>
                            {msg("passwordCurrent")}
                        </label>
                        <PasswordWrapper kcClsx={kcClsx} i18n={i18n} passwordInputId="password-current" hasError={currentPasswordHasError}>
                            <input
                                type="password"
                                id="password-current"
                                name="password-current"
                                className={kcClsx("kcInputClass")}
                                autoFocus
                                autoComplete="current-password"
                                placeholder={msgStr("updatePasswordCurrentPlaceholder")}
                                aria-invalid={currentPasswordHasError}
                                value={currentPassword}
                                onChange={event => {
                                    setCurrentPassword(event.target.value);
                                    if (currentPasswordHasError) {
                                        setHasEditedCurrentPasswordSinceError(true);
                                    }
                                }}
                            />
                        </PasswordWrapper>
                        {currentPasswordServerError && !hasEditedCurrentPasswordSinceError && (
                            <span
                                className={kcClsx("kcInputErrorMessageClass")}
                                aria-live="polite"
                                dangerouslySetInnerHTML={{
                                    __html: kcSanitize(currentPasswordServerError)
                                }}
                            />
                        )}
                    </div>
                )}

                <div className={clsx(kcClsx("kcFormGroupClass"), "opex-auth-field", passwordHasError && "opex-auth-field--error")}>
                    <label htmlFor="password-new" className={kcClsx("kcLabelClass")}>
                        {msg("passwordNew")}
                    </label>
                    <PasswordWrapper kcClsx={kcClsx} i18n={i18n} passwordInputId="password-new" hasError={passwordHasError}>
                        <input
                            type="password"
                            id="password-new"
                            name="password-new"
                            className={kcClsx("kcInputClass")}
                            autoFocus={!requiresCurrentPassword}
                            autoComplete="new-password"
                            placeholder={msgStr("updatePasswordNewPlaceholder")}
                            aria-invalid={passwordHasError}
                            value={password}
                            onChange={event => {
                                setPassword(event.target.value);
                                if (passwordHasError || messagesPerField.existsError("password-confirm")) {
                                    setHasEditedPasswordSinceError(true);
                                }
                            }}
                        />
                    </PasswordWrapper>
                </div>

                <div className={clsx(kcClsx("kcFormGroupClass"), "opex-auth-field", passwordConfirmHasError && "opex-auth-field--error")}>
                    <label htmlFor="password-confirm" className={kcClsx("kcLabelClass")}>
                        {msg("passwordConfirm")}
                    </label>
                    <PasswordWrapper kcClsx={kcClsx} i18n={i18n} passwordInputId="password-confirm" hasError={passwordConfirmHasError}>
                        <input
                            type="password"
                            id="password-confirm"
                            name="password-confirm"
                            className={kcClsx("kcInputClass")}
                            autoComplete="new-password"
                            placeholder={msgStr("updatePasswordConfirmPlaceholder")}
                            aria-invalid={messagesPerField.existsError("password-confirm") || (passwordConfirm !== "" && !isPasswordMatch)}
                            value={passwordConfirm}
                            onChange={event => {
                                setPasswordConfirm(event.target.value);
                                if (passwordHasError || messagesPerField.existsError("password-confirm")) {
                                    setHasEditedPasswordSinceError(true);
                                }
                            }}
                        />
                    </PasswordWrapper>
                </div>

                <PasswordRequirements
                    i18n={i18n}
                    passwordPolicies={passwordPolicies}
                    password={password}
                    passwordConfirm={passwordConfirm}
                    identifier={auth?.attemptedUsername}
                    isVisible={passwordHasError || messagesPerField.existsError("password-confirm")}
                    serverErrorHtml={passwordServerError}
                    hasEditedSinceError={hasEditedPasswordSinceError}
                />

                <div className="opex-auth-panel opex-auth-password-note">
                    <p className="opex-auth-panel-title">{msg("updatePasswordSecurityTitle")}</p>
                    <p className="opex-auth-panel-copy">{msg("updatePasswordSecurityBody")}</p>
                    <LogoutOtherSessions i18n={i18n} />
                </div>

                <div className="opex-auth-actions">
                    <input
                        className={kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonBlockClass", "kcButtonLargeClass")}
                        type="submit"
                        value={msgStr("updatePasswordSubmit")}
                    />
                    {isAppInitiatedAction && (
                        <button
                            className={clsx(
                                kcClsx("kcButtonClass", "kcButtonLargeClass"),
                                "opex-auth-secondary-button"
                            )}
                            type="submit"
                            name="cancel-aia"
                            value="true"
                        >
                            {msg("doCancel")}
                        </button>
                    )}
                </div>
            </form>
        </Template>
    );
}

function LogoutOtherSessions(props: { i18n: I18n }) {
    const { i18n } = props;
    const { msg } = i18n;

    return (
        <label className="opex-auth-checkbox-control">
            <input type="checkbox" id="logout-sessions" name="logout-sessions" value="on" />
            <span>{msg("logoutOtherSessions")}</span>
        </label>
    );
}

function PasswordWrapper(props: { kcClsx: KcClsx; i18n: I18n; passwordInputId: string; hasError?: boolean; children: JSX.Element }) {
    const { kcClsx, i18n, passwordInputId, hasError = false, children } = props;
    const { msgStr } = i18n;
    const { isPasswordRevealed, toggleIsPasswordRevealed } = useIsPasswordRevealed({ passwordInputId });

    return (
        <div className={clsx(kcClsx("kcInputGroup"), "opex-auth-password-group", hasError && "opex-auth-password-group--error")}>
            {children}
            <button
                type="button"
                className={kcClsx("kcFormPasswordVisibilityButtonClass")}
                tabIndex={-1}
                aria-label={msgStr(isPasswordRevealed ? "hidePassword" : "showPassword")}
                aria-controls={passwordInputId}
                onClick={toggleIsPasswordRevealed}
            >
                <i className={kcClsx(isPasswordRevealed ? "kcFormPasswordVisibilityIconHide" : "kcFormPasswordVisibilityIconShow")} aria-hidden />
            </button>
        </div>
    );
}
