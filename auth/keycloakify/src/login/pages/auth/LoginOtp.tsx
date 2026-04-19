import { Fragment, useState } from "react";
import { clsx } from "keycloakify/tools/clsx";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

export default function LoginOtp(props: PageProps<Extract<KcContext, { pageId: "login-otp.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;
    const { kcClsx } = getKcClsx({ doUseDefaultCss, classes });
    const { otpLogin, url, messagesPerField } = kcContext;
    const { msg, msgStr } = i18n;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const otpError = messagesPerField.existsError("totp") ? messagesPerField.get("totp") : undefined;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayMessage={!messagesPerField.existsError("totp")}
            headerNode={
                <>
                    <h1 id="kc-page-title">{msg("loginOtpTitle")}</h1>
                </>
            }
        >
            <form
                id="kc-otp-login-form"
                className="opex-auth-form"
                action={url.loginAction}
                method="post"
                onSubmit={() => {
                    setIsSubmitting(true);
                    return true;
                }}
            >
                {otpLogin.userOtpCredentials.length > 1 && (
                    <section className="opex-auth-panel">
                        <p className="opex-auth-panel-title">{msg("loginOtpCredentialTitle")}</p>
                        <div className="opex-auth-method-list">
                            {otpLogin.userOtpCredentials.map((otpCredential, index) => (
                                <Fragment key={otpCredential.id}>
                                    <input
                                        id={`kc-otp-credential-${index}`}
                                        className="opex-auth-method-input"
                                        type="radio"
                                        name="selectedCredentialId"
                                        value={otpCredential.id}
                                        defaultChecked={otpCredential.id === otpLogin.selectedCredentialId}
                                    />
                                    <label
                                        htmlFor={`kc-otp-credential-${index}`}
                                        className="opex-auth-method-option"
                                        tabIndex={index}
                                    >
                                        <span className="opex-auth-method-option-title">{otpCredential.userLabel}</span>
                                    </label>
                                </Fragment>
                            ))}
                        </div>
                    </section>
                )}

                <div className={clsx(kcClsx("kcFormGroupClass"), "opex-auth-field", otpError && "opex-auth-field--error")}>
                    <label htmlFor="otp" className={kcClsx("kcLabelClass")}>
                        {msg("loginOtpInputLabel")}
                    </label>
                    <input
                        id="otp"
                        name="otp"
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        type="text"
                        className={kcClsx("kcInputClass")}
                        autoFocus
                        placeholder={msgStr("totpCodePlaceholder")}
                        aria-invalid={otpError !== undefined}
                    />
                    {otpError && (
                        <span
                            id="input-error-otp-code"
                            className={kcClsx("kcInputErrorMessageClass")}
                            aria-live="polite"
                            dangerouslySetInnerHTML={{ __html: kcSanitize(otpError) }}
                        />
                    )}
                </div>

                <div className="opex-auth-actions">
                    <input
                        className={kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonBlockClass", "kcButtonLargeClass")}
                        name="login"
                        id="kc-login"
                        type="submit"
                        value={msgStr("doLogIn")}
                        disabled={isSubmitting}
                    />
                </div>
            </form>
        </Template>
    );
}
