import { useEffect, useMemo, useState } from "react";
import { clsx } from "keycloakify/tools/clsx";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import { LegalPreviewModal } from "../../components/LegalPreviewModal";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";
import type { LegalDocumentSlug, LegalPublicInfoPayload } from "../../support/legalSupport";
import { resolveLegalDocument } from "../../support/legalSupport";

type LegalVersions = {
    privacyPolicyVersion: string;
    termsOfServiceVersion: string;
    cookiePolicyVersion: string;
};

export default function LegalAcceptance(props: PageProps<Extract<KcContext, { pageId: "legal-acceptance.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });

    const {
        url,
        messagesPerField,
        privacyUrl,
        termsUrl,
        cookiesUrl,
        legalApiUrl,
        currentCookieChoice,
        strictlyNecessaryChecked
    } = kcContext;
    const { msg, msgStr } = i18n;

    const [acceptPrivacy, setAcceptPrivacy] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [cookieChoice, setCookieChoice] = useState(currentCookieChoice === "reject" ? "reject" : "accept");
    const [acceptStrictlyNecessary, setAcceptStrictlyNecessary] = useState(strictlyNecessaryChecked ?? false);
    const [legalInfo, setLegalInfo] = useState<LegalPublicInfoPayload | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [previewSlug, setPreviewSlug] = useState<LegalDocumentSlug | null>(null);
    const privacyHasError = messagesPerField.existsError("acceptPrivacyPolicy");
    const termsHasError = messagesPerField.existsError("acceptTermsOfService");
    const cookiesHasError = messagesPerField.existsError("cookieChoice");
    const strictlyNecessaryHasError = messagesPerField.existsError("acceptStrictlyNecessaryCookies");

    useEffect(() => {
        let isMounted = true;

        void fetch(legalApiUrl)
            .then(async response => {
                if (!response.ok) {
                    throw new Error("Unable to load legal documents.");
                }

                const payload = await response.json() as LegalPublicInfoPayload;

                if (!isMounted) {
                    return;
                }

                setLegalInfo(payload);
                setLoadError(null);
            })
            .catch(() => {
                if (isMounted) {
                    setLoadError(msgStr("legalAcceptanceVersionsUnavailableError"));
                }
            });

        return () => {
            isMounted = false;
        };
    }, [legalApiUrl, msgStr]);

    const versions = useMemo<LegalVersions | null>(() => {
        if (legalInfo === null) {
            return null;
        }

        return {
            privacyPolicyVersion: legalInfo.privacyPolicy?.version ?? "",
            termsOfServiceVersion: legalInfo.termsOfService?.version ?? "",
            cookiePolicyVersion: legalInfo.cookiePolicy?.version ?? ""
        };
    }, [legalInfo]);

    const mustAcknowledgeStrictlyNecessary = cookieChoice === "reject";
    const isSubmittable = useMemo(() => {
        if (!acceptPrivacy || !acceptTerms) {
            return false;
        }

        if (mustAcknowledgeStrictlyNecessary && !acceptStrictlyNecessary) {
            return false;
        }

        return versions !== null && loadError === null;
    }, [acceptPrivacy, acceptStrictlyNecessary, acceptTerms, loadError, mustAcknowledgeStrictlyNecessary, versions]);

    const previewDocument = previewSlug ? resolveLegalDocument(legalInfo, previewSlug) : null;
    const previewUrl = previewSlug === "privacy"
        ? privacyUrl
        : previewSlug === "terms"
            ? termsUrl
            : previewSlug === "cookies"
                ? cookiesUrl
                : "";

    const openPreview = (slug: LegalDocumentSlug, fallbackUrl: string) => {
        if (legalInfo !== null) {
            setPreviewSlug(slug);
            return;
        }

        window.open(fallbackUrl, "_blank", "noopener,noreferrer");
    };

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
                    <h1 id="kc-page-title">{msg("legalAcceptanceTitle")}</h1>
                </>
            }
        >
            <form className="opex-auth-form" action={url.loginAction} method="post">
                <input type="hidden" name="privacyPolicyVersion" value={versions?.privacyPolicyVersion ?? ""} />
                <input type="hidden" name="termsOfServiceVersion" value={versions?.termsOfServiceVersion ?? ""} />
                <input type="hidden" name="cookiePolicyVersion" value={versions?.cookiePolicyVersion ?? ""} />

                <div className={clsx("opex-auth-panel", "opex-auth-legal-panel", (privacyHasError || termsHasError || cookiesHasError || strictlyNecessaryHasError) && "opex-auth-field--error")}>
                    <div className="opex-auth-legal-section">
                        <p className="opex-auth-panel-title">{msg("legalAcceptanceRequiredAgreementsTitle")}</p>
                        <div className="opex-auth-legal-checklist">
                            <label className="opex-auth-legal-check">
                                <input
                                    type="checkbox"
                                    name="acceptPrivacyPolicy"
                                    checked={acceptPrivacy}
                                    onChange={event => setAcceptPrivacy(event.target.checked)}
                                />
                                <span className="opex-auth-legal-check-copy">
                                    <strong>
                                        {msg("legalAcceptancePrivacyAcceptanceLabel")}
                                        {versions?.privacyPolicyVersion ? ` ${versions.privacyPolicyVersion}` : ""}
                                    </strong>
                                    <small>{msg("legalAcceptancePrivacyAcceptanceHint")}</small>
                                    <button
                                        type="button"
                                        className="opex-auth-doc-link opex-auth-doc-link-button"
                                        onClick={() => openPreview("privacy", privacyUrl)}
                                    >
                                        {msg("legalAcceptancePrivacyLinkTitle")}
                                    </button>
                                </span>
                            </label>
                            {messagesPerField.existsError("acceptPrivacyPolicy") && (
                                <span className={kcClsx("kcInputErrorMessageClass")} aria-live="polite">
                                    {messagesPerField.getFirstError("acceptPrivacyPolicy")}
                                </span>
                            )}

                            <label className="opex-auth-legal-check">
                                <input
                                    type="checkbox"
                                    name="acceptTermsOfService"
                                    checked={acceptTerms}
                                    onChange={event => setAcceptTerms(event.target.checked)}
                                />
                                <span className="opex-auth-legal-check-copy">
                                    <strong>
                                        {msg("legalAcceptanceTermsAcceptanceLabel")}
                                        {versions?.termsOfServiceVersion ? ` ${versions.termsOfServiceVersion}` : ""}
                                    </strong>
                                    <small>{msg("legalAcceptanceTermsAcceptanceHint")}</small>
                                    <button
                                        type="button"
                                        className="opex-auth-doc-link opex-auth-doc-link-button"
                                        onClick={() => openPreview("terms", termsUrl)}
                                    >
                                        {msg("legalAcceptanceTermsLinkTitle")}
                                    </button>
                                </span>
                            </label>
                            {messagesPerField.existsError("acceptTermsOfService") && (
                                <span className={kcClsx("kcInputErrorMessageClass")} aria-live="polite">
                                    {messagesPerField.getFirstError("acceptTermsOfService")}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="opex-auth-legal-divider" />

                    <div className="opex-auth-legal-section">
                        <p className="opex-auth-panel-title">{msg("legalAcceptanceCookiesTitle")}</p>
                        <p className="opex-auth-panel-copy">{msg("legalAcceptanceCookiesDescription")}</p>
                        <button
                            type="button"
                            className="opex-auth-doc-link opex-auth-doc-link-button"
                            onClick={() => openPreview("cookies", cookiesUrl)}
                        >
                            {msg("legalAcceptanceCookiesLinkTitle")}
                        </button>

                        <div className="opex-auth-stack">
                            <label className={clsx("opex-auth-option-card", cookieChoice === "accept" && "opex-auth-option-card--selected")}>
                                <input
                                    type="radio"
                                    name="cookieChoice"
                                    value="accept"
                                    checked={cookieChoice === "accept"}
                                    onChange={() => setCookieChoice("accept")}
                                />
                                <span className="opex-auth-option-card-copy">
                                    <strong>{msg("legalAcceptanceCookiesAcceptLabel")}</strong>
                                    <small>{msg("legalAcceptanceCookiesAcceptHint")}</small>
                                </span>
                            </label>

                            <label className={clsx("opex-auth-option-card", cookieChoice === "reject" && "opex-auth-option-card--selected")}>
                                <input
                                    type="radio"
                                    name="cookieChoice"
                                    value="reject"
                                    checked={cookieChoice === "reject"}
                                    onChange={() => setCookieChoice("reject")}
                                />
                                <span className="opex-auth-option-card-copy">
                                    <strong>{msg("legalAcceptanceCookiesRejectLabel")}</strong>
                                    <small>{msg("legalAcceptanceCookiesRejectHint")}</small>
                                </span>
                            </label>
                        </div>

                        {messagesPerField.existsError("cookieChoice") && (
                            <span className={kcClsx("kcInputErrorMessageClass")} aria-live="polite">
                                {messagesPerField.getFirstError("cookieChoice")}
                            </span>
                        )}

                        {mustAcknowledgeStrictlyNecessary && (
                            <div className="opex-auth-legal-necessary">
                                <p className="opex-auth-panel-copy">{msg("legalAcceptanceStrictlyNecessaryDescription")}</p>
                                <label className="opex-auth-checkbox-row">
                                    <input
                                        type="checkbox"
                                        name="acceptStrictlyNecessaryCookies"
                                        checked={acceptStrictlyNecessary}
                                        onChange={event => setAcceptStrictlyNecessary(event.target.checked)}
                                    />
                                    <span>{msg("legalAcceptanceStrictlyNecessaryCheckbox")}</span>
                                </label>
                                {messagesPerField.existsError("acceptStrictlyNecessaryCookies") && (
                                    <span className={kcClsx("kcInputErrorMessageClass")} aria-live="polite">
                                        {messagesPerField.getFirstError("acceptStrictlyNecessaryCookies")}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {loadError !== null && (
                    <span className={kcClsx("kcInputErrorMessageClass")} aria-live="polite">
                        {loadError}
                    </span>
                )}

                <div className="opex-auth-actions">
                    <input
                        className={kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonLargeClass")}
                        type="submit"
                        value={msgStr("doSubmit")}
                        disabled={!isSubmittable}
                    />
                </div>

                <div className="opex-auth-step-nav opex-auth-step-nav--single">
                    <button type="submit" name="navigateBack" value="true" className="opex-auth-text-button opex-auth-text-button--start" formNoValidate>
                        {msg("onboardingBack")}
                    </button>
                </div>

                {previewDocument !== null && (
                    <LegalPreviewModal
                        document={previewDocument}
                        fullPageUrl={previewUrl}
                        onClose={() => setPreviewSlug(null)}
                    />
                )}
            </form>
        </Template>
    );
}
