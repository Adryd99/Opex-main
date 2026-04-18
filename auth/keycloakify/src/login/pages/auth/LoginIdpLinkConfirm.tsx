import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

export default function LoginIdpLinkConfirm(props: PageProps<Extract<KcContext, { pageId: "login-idp-link-confirm.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { msg } = i18n;
    const { url, idpAlias, message } = kcContext;

    const providerName = idpAlias === "google" ? "Google" : idpAlias;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayMessage={false}
            displayRequiredFields={false}
            headerNode={<h1 id="kc-page-title">{msg("existingAccountTitle")}</h1>}
        >
            <div className="opex-auth-stack">
                <section className="opex-auth-panel opex-auth-info-panel">
                    <p className="opex-auth-panel-copy">
                        {msg("existingAccountDescription", providerName)}
                    </p>

                    {message?.summary && (
                        <div className="opex-auth-alert">
                            <span
                                className="kcAlertTitleClass"
                                dangerouslySetInnerHTML={{
                                    __html: kcSanitize(message.summary)
                                }}
                            />
                        </div>
                    )}
                </section>

                <form id="kc-register-form" className="opex-auth-actions" action={url.loginAction} method="post">
                    <button
                        type="submit"
                        className="kcButtonClass kcButtonPrimaryClass kcButtonBlockClass kcButtonLargeClass"
                        name="submitAction"
                        id="linkAccount"
                        value="linkAccount"
                    >
                        {msg("existingAccountLinkAction", providerName)}
                    </button>

                    <button
                        type="submit"
                        className="kcButtonClass kcButtonBlockClass kcButtonLargeClass opex-auth-secondary-button"
                        name="submitAction"
                        id="updateProfile"
                        value="updateProfile"
                    >
                        {msg("existingAccountReviewAction", providerName)}
                    </button>
                </form>
            </div>
        </Template>
    );
}
