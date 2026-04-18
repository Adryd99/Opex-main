import { clsx } from "keycloakify/tools/clsx";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import { useScript } from "keycloakify/login/pages/WebauthnRegister.useScript";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

export default function WebauthnRegister(props: PageProps<Extract<KcContext, { pageId: "webauthn-register.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({ doUseDefaultCss, classes });
    const { url, isSetRetry, isAppInitiatedAction } = kcContext;
    const { msg, msgStr } = i18n;

    const authButtonId = "authenticateWebAuthnButton";

    useScript({
        authButtonId,
        kcContext,
        i18n
    });

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayRequiredFields={false}
            displayMessage={false}
            headerNode={
                <>
                    <h1 id="kc-page-title">{msg("webauthnTitle")}</h1>
                    <p className="opex-auth-description">
                        {msg("webauthnDescription")}
                    </p>
                </>
            }
        >
            <div className="opex-auth-form">
                <section className="opex-auth-panel">
                    <p className="opex-auth-panel-title">{msg("webauthnPanelTitle")}</p>
                    <p className="opex-auth-panel-copy">
                        {msg("webauthnPanelCopy")}
                    </p>

                    <form id="register" className={kcClsx("kcFormClass")} action={url.loginAction} method="post">
                        <div className={kcClsx("kcFormGroupClass")}>
                            <input type="hidden" id="clientDataJSON" name="clientDataJSON" />
                            <input type="hidden" id="attestationObject" name="attestationObject" />
                            <input type="hidden" id="publicKeyCredentialId" name="publicKeyCredentialId" />
                            <input type="hidden" id="authenticatorLabel" name="authenticatorLabel" />
                            <input type="hidden" id="transports" name="transports" />
                            <input type="hidden" id="error" name="error" />
                        </div>
                    </form>
                </section>

                <div className="opex-auth-actions">
                    <input
                        type="submit"
                        className={kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonLargeClass")}
                        id={authButtonId}
                        value={msgStr("doRegisterSecurityKey")}
                    />

                    <button
                        type="submit"
                        className={clsx(kcClsx("kcButtonClass", "kcButtonLargeClass"), "opex-auth-secondary-button")}
                        form="kc-webauthn-back-form"
                    >
                        {msg("onboardingBack")}
                    </button>

                    {!isSetRetry && isAppInitiatedAction && (
                        <form action={url.loginAction} className={kcClsx("kcFormClass")} id="kc-webauthn-settings-form" method="post">
                            <button
                                type="submit"
                                className={clsx(kcClsx("kcButtonClass", "kcButtonLargeClass"), "opex-auth-secondary-button")}
                                id="cancelWebAuthnAIA"
                                name="cancel-aia"
                                value="true"
                            >
                                {msg("doCancel")}
                            </button>
                        </form>
                    )}
                </div>

                <form action={url.loginAction} className={kcClsx("kcFormClass")} id="kc-webauthn-back-form" method="post">
                    <input type="hidden" name="backToSecurityChoice" value="true" />
                </form>
            </div>
        </Template>
    );
}
