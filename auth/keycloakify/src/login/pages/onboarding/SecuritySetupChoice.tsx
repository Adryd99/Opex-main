import { useState } from "react";
import { clsx } from "keycloakify/tools/clsx";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

const SECURITY_OPTIONS = ["totp", "webauthn", "later"] as const;

export default function SecuritySetupChoice(props: PageProps<Extract<KcContext, { pageId: "security-setup-choice.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });

    const { url, messagesPerField, currentSecuritySetupChoice } = kcContext;
    const { msg, msgStr } = i18n;

    const [selectedChoice, setSelectedChoice] = useState(currentSecuritySetupChoice ?? "");
    const choiceHasError = messagesPerField.existsError("securitySetupChoice");

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayRequiredFields={false}
            displayMessage={messagesPerField.exists("global")}
            headerNode={
                <>
                    <h1 id="kc-page-title">{msg("securitySetupChoiceTitle")}</h1>
                </>
            }
        >
            <form className="opex-auth-form" action={url.loginAction} method="post">
                <div className={clsx("opex-auth-field", choiceHasError && "opex-auth-field--error")}>
                    <div className="opex-auth-option-grid opex-auth-option-grid--stacked" role="radiogroup" aria-labelledby="kc-page-title">
                        {SECURITY_OPTIONS.map(choice => {
                            const isSelected = selectedChoice === choice;

                            return (
                                <label key={choice} className={clsx("opex-auth-option-card", isSelected && "opex-auth-option-card--selected")}>
                                    <input
                                        type="radio"
                                        name="securitySetupChoice"
                                        value={choice}
                                        checked={isSelected}
                                        onChange={() => setSelectedChoice(choice)}
                                    />
                                    <span className="opex-auth-option-card-copy">
                                        <strong>{msg(`securitySetupChoiceOption.${choice}.title`)}</strong>
                                        <small>{msg(`securitySetupChoiceOption.${choice}.description`)}</small>
                                    </span>
                                </label>
                            );
                        })}
                    </div>

                    {choiceHasError && (
                        <span className={kcClsx("kcInputErrorMessageClass")} aria-live="polite">
                            {messagesPerField.getFirstError("securitySetupChoice")}
                        </span>
                    )}
                </div>

                <div className="opex-auth-actions">
                    <input
                        className={kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonLargeClass")}
                        type="submit"
                        value={msgStr("doSubmit")}
                        disabled={selectedChoice === ""}
                    />
                </div>
            </form>
        </Template>
    );
}
