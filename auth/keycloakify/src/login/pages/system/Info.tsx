import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

export default function Info(props: PageProps<Extract<KcContext, { pageId: "info.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { advancedMsgStr, msg } = i18n;
    const { messageHeader, message, requiredActions, skipLink, pageRedirectUri, actionUri, client } = kcContext;

    const resolvedActionHref = skipLink ? undefined : actionUri ?? pageRedirectUri ?? client.baseUrl;
    const resolvedActionLabel = actionUri
        ? msg("infoPageConfirmAction")
        : pageRedirectUri || client.baseUrl
          ? msg("backToApplication")
          : undefined;

    const resolvedMessageHtml = (() => {
        let html = message.summary?.trim() ?? "";

        html = html
            .replace(/<a\b[^>]*>.*?<\/a>/gi, "")
            .replace(/(?:&raquo;|»)\s*Clicca qui per (?:continuare|confermare)\.?/gi, "")
            .replace(/(?:&raquo;|»)\s*Click here to (?:continue|confirm)\.?/gi, "")
            .replace(/Controlla le informazioni qui sotto e continua quando sei pronto\.?/gi, "")
            .replace(/Check the information below and continue when you're ready\.?/gi, "")
            .replace(/<br\s*\/?>\s*(<br\s*\/?>\s*)+/gi, "<br />")
            .trim();

        if (requiredActions && requiredActions.length > 0) {
            html += " <b>";
            html += requiredActions.map(requiredAction => advancedMsgStr(`requiredAction.${requiredAction}`)).join(", ");
            html += "</b>";
        }

        return html;
    })();

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayMessage={false}
            displayRequiredFields={false}
            headerNode={
                <h1
                    id="kc-page-title"
                    dangerouslySetInnerHTML={{
                        __html: kcSanitize(messageHeader ?? message.summary)
                    }}
                />
            }
        >
            <div className="opex-auth-stack">
                <section className="opex-auth-panel opex-auth-info-panel">
                    <div
                        className="opex-auth-panel-copy opex-auth-message-copy"
                        dangerouslySetInnerHTML={{
                            __html: kcSanitize(resolvedMessageHtml)
                        }}
                    />
                </section>

                {resolvedActionHref && resolvedActionLabel && (
                    <div className="opex-auth-actions">
                        <a href={resolvedActionHref} className="kcButtonClass opex-auth-primary-link">
                            {resolvedActionLabel}
                        </a>
                    </div>
                )}
            </div>
        </Template>
    );
}
