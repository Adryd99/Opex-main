import { clsx } from "keycloakify/tools/clsx";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

export default function LoginRecoveryAuthnCodeInput(
    props: PageProps<Extract<KcContext, { pageId: "login-recovery-authn-code-input.ftl" }>, I18n>
) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;
    const { kcClsx } = getKcClsx({ doUseDefaultCss, classes });
    const { url, messagesPerField, recoveryAuthnCodesInputBean } = kcContext;
    const { msg, msgStr } = i18n;
    const recoveryCodeError = messagesPerField.existsError("recoveryCodeInput")
        ? messagesPerField.get("recoveryCodeInput")
        : undefined;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayMessage={!messagesPerField.existsError("recoveryCodeInput")}
            headerNode={
                <>
                    <h1 id="kc-page-title">{msg("recoveryCodeLoginTitle")}</h1>
                    <p className="opex-auth-description">{msg("recoveryCodeLoginDescription")}</p>
                </>
            }
        >
            <form id="kc-recovery-code-login-form" className="opex-auth-form" action={url.loginAction} method="post">
                <div className={clsx(kcClsx("kcFormGroupClass"), "opex-auth-field", recoveryCodeError && "opex-auth-field--error")}>
                    <label htmlFor="recoveryCodeInput" className={kcClsx("kcLabelClass")}>
                        {msg("auth-recovery-code-prompt", `${recoveryAuthnCodesInputBean.codeNumber}`)}
                    </label>
                    <input
                        id="recoveryCodeInput"
                        name="recoveryCodeInput"
                        autoComplete="one-time-code"
                        type="text"
                        className={kcClsx("kcInputClass")}
                        autoFocus
                        placeholder={msgStr("recoveryCodeLoginPlaceholder")}
                        aria-invalid={recoveryCodeError !== undefined}
                    />
                    {recoveryCodeError && (
                        <span
                            id="input-error"
                            className={kcClsx("kcInputErrorMessageClass")}
                            aria-live="polite"
                            dangerouslySetInnerHTML={{ __html: kcSanitize(recoveryCodeError) }}
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
                    />
                </div>
            </form>
        </Template>
    );
}
