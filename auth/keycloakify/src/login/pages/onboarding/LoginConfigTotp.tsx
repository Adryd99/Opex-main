import { useState } from "react";
import { clsx } from "keycloakify/tools/clsx";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

export default function LoginConfigTotp(props: PageProps<Extract<KcContext, { pageId: "login-config-totp.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });

    const { url, isAppInitiatedAction, totp, mode, messagesPerField } = kcContext;
    const { msg, msgStr } = i18n;
    const totpHasError = messagesPerField.existsError("totp");
    const [currentMode, setCurrentMode] = useState<"barcode" | "manual">(mode === "manual" ? "manual" : "barcode");

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
                    <h1 id="kc-page-title">{msg("totpTitle")}</h1>
                    <p className="opex-auth-description">
                        {msg("totpDescription")}
                    </p>
                </>
            }
        >
            <div className="opex-auth-form">
                <section className="opex-auth-panel">
                    <p className="opex-auth-panel-title">{msg("totpSupportedAppsTitle")}</p>
                    <ul id="kc-totp-supported-apps" className="opex-auth-chip-list">
                        <li className="opex-auth-chip">{msg("totpAppGoogle")}</li>
                        <li className="opex-auth-chip">{msg("totpAppMicrosoft")}</li>
                        <li className="opex-auth-chip">{msg("totpAppOther")}</li>
                    </ul>
                </section>

                <section className="opex-auth-panel">
                    {currentMode === "manual" ? (
                        <div className="opex-auth-stack">
                            <div className="opex-auth-stack">
                                <p className="opex-auth-panel-title">{msg("loginTotpManualStep2")}</p>
                                <div className="opex-auth-code-block" id="kc-totp-secret-key">
                                    {totp.totpSecretEncoded}
                                </div>
                                <button
                                    type="button"
                                    id="mode-barcode"
                                    className="opex-auth-text-button opex-auth-text-button--start"
                                    onClick={() => setCurrentMode("barcode")}
                                >
                                    {msg("loginTotpScanBarcode")}
                                </button>
                            </div>

                            <div className="opex-auth-stack">
                                <p className="opex-auth-panel-title">{msg("totpManualConfigurationTitle")}</p>
                                <ul className="opex-auth-detail-list">
                                    <li id="kc-totp-type">
                                        <strong>{msg("loginTotpType")}:</strong> {msg(`loginTotp.${totp.policy.type}`)}
                                    </li>
                                    <li id="kc-totp-digits">
                                        <strong>{msg("loginTotpDigits")}:</strong> {totp.policy.digits}
                                    </li>
                                    {totp.policy.type === "totp" ? (
                                        <li id="kc-totp-period">
                                            <strong>{msg("loginTotpInterval")}:</strong> {totp.policy.period}
                                        </li>
                                    ) : (
                                        <li id="kc-totp-counter">
                                            <strong>{msg("loginTotpCounter")}:</strong> {totp.policy.initialCounter}
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="opex-auth-stack">
                            <p className="opex-auth-panel-title">{msg("loginTotpStep2")}</p>
                            <div className="opex-auth-qr-frame">
                                <img
                                    id="kc-totp-secret-qr-code"
                                    src={`data:image/png;base64, ${totp.totpSecretQrCode}`}
                                    alt={msgStr("totpQrAlt")}
                                    className="opex-auth-qr-image"
                                />
                            </div>
                            <button
                                type="button"
                                id="mode-manual"
                                className="opex-auth-text-button opex-auth-text-button--start"
                                onClick={() => setCurrentMode("manual")}
                            >
                                {msg("loginTotpUnableToScan")}
                            </button>
                        </div>
                    )}
                </section>

                <form action={url.loginAction} className="opex-auth-form" id="kc-totp-settings-form" method="post">
                    <section className="opex-auth-panel">
                        <p className="opex-auth-panel-title">{msg("totpCodeTitle")}</p>

                        <div className={clsx(kcClsx("kcFormGroupClass"), "opex-auth-field", totpHasError && "opex-auth-field--error")}>
                            <input
                                type="text"
                                id="totp"
                                name="totp"
                                autoComplete="off"
                                className={kcClsx("kcInputClass")}
                                placeholder={msgStr("totpCodePlaceholder")}
                                aria-label={msgStr("authenticatorCode")}
                                aria-invalid={messagesPerField.existsError("totp")}
                            />
                            {messagesPerField.existsError("totp") && (
                                <span
                                    id="input-error-otp-code"
                                    className={kcClsx("kcInputErrorMessageClass")}
                                    aria-live="polite"
                                    dangerouslySetInnerHTML={{
                                        __html: kcSanitize(messagesPerField.get("totp"))
                                    }}
                                />
                            )}
                        </div>
                    </section>

                    <input type="hidden" id="totpSecret" name="totpSecret" value={totp.totpSecret} />
                    <input type="hidden" id="userLabel" name="userLabel" value="" />
                    {currentMode === "manual" && <input type="hidden" id="mode" name="mode" value="manual" />}

                    <div className="opex-auth-actions">
                        <input
                            type="submit"
                            className={kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonLargeClass")}
                            id="saveTOTPBtn"
                            value={msgStr("doSubmit")}
                        />

                        {!isAppInitiatedAction && (
                            <button
                                type="submit"
                                className={clsx(kcClsx("kcButtonClass", "kcButtonLargeClass"), "opex-auth-secondary-button")}
                                name="backToSecurityChoice"
                                value="true"
                            >
                                {msg("onboardingBack")}
                            </button>
                        )}

                        {isAppInitiatedAction && (
                            <button
                                type="submit"
                                className={clsx(kcClsx("kcButtonClass", "kcButtonLargeClass"), "opex-auth-secondary-button")}
                                id="cancelTOTPBtn"
                                name="cancel-aia"
                                value="true"
                            >
                                {msg("doCancel")}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </Template>
    );
}
