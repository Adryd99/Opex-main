import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

export default function LogoutConfirm(props: PageProps<Extract<KcContext, { pageId: "logout-confirm.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });

    const { url, client, logoutConfirm } = kcContext;
    const { msg, msgStr } = i18n;
    const applicationHref =
        client.baseUrl ||
        (kcContext as { properties?: Record<string, string> }).properties?.OPEX_APP_ORIGIN ||
        (kcContext as { properties?: Record<string, string> }).properties?.OPEX_LEGAL_APP_BASE_URL ||
        (() => {
            if (typeof window === "undefined") {
                return undefined;
            }

            const { protocol, hostname } = window.location;

            if (hostname === "localhost" || hostname === "127.0.0.1") {
                return `${protocol}//${hostname}:3000`;
            }

            if (hostname.startsWith("auth.")) {
                return `${protocol}//${hostname.replace(/^auth\./, "")}`;
            }

            return undefined;
        })();

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayMessage={false}
            displayRequiredFields={false}
            headerNode={<h1 id="kc-page-title">{msg("logoutConfirmTitle")}</h1>}
        >
            <form className="opex-auth-form" action={url.logoutConfirmAction} method="post">
                <input type="hidden" name="session_code" value={logoutConfirm.code} />

                <div className="opex-auth-actions">
                    <input
                        tabIndex={4}
                        className={kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonBlockClass", "kcButtonLargeClass")}
                        name="confirmLogout"
                        id="kc-logout"
                        type="submit"
                        value={msgStr("doLogout")}
                    />
                </div>

                {applicationHref && (
                    <div className="opex-auth-actions">
                        <a href={applicationHref} className={`${kcClsx("kcButtonClass", "kcButtonLargeClass")} opex-auth-secondary-button`}>
                            {msg("backToApplication")}
                        </a>
                    </div>
                )}
            </form>
        </Template>
    );
}
