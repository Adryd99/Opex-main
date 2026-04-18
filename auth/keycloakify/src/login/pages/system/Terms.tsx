import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

export default function Terms(props: PageProps<Extract<KcContext, { pageId: "terms.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });

    const { msg, msgStr } = i18n;
    const { url } = kcContext;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayMessage={false}
            headerNode={
                <>
                    <p className="opex-auth-kicker">{msg("termsKicker")}</p>
                    <h1 id="kc-page-title">{msg("termsTitle")}</h1>
                    <p className="opex-auth-description">
                        {msg("termsDescription")}
                    </p>
                </>
            }
        >
            <div id="kc-terms-text" className="opex-auth-legal-copy">
                {msg("termsText")}
            </div>

            <form className="opex-auth-actions" action={url.loginAction} method="POST">
                <input
                    className={kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonLargeClass")}
                    name="accept"
                    id="kc-accept"
                    type="submit"
                    value={msgStr("doAccept")}
                />
                <input
                    className={`${kcClsx("kcButtonClass", "kcButtonLargeClass")} opex-auth-secondary-button`}
                    name="cancel"
                    id="kc-decline"
                    type="submit"
                    value={msgStr("doDecline")}
                />
            </form>
        </Template>
    );
}
