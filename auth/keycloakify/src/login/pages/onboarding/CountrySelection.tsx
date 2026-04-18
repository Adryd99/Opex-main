import { useMemo, useState } from "react";
import { clsx } from "keycloakify/tools/clsx";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

const COUNTRY_CODES = ["IT", "NL", "BE", "DE"] as const;

export default function CountrySelection(props: PageProps<Extract<KcContext, { pageId: "country-selection.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });

    const { url, messagesPerField, currentCountry, allowedCountries } = kcContext;
    const { msg, msgStr } = i18n;

    const normalizedAllowedCountries = useMemo(() => {
        const source = allowedCountries.length === 0 ? [...COUNTRY_CODES] : allowedCountries;
        return source.filter((countryCode): countryCode is (typeof COUNTRY_CODES)[number] => COUNTRY_CODES.includes(countryCode as (typeof COUNTRY_CODES)[number]));
    }, [allowedCountries]);

    const [selectedCountry, setSelectedCountry] = useState(currentCountry ?? "");
    const countryHasError = messagesPerField.existsError("country");

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
                    <h1 id="kc-page-title">{msg("countrySelectionTitle")}</h1>
                </>
            }
        >
            <form className="opex-auth-form" action={url.loginAction} method="post">
                <div className={clsx("opex-auth-field", countryHasError && "opex-auth-field--error")}>
                    <label className={kcClsx("kcLabelClass")} htmlFor="country-selection-list">
                        {msg("countrySelectionFieldLabel")}
                    </label>

                    <input type="hidden" name="country" value={selectedCountry} />

                    <div id="country-selection-list" className="opex-auth-option-grid" role="group" aria-labelledby="kc-page-title">
                        {normalizedAllowedCountries.map(countryCode => {
                            const isSelected = selectedCountry === countryCode;

                            return (
                                <button
                                    key={countryCode}
                                    type="button"
                                    className={clsx("opex-auth-option-card", isSelected && "opex-auth-option-card--selected")}
                                    onClick={() => setSelectedCountry(current => (current === countryCode ? "" : countryCode))}
                                    aria-pressed={isSelected}
                                >
                                    <span className="opex-auth-option-card-indicator" aria-hidden="true" />
                                    <span className="opex-auth-option-card-copy">
                                        <strong>{msg(`countryLabel.${countryCode}`)}</strong>
                                        <small>{countryCode}</small>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {messagesPerField.existsError("country") && (
                        <span className={kcClsx("kcInputErrorMessageClass")} aria-live="polite">
                            {messagesPerField.getFirstError("country")}
                        </span>
                    )}
                </div>

                <div className="opex-auth-actions">
                    <input
                        className={kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonLargeClass")}
                        type="submit"
                        value={msgStr("doSubmit")}
                        disabled={selectedCountry === ""}
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
