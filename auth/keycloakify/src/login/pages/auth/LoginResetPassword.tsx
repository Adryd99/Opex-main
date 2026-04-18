import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

export default function LoginResetPassword(props: PageProps<Extract<KcContext, { pageId: "login-reset-password.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });

    const { url, realm, auth, messagesPerField } = kcContext;
    const { msg, msgStr } = i18n;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayMessage={!messagesPerField.existsError("username")}
            displayRequiredFields={false}
            headerNode={
                <>
                    <h1 id="kc-page-title">{msg("resetPasswordTitle")}</h1>
                    <p className="opex-auth-description">{msg("resetPasswordDescription")}</p>
                </>
            }
        >
            <form id="kc-reset-password-form" className="opex-auth-form" action={url.loginAction} method="post">
                <div className={kcClsx("kcFormGroupClass")}>
                    <div className="opex-auth-field">
                        <label htmlFor="username" className={kcClsx("kcLabelClass")}>
                            {!realm.loginWithEmailAllowed
                                ? msg("username")
                                : !realm.registrationEmailAsUsername
                                  ? msg("usernameOrEmail")
                                  : msg("email")}
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            className={kcClsx("kcInputClass")}
                            autoFocus
                            defaultValue={auth.attemptedUsername ?? ""}
                            placeholder={msgStr("resetPasswordPlaceholder")}
                            aria-invalid={messagesPerField.existsError("username")}
                        />
                        {messagesPerField.existsError("username") && (
                            <span
                                id="input-error-username"
                                className={kcClsx("kcInputErrorMessageClass")}
                                aria-live="polite"
                                dangerouslySetInnerHTML={{
                                    __html: kcSanitize(messagesPerField.get("username"))
                                }}
                            />
                        )}
                    </div>
                </div>

                <div className="opex-auth-actions">
                    <input
                        className={kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonBlockClass", "kcButtonLargeClass")}
                        type="submit"
                        value={msgStr("resetPasswordSubmit")}
                    />
                </div>

                <div className="opex-auth-step-nav opex-auth-step-nav--single">
                    <a href={url.loginUrl} className="opex-auth-text-button opex-auth-text-button--start">
                        {msg("backToLogin")}
                    </a>
                </div>
            </form>
        </Template>
    );
}
