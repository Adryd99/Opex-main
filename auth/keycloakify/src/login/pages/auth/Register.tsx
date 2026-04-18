import type { JSX } from "keycloakify/tools/JSX";
import { useLayoutEffect, useMemo, useState } from "react";
import type { LazyOrNot } from "keycloakify/tools/LazyOrNot";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { getKcClsx, type KcClsx } from "keycloakify/login/lib/kcClsx";
import { clsx } from "keycloakify/tools/clsx";
import { useIsPasswordRevealed } from "keycloakify/tools/useIsPasswordRevealed";
import type { UserProfileFormFieldsProps } from "keycloakify/login/UserProfileFormFieldsProps";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";
import { SocialProviders } from "../../components/SocialProviders";

type RegisterProps = PageProps<Extract<KcContext, { pageId: "register.ftl" }>, I18n> & {
    UserProfileFormFields: LazyOrNot<(props: UserProfileFormFieldsProps) => JSX.Element>;
    doMakeUserConfirmPassword: boolean;
};

export default function Register(props: RegisterProps) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });

    const {
        messageHeader,
        url,
        messagesPerField,
        recaptchaRequired,
        recaptchaVisible,
        recaptchaSiteKey,
        recaptchaAction,
        termsAcceptanceRequired,
        realm
    } = kcContext;
    const social = ("social" in kcContext ? kcContext.social : undefined) as
        | {
              providers?: {
                  loginUrl: string;
                  alias: string;
                  providerId: string;
                  displayName: string;
                  iconClasses?: string;
              }[];
          }
        | undefined;

    const { msg, msgStr, advancedMsg } = i18n;

    const profileAttributes = kcContext.profile.attributesByName;
    const [email, setEmail] = useState(profileAttributes.email?.value ?? "");
    const [username, setUsername] = useState(profileAttributes.username?.value ?? "");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [areTermsAccepted, setAreTermsAccepted] = useState(false);

    const isPasswordMatch = password !== "" && password === passwordConfirm;
    const emailHasError = messagesPerField.existsError("email", "username");
    const usernameHasError = messagesPerField.existsError("username");
    const passwordHasError = messagesPerField.existsError("password");
    const passwordConfirmHasError = messagesPerField.existsError("password-confirm") || (passwordConfirm !== "" && !isPasswordMatch);
    const isFormSubmittable = useMemo(() => {
        const hasIdentity = realm.registrationEmailAsUsername ? email.trim() !== "" : email.trim() !== "" && username.trim() !== "";

        return hasIdentity && isPasswordMatch;
    }, [email, isPasswordMatch, realm.registrationEmailAsUsername, username]);

    useLayoutEffect(() => {
        const windowWithRecaptchaCallback = window as Window & {
            onSubmitRecaptcha?: () => void;
        };

        windowWithRecaptchaCallback.onSubmitRecaptcha = () => {
            const registerForm = document.getElementById("kc-register-form") as HTMLFormElement | null;
            registerForm?.requestSubmit();
        };

        return () => {
            delete windowWithRecaptchaCallback.onSubmitRecaptcha;
        };
    }, []);

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            headerNode={
                <>
                    <h1 id="kc-page-title">{messageHeader !== undefined ? advancedMsg(messageHeader) : msg("registerAccountTitle")}</h1>
                </>
            }
            displayMessage={messagesPerField.exists("global")}
            displayRequiredFields={false}
            socialProvidersNode={<SocialProviders social={social} kcClsx={kcClsx} i18n={i18n} />}
        >
            <form id="kc-register-form" className={clsx(kcClsx("kcFormClass"), "opex-auth-form")} action={url.registrationAction} method="post">
                <div className={clsx(kcClsx("kcFormGroupClass"), "opex-auth-field", emailHasError && "opex-auth-field--error")}>
                    <label htmlFor="email" className={kcClsx("kcLabelClass")}>
                        {msg("email")}
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        className={kcClsx("kcInputClass")}
                        placeholder={msgStr("registerEmailPlaceholder")}
                        value={email}
                        onChange={event => setEmail(event.target.value)}
                        aria-invalid={messagesPerField.existsError("email", "username")}
                        required
                    />
                    {messagesPerField.existsError("email", "username") && (
                        <span
                            className={kcClsx("kcInputErrorMessageClass")}
                            aria-live="polite"
                            dangerouslySetInnerHTML={{
                                __html: kcSanitize(messagesPerField.getFirstError("email", "username"))
                            }}
                        />
                    )}
                </div>

                {realm.registrationEmailAsUsername ? (
                    <input type="hidden" name="username" value={email} />
                ) : (
                    <div className={clsx(kcClsx("kcFormGroupClass"), "opex-auth-field", usernameHasError && "opex-auth-field--error")}>
                        <label htmlFor="username" className={kcClsx("kcLabelClass")}>
                            {msg("username")}
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            className={kcClsx("kcInputClass")}
                            placeholder={msgStr("registerUsernamePlaceholder")}
                            value={username}
                            onChange={event => setUsername(event.target.value)}
                            aria-invalid={messagesPerField.existsError("username")}
                            required
                        />
                        {messagesPerField.existsError("username") && (
                            <span
                                className={kcClsx("kcInputErrorMessageClass")}
                                aria-live="polite"
                                dangerouslySetInnerHTML={{
                                    __html: kcSanitize(messagesPerField.getFirstError("username"))
                                }}
                            />
                        )}
                    </div>
                )}

                <div className="opex-auth-stack">
                    <div className={clsx(kcClsx("kcFormGroupClass"), "opex-auth-field", passwordHasError && "opex-auth-field--error")}>
                        <label htmlFor="password" className={kcClsx("kcLabelClass")}>
                            {msg("password")}
                        </label>
                        <PasswordField kcClsx={kcClsx} i18n={i18n} inputId="password" hasError={passwordHasError}>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                className={kcClsx("kcInputClass")}
                                placeholder={msgStr("registerPasswordPlaceholder")}
                                value={password}
                                onChange={event => setPassword(event.target.value)}
                                aria-invalid={messagesPerField.existsError("password")}
                                required
                            />
                        </PasswordField>
                        {messagesPerField.existsError("password") && (
                            <span
                                className={kcClsx("kcInputErrorMessageClass")}
                                aria-live="polite"
                                dangerouslySetInnerHTML={{
                                    __html: kcSanitize(messagesPerField.getFirstError("password"))
                                }}
                            />
                        )}
                    </div>

                    <div className={clsx(kcClsx("kcFormGroupClass"), "opex-auth-field", passwordConfirmHasError && "opex-auth-field--error")}>
                        <label htmlFor="password-confirm" className={kcClsx("kcLabelClass")}>
                            {msg("passwordConfirm")}
                        </label>
                        <PasswordField kcClsx={kcClsx} i18n={i18n} inputId="password-confirm" hasError={passwordConfirmHasError}>
                            <input
                                id="password-confirm"
                                name="password-confirm"
                                type="password"
                                autoComplete="new-password"
                                className={kcClsx("kcInputClass")}
                                placeholder={msgStr("registerPasswordConfirmPlaceholder")}
                                value={passwordConfirm}
                                onChange={event => setPasswordConfirm(event.target.value)}
                                aria-invalid={messagesPerField.existsError("password-confirm") || (passwordConfirm !== "" && !isPasswordMatch)}
                                required
                            />
                        </PasswordField>
                        {messagesPerField.existsError("password-confirm") ? (
                            <span
                                className={kcClsx("kcInputErrorMessageClass")}
                                aria-live="polite"
                                dangerouslySetInnerHTML={{
                                    __html: kcSanitize(messagesPerField.getFirstError("password-confirm"))
                                }}
                            />
                        ) : (
                            passwordConfirm !== "" &&
                            !isPasswordMatch && (
                                <span className={kcClsx("kcInputErrorMessageClass")} aria-live="polite">
                                    {msg("registerPasswordsMustMatch")}
                                </span>
                            )
                        )}
                    </div>
                </div>

                {termsAcceptanceRequired && (
                    <TermsAcceptance
                        i18n={i18n}
                        kcClsx={kcClsx}
                        messagesPerField={messagesPerField}
                        areTermsAccepted={areTermsAccepted}
                        onAreTermsAcceptedValueChange={setAreTermsAccepted}
                    />
                )}

                {recaptchaRequired && (recaptchaVisible || recaptchaAction === undefined) && (
                    <div className="form-group">
                        <div className={kcClsx("kcInputWrapperClass")}>
                            <div className="g-recaptcha" data-size="compact" data-sitekey={recaptchaSiteKey} data-action={recaptchaAction}></div>
                        </div>
                    </div>
                )}

                <div className={clsx(kcClsx("kcFormGroupClass"), "opex-auth-register-submit-group")}>
                    {recaptchaRequired && !recaptchaVisible && recaptchaAction !== undefined ? (
                        <div
                            id="kc-form-buttons"
                            className={clsx(kcClsx("kcFormGroupClass"), "opex-auth-register-actions")}
                        >
                            <button
                                className={clsx(
                                    kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonBlockClass", "kcButtonLargeClass"),
                                    "g-recaptcha"
                                )}
                                data-sitekey={recaptchaSiteKey}
                                data-callback="onSubmitRecaptcha"
                                data-action={recaptchaAction}
                                type="submit"
                            >
                                {msg("doRegister")}
                            </button>
                        </div>
                    ) : (
                        <div
                            id="kc-form-buttons"
                            className={clsx(kcClsx("kcFormGroupClass"), "opex-auth-register-actions")}
                        >
                            <input
                                disabled={!isFormSubmittable || (termsAcceptanceRequired && !areTermsAccepted)}
                                className={kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonBlockClass", "kcButtonLargeClass")}
                                type="submit"
                                value={msgStr("doRegister")}
                            />
                        </div>
                    )}

                    <div className="opex-auth-step-nav opex-auth-step-nav--single">
                        <a href={url.loginUrl} className="opex-auth-text-button opex-auth-text-button--start">
                            {msg("backToLogin")}
                        </a>
                    </div>
                </div>
            </form>
        </Template>
    );
}

function PasswordField(props: {
    kcClsx: KcClsx;
    i18n: I18n;
    inputId: string;
    hasError?: boolean;
    children: JSX.Element;
}) {
    const { kcClsx, i18n, inputId, hasError = false, children } = props;
    const { msgStr } = i18n;
    const { isPasswordRevealed, toggleIsPasswordRevealed } = useIsPasswordRevealed({ passwordInputId: inputId });

    return (
        <div className={clsx(kcClsx("kcInputGroup"), "opex-auth-password-group", hasError && "opex-auth-password-group--error")}>
            {children}
            <button
                type="button"
                className={kcClsx("kcFormPasswordVisibilityButtonClass")}
                tabIndex={-1}
                aria-label={msgStr(isPasswordRevealed ? "hidePassword" : "showPassword")}
                aria-controls={inputId}
                onClick={toggleIsPasswordRevealed}
            >
                <i className={kcClsx(isPasswordRevealed ? "kcFormPasswordVisibilityIconHide" : "kcFormPasswordVisibilityIconShow")} aria-hidden />
            </button>
        </div>
    );
}

function TermsAcceptance(props: {
    i18n: I18n;
    kcClsx: KcClsx;
    messagesPerField: Pick<KcContext["messagesPerField"], "existsError" | "get">;
    areTermsAccepted: boolean;
    onAreTermsAcceptedValueChange: (areTermsAccepted: boolean) => void;
}) {
    const { i18n, kcClsx, messagesPerField, areTermsAccepted, onAreTermsAcceptedValueChange } = props;
    const { msg } = i18n;

    return (
        <>
            <div className="form-group opex-auth-terms-copy">
                <div className={kcClsx("kcInputWrapperClass")}>
                    <p className="opex-auth-terms-title">{msg("termsTitle")}</p>
                    <div id="kc-registration-terms-text">{msg("termsText")}</div>
                </div>
            </div>
            <div className={clsx("form-group", messagesPerField.existsError("termsAccepted") && "opex-auth-field--error")}>
                <div className={clsx(kcClsx("kcLabelWrapperClass"), "opex-auth-checkbox-row")}>
                    <input
                        type="checkbox"
                        id="termsAccepted"
                        name="termsAccepted"
                        className={kcClsx("kcCheckboxInputClass")}
                        checked={areTermsAccepted}
                        onChange={event => onAreTermsAcceptedValueChange(event.target.checked)}
                        aria-invalid={messagesPerField.existsError("termsAccepted")}
                    />
                    <label htmlFor="termsAccepted" className={kcClsx("kcLabelClass")}>
                        {msg("acceptTerms")}
                    </label>
                </div>
                {messagesPerField.existsError("termsAccepted") && (
                    <div className={kcClsx("kcLabelWrapperClass")}>
                        <span
                            id="input-error-terms-accepted"
                            className={kcClsx("kcInputErrorMessageClass")}
                            aria-live="polite"
                            dangerouslySetInnerHTML={{
                                __html: kcSanitize(messagesPerField.get("termsAccepted"))
                            }}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
