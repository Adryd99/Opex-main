import "./main.css";
import logoUrl from "./assets/Opes_compact_dark.png";
import { useEffect } from "react";
import { clsx } from "keycloakify/tools/clsx";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { TemplateProps } from "keycloakify/login/TemplateProps";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import { useSetClassName } from "keycloakify/tools/useSetClassName";
import { useInitialize } from "keycloakify/login/Template.useInitialize";
import type { I18n } from "./i18n";
import type { KcContext } from "./KcContext";

const OPEX_AUTH_LOCALE_STORAGE_KEY = "opex_auth_locale";

export default function Template(props: TemplateProps<KcContext, I18n>) {
    const {
        displayInfo = false,
        displayMessage = true,
        displayRequiredFields = false,
        headerNode,
        socialProvidersNode = null,
        infoNode = null,
        documentTitle,
        bodyClassName,
        kcContext,
        i18n,
        doUseDefaultCss,
        classes,
        children
    } = props;

    const { kcClsx } = getKcClsx({ doUseDefaultCss, classes });
    const { msg, msgStr, currentLanguage, enabledLanguages } = i18n;
    const { realm, auth, url, message, isAppInitiatedAction } = kcContext;
    const isSecondaryAuthPage = [
        "login-otp.ftl",
        "login-recovery-authn-code-input.ftl",
        "select-authenticator.ftl",
        "login-passkeys-conditional-authenticate.ftl",
        "webauthn-authenticate.ftl"
    ].includes(kcContext.pageId);
    const onboardingProgressSteps = getOnboardingProgressSteps(msgStr);
    const localeOptions = enabledLanguages
        .filter(({ languageTag }) => ["it", "en"].includes(languageTag))
        .sort((a, b) => getLocaleOrder(a.languageTag) - getLocaleOrder(b.languageTag));

    useEffect(() => {
        document.title = documentTitle ?? msgStr("loginTitle", realm.displayName);
        document.documentElement.lang = currentLanguage.languageTag === "it" ? "it-IT" : "en-US";
    }, [currentLanguage.languageTag, documentTitle, msgStr, realm.displayName]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const requestedLocale = new URLSearchParams(window.location.search).get("kc_locale");
        const preferredLocale = window.localStorage.getItem(OPEX_AUTH_LOCALE_STORAGE_KEY);
        const targetLocale = preferredLocale ?? "it";

        const targetOption = localeOptions.find(({ languageTag }) => languageTag === targetLocale);
        if (targetOption === undefined) {
            return;
        }

        if (requestedLocale !== null) {
            window.localStorage.setItem(OPEX_AUTH_LOCALE_STORAGE_KEY, requestedLocale);
            return;
        }

        if (currentLanguage.languageTag !== targetLocale) {
            window.location.replace(targetOption.href);
            return;
        }

        window.localStorage.setItem(OPEX_AUTH_LOCALE_STORAGE_KEY, targetLocale);
    }, [currentLanguage.languageTag, localeOptions]);

    useSetClassName({
        qualifiedName: "html",
        className: kcClsx("kcHtmlClass")
    });

    useSetClassName({
        qualifiedName: "body",
        className: bodyClassName ?? kcClsx("kcBodyClass")
    });

    const { isReadyToRender } = useInitialize({ kcContext, doUseDefaultCss });
    const onboardingProgressIndex = getOnboardingProgressIndex(kcContext.pageId);
    const showOnboardingProgress = onboardingProgressIndex !== null && !isAppInitiatedAction;

    if (!isReadyToRender) {
        return null;
    }

    return (
        <div className={clsx(kcClsx("kcLoginClass"), "opex-auth-shell")}>
            <main className="opex-auth-main">
                <section className={clsx(kcClsx("kcFormCardClass"), "opex-auth-card")}>
                    <header className={clsx(kcClsx("kcFormHeaderClass"), "opex-auth-card-header")}>
                        {localeOptions.length > 1 && (
                            <div className="opex-auth-topbar">
                                <nav className="opex-auth-language-switch" aria-label={msgStr("languageSwitchLabel")}>
                                    {localeOptions.map(({ languageTag, label, href }) => (
                                        <a
                                            key={languageTag}
                                            href={href}
                                            hrefLang={languageTag}
                                            lang={languageTag}
                                            onClick={() => {
                                                if (typeof window !== "undefined") {
                                                    window.localStorage.setItem(OPEX_AUTH_LOCALE_STORAGE_KEY, languageTag);
                                                }
                                            }}
                                            className={clsx(
                                                "opex-auth-language-switch-link",
                                                currentLanguage.languageTag === languageTag && "opex-auth-language-switch-link--active"
                                            )}
                                            aria-current={currentLanguage.languageTag === languageTag ? "true" : undefined}
                                        >
                                            {label}
                                        </a>
                                    ))}
                                </nav>
                            </div>
                        )}

                        <div className="opex-auth-brand-lockup">
                            <img src={logoUrl} alt="Opes Capital" className="opex-auth-logo" />
                        </div>

                        {showOnboardingProgress && (
                            <div className="opex-auth-progress" aria-label={msgStr("progressAriaLabel")}>
                                <div className="opex-auth-progress-meta">
                                    <span className="opex-auth-progress-caption">
                                        {msg("progressStepCounter", String(onboardingProgressIndex + 1), String(onboardingProgressSteps.length))}
                                    </span>
                                </div>
                                <div className="opex-auth-progress-track">
                                    {onboardingProgressSteps.map((step, index) => (
                                        <div
                                            key={step}
                                            className={clsx(
                                                "opex-auth-progress-node",
                                                index < onboardingProgressIndex && "opex-auth-progress-node--complete",
                                                index === onboardingProgressIndex && "opex-auth-progress-node--current"
                                            )}
                                        >
                                            <span className="opex-auth-progress-dot" />
                                            <span className="opex-auth-progress-label">{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!(auth !== undefined && auth.showUsername && !auth.showResetCredentials) ? (
                            <div className="opex-auth-heading">{headerNode}</div>
                        ) : isSecondaryAuthPage ? (
                            <>
                                <div className="opex-auth-heading">{headerNode}</div>
                                <div id="kc-username" className={clsx(kcClsx("kcFormGroupClass"), "opex-auth-context-card")}>
                                    <div className="opex-auth-context-copy">
                                        <span className="opex-auth-context-label">{msg("signedInAs")}</span>
                                        <strong id="kc-attempted-username" className="opex-auth-context-value">
                                            {auth.attemptedUsername}
                                        </strong>
                                    </div>
                                    <a
                                        id="reset-login"
                                        className="opex-auth-context-action"
                                        href={url.loginRestartFlowUrl}
                                        aria-label={msgStr("restartLoginTooltip")}
                                    >
                                        <i className={kcClsx("kcResetFlowIcon")}></i>
                                        <span>{msg("restartLoginTooltip")}</span>
                                    </a>
                                </div>
                            </>
                        ) : (
                            <div id="kc-username" className={clsx(kcClsx("kcFormGroupClass"), "opex-auth-username")}>
                                <label id="kc-attempted-username">{auth.attemptedUsername}</label>
                                <a id="reset-login" href={url.loginRestartFlowUrl} aria-label={msgStr("restartLoginTooltip")}>
                                    <div className="opex-auth-tooltip">
                                        <i className={kcClsx("kcResetFlowIcon")}></i>
                                        <span>{msg("restartLoginTooltip")}</span>
                                    </div>
                                </a>
                            </div>
                        )}

                        {displayRequiredFields && (
                            <div className="opex-auth-required-note">
                                <span className="required">*</span>
                                {msg("requiredFields")}
                            </div>
                        )}
                    </header>

                    <div id="kc-content" className="opex-auth-card-content">
                        <div id="kc-content-wrapper">
                            {displayMessage && message !== undefined && (message.type !== "warning" || !isAppInitiatedAction) && (
                                <div
                                    className={clsx(
                                        `alert-${message.type}`,
                                        kcClsx("kcAlertClass"),
                                        `pf-m-${message.type === "error" ? "danger" : message.type}`,
                                        "opex-auth-alert"
                                    )}
                                >
                                    <div className="pf-c-alert__icon">
                                        {message.type === "success" && <span className={kcClsx("kcFeedbackSuccessIcon")}></span>}
                                        {message.type === "warning" && <span className={kcClsx("kcFeedbackWarningIcon")}></span>}
                                        {message.type === "error" && <span className={kcClsx("kcFeedbackErrorIcon")}></span>}
                                        {message.type === "info" && <span className={kcClsx("kcFeedbackInfoIcon")}></span>}
                                    </div>
                                    <span
                                        className={kcClsx("kcAlertTitleClass")}
                                        dangerouslySetInnerHTML={{
                                            __html: kcSanitize(message.summary)
                                        }}
                                    />
                                </div>
                            )}

                            <div className="opex-auth-form-slot">{children}</div>

                            {auth !== undefined && auth.showTryAnotherWayLink && (
                                <form id="kc-select-try-another-way-form" action={url.loginAction} method="post">
                                    <div className={clsx(kcClsx("kcFormGroupClass"), "opex-auth-try-another-way")}>
                                        <input type="hidden" name="tryAnotherWay" value="on" />
                                        <a
                                            href="#"
                                            id="try-another-way"
                                            className="opex-auth-inline-link"
                                            onClick={event => {
                                                event.preventDefault();
                                                document.forms["kc-select-try-another-way-form" as never].requestSubmit();
                                            }}
                                        >
                                            {msg("doTryAnotherWay")}
                                        </a>
                                    </div>
                                </form>
                            )}

                            {displayInfo && (
                                <div id="kc-info" className={clsx(kcClsx("kcSignUpClass"), "opex-auth-info")}>
                                    <div id="kc-info-wrapper" className={kcClsx("kcInfoAreaWrapperClass")}>
                                        {infoNode}
                                    </div>
                                </div>
                            )}

                            {socialProvidersNode}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function getOnboardingProgressSteps(msgStr: I18n["msgStr"]) {
    return [
        msgStr("progressStepAccount"),
        msgStr("progressStepSecurity"),
        msgStr("progressStepProfile"),
        msgStr("progressStepLocation"),
        msgStr("progressStepOccupation"),
        msgStr("progressStepLegal")
    ];
}

function getLocaleOrder(languageTag: string) {
    switch (languageTag) {
        case "it":
            return 0;
        case "en":
            return 1;
        default:
            return 99;
    }
}

function getOnboardingProgressIndex(pageId: KcContext["pageId"]): number | null {
    switch (pageId) {
        case "register.ftl":
            return 0;
        case "security-setup-choice.ftl":
        case "login-config-totp.ftl":
        case "webauthn-register.ftl":
            return 1;
        case "login-update-profile.ftl":
            return 2;
        case "country-selection.ftl":
            return 3;
        case "occupation.ftl":
            return 4;
        case "legal-acceptance.ftl":
            return 5;
        default:
            return null;
    }
}
