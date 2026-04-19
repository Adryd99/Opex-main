import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

export default function SelectAuthenticator(props: PageProps<Extract<KcContext, { pageId: "select-authenticator.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;
    const { url, auth } = kcContext;
    const { msg, advancedMsg } = i18n;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayInfo={false}
            headerNode={
                <>
                    <h1 id="kc-page-title">{msg("selectAuthenticatorTitle")}</h1>
                    <p className="opex-auth-description">{msg("selectAuthenticatorDescription")}</p>
                </>
            }
        >
            <form id="kc-select-credential-form" className="opex-auth-form" action={url.loginAction} method="post">
                <div className="opex-auth-method-list">
                    {auth.authenticationSelections.map(authenticationSelection => (
                        <button
                            key={authenticationSelection.authExecId}
                            className="opex-auth-method-option opex-auth-method-option--button"
                            type="submit"
                            name="authenticationExecution"
                            value={authenticationSelection.authExecId}
                        >
                            <span className="opex-auth-method-option-copy">
                                <strong className="opex-auth-method-option-title">
                                    {advancedMsg(authenticationSelection.displayName)}
                                </strong>
                                <span className="opex-auth-method-option-description">
                                    {advancedMsg(authenticationSelection.helpText)}
                                </span>
                            </span>
                            <span className="opex-auth-method-option-arrow" aria-hidden="true">
                                -&gt;
                            </span>
                        </button>
                    ))}
                </div>
            </form>
        </Template>
    );
}
