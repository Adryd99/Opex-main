import { useMemo, useState } from "react";
import { clsx } from "keycloakify/tools/clsx";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

export default function Occupation(props: PageProps<Extract<KcContext, { pageId: "occupation.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });

    const { url, messagesPerField, currentOccupation, occupationMaxLength } = kcContext;
    const { msg, msgStr } = i18n;

    const [occupation, setOccupation] = useState(currentOccupation ?? "");

    const normalizedOccupation = useMemo(() => occupation.trim(), [occupation]);
    const isSubmittable = normalizedOccupation !== "" && occupation.length <= occupationMaxLength;
    const occupationHasError = messagesPerField.existsError("occupation");

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
                    <h1 id="kc-page-title">{msg("occupationTitle")}</h1>
                </>
            }
        >
            <form className="opex-auth-form" action={url.loginAction} method="post">
                <div className={clsx("opex-auth-field", occupationHasError && "opex-auth-field--error")}>
                    <label className={kcClsx("kcLabelClass")} htmlFor="occupation">
                        {msg("occupationFieldLabel")}
                    </label>

                    <input
                        id="occupation"
                        name="occupation"
                        type="text"
                        className={kcClsx("kcInputClass")}
                        placeholder={msgStr("occupationPlaceholder")}
                        value={occupation}
                        onChange={event => setOccupation(event.target.value.slice(0, occupationMaxLength))}
                        maxLength={occupationMaxLength}
                        aria-invalid={messagesPerField.existsError("occupation")}
                        required
                    />

                    {messagesPerField.existsError("occupation") && (
                        <span className={kcClsx("kcInputErrorMessageClass")} aria-live="polite">
                            {messagesPerField.getFirstError("occupation")}
                        </span>
                    )}
                </div>

                <div className="opex-auth-actions">
                    <input
                        className={kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonLargeClass")}
                        type="submit"
                        value={msgStr("doSubmit")}
                        disabled={!isSubmittable}
                    />
                </div>

                <div className="opex-auth-step-nav">
                    <button type="submit" name="navigateBack" value="true" className="opex-auth-text-button opex-auth-text-button--start" formNoValidate>
                        {msg("onboardingBack")}
                    </button>
                    <button type="submit" name="skipCurrentStep" value="true" className="opex-auth-text-button opex-auth-text-button--end" formNoValidate>
                        {msg("onboardingSkip")}
                    </button>
                </div>
            </form>
        </Template>
    );
}
