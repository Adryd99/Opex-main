import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

export default function LoginIdpLinkEmail(props: PageProps<Extract<KcContext, { pageId: "login-idp-link-email.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { msg } = i18n;
    const { url, brokerContext, idpAlias } = kcContext;
    const providerName = idpAlias === "google" ? "Google" : idpAlias;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayMessage={false}
            displayRequiredFields={false}
            headerNode={<h1 id="kc-page-title">{msg("brokerLinkEmailTitle", providerName)}</h1>}
        >
            <div className="opex-auth-stack">
                <section className="opex-auth-panel opex-auth-info-panel">
                    <p className="opex-auth-panel-copy">
                        {msg("brokerLinkEmailDescription", providerName)}
                    </p>

                    <div className="opex-auth-verify-email-address">
                        <span className="opex-auth-verify-email-address-label">
                            {msg("verifyEmailAddressLabel")}
                        </span>
                        <strong>{brokerContext.username}</strong>
                    </div>

                    <p className="opex-auth-panel-copy">
                        {msg("brokerLinkEmailHint")}
                    </p>
                </section>

                <div className="opex-auth-actions">
                    <a href={url.loginAction} className="kcButtonClass kcButtonPrimaryClass kcButtonBlockClass kcButtonLargeClass opex-auth-primary-link">
                        {msg("brokerLinkEmailPrimaryAction")}
                    </a>
                    <a href={url.loginAction} className="opex-auth-text-action">
                        {msg("brokerLinkEmailSecondaryAction")}
                    </a>
                </div>
            </div>
        </Template>
    );
}
