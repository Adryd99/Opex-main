import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

export default function LoginVerifyEmail(props: PageProps<Extract<KcContext, { pageId: "login-verify-email.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });

    const { msg, msgStr } = i18n;
    const { url, user } = kcContext;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayMessage={false}
            displayRequiredFields={false}
            headerNode={
                <>
                    <h1 id="kc-page-title">{msg("verifyEmailPageTitle")}</h1>
                    <p className="opex-auth-description">{msg("verifyEmailPageDescription")}</p>
                </>
            }
        >
            <div className="opex-auth-stack">
                <section className="opex-auth-panel opex-auth-verify-email-panel">
                    <div className="opex-auth-stack">
                        <div className="opex-auth-stack">
                            <p className="opex-auth-panel-title">{msg("verifyEmailInboxTitle")}</p>
                            <p className="opex-auth-panel-copy">{msg("verifyEmailInboxDescription")}</p>
                        </div>

                        <div className="opex-auth-verify-email-address">
                            <span className="opex-auth-verify-email-address-label">{msg("verifyEmailAddressLabel")}</span>
                            <strong>{user?.email ?? ""}</strong>
                        </div>

                        <p className="opex-auth-panel-copy">{msg("verifyEmailContinueHint")}</p>
                    </div>
                </section>

                <div className="opex-auth-actions">
                    <a
                        href={url.loginAction}
                        className={`${kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonBlockClass", "kcButtonLargeClass")} opex-auth-primary-link`}
                    >
                        {msgStr("verifyEmailContinue")}
                    </a>
                </div>
            </div>
        </Template>
    );
}
