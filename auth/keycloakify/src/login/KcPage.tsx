import "./main.css";
import { Suspense, lazy } from "react";
import type { ClassKey } from "keycloakify/login";
import type { KcContext } from "./KcContext";
import { useI18n } from "./i18n";
import DefaultPage from "keycloakify/login/DefaultPage";
import Template from "./Template";

const CountrySelection = lazy(() => import("./pages/onboarding/CountrySelection"));
const Info = lazy(() => import("./pages/system/Info"));
const UserProfileFormFields = lazy(() => import("./components/UserProfileFormFields"));
const Login = lazy(() => import("./pages/auth/Login"));
const LoginIdpLinkConfirm = lazy(() => import("./pages/auth/LoginIdpLinkConfirm"));
const LoginIdpLinkEmail = lazy(() => import("./pages/auth/LoginIdpLinkEmail"));
const LoginConfigTotp = lazy(() => import("./pages/onboarding/LoginConfigTotp"));
const LoginResetPassword = lazy(() => import("./pages/auth/LoginResetPassword"));
const LoginUpdateProfile = lazy(() => import("./pages/onboarding/LoginUpdateProfile"));
const LoginVerifyEmail = lazy(() => import("./pages/auth/LoginVerifyEmail"));
const LegalAcceptance = lazy(() => import("./pages/onboarding/LegalAcceptance"));
const LogoutConfirm = lazy(() => import("./pages/system/LogoutConfirm"));
const Occupation = lazy(() => import("./pages/onboarding/Occupation"));
const Register = lazy(() => import("./pages/auth/Register"));
const SecuritySetupChoice = lazy(() => import("./pages/onboarding/SecuritySetupChoice"));
const Terms = lazy(() => import("./pages/system/Terms"));
const WebauthnRegister = lazy(() => import("./pages/onboarding/WebauthnRegister"));

const doMakeUserConfirmPassword = true;

export default function KcPage(props: { kcContext: KcContext }) {
    const { kcContext } = props;

    const { i18n } = useI18n({ kcContext });

    const classes = {
        kcButtonClass: "",
        kcButtonPrimaryClass: "",
        kcButtonBlockClass: "",
        kcButtonLargeClass: "",
        kcHtmlClass: "",
        kcFormPasswordVisibilityButtonClass: "",
    } satisfies { [key in ClassKey]?: string };

    return (
        <Suspense>
            {(() => {
                switch (kcContext.pageId) {
                    case "login.ftl": return (
                        <Login
                            {...{ kcContext, i18n, classes }}
                            Template={Template}
                            doUseDefaultCss={true}
                        />
                    );

                    case "register.ftl": return (
                        <Register
                            {...{ kcContext, i18n, classes }}
                            Template={Template}
                            doUseDefaultCss={true}
                            UserProfileFormFields={UserProfileFormFields}
                            doMakeUserConfirmPassword={doMakeUserConfirmPassword}
                        />
                    );

                    case "info.ftl": return (
                        <Info
                            {...{ kcContext, i18n, classes }}
                            Template={Template}
                            doUseDefaultCss={true}
                        />
                    );

                    case "login-config-totp.ftl": return (
                        <LoginConfigTotp
                            {...{ kcContext, i18n, classes }}
                            Template={Template}
                            doUseDefaultCss={true}
                        />
                    );

                    case "login-reset-password.ftl": return (
                        <LoginResetPassword
                            {...{ kcContext, i18n, classes }}
                            Template={Template}
                            doUseDefaultCss={true}
                        />
                    );

                    case "login-idp-link-confirm.ftl": return (
                        <LoginIdpLinkConfirm
                            {...{ kcContext, i18n, classes }}
                            Template={Template}
                            doUseDefaultCss={true}
                        />
                    );

                    case "login-idp-link-email.ftl": return (
                        <LoginIdpLinkEmail
                            {...{ kcContext, i18n, classes }}
                            Template={Template}
                            doUseDefaultCss={true}
                        />
                    );

                    case "login-verify-email.ftl": return (
                        <LoginVerifyEmail
                            {...{ kcContext, i18n, classes }}
                            Template={Template}
                            doUseDefaultCss={true}
                        />
                    );

                    case "login-update-profile.ftl": return (
                        <LoginUpdateProfile
                            {...{ kcContext, i18n, classes }}
                            Template={Template}
                            doUseDefaultCss={true}
                            UserProfileFormFields={UserProfileFormFields}
                            doMakeUserConfirmPassword={doMakeUserConfirmPassword}
                        />
                    );

                    case "security-setup-choice.ftl": return (
                        <SecuritySetupChoice
                            {...{ kcContext, i18n, classes }}
                            Template={Template}
                            doUseDefaultCss={true}
                        />
                    );

                    case "country-selection.ftl": return (
                        <CountrySelection
                            {...{ kcContext, i18n, classes }}
                            Template={Template}
                            doUseDefaultCss={true}
                        />
                    );

                    case "occupation.ftl": return (
                        <Occupation
                            {...{ kcContext, i18n, classes }}
                            Template={Template}
                            doUseDefaultCss={true}
                        />
                    );

                    case "legal-acceptance.ftl": return (
                        <LegalAcceptance
                            {...{ kcContext, i18n, classes }}
                            Template={Template}
                            doUseDefaultCss={true}
                        />
                    );

                    case "logout-confirm.ftl": return (
                        <LogoutConfirm
                            {...{ kcContext, i18n, classes }}
                            Template={Template}
                            doUseDefaultCss={true}
                        />
                    );

                    case "terms.ftl": return (
                        <Terms
                            {...{ kcContext, i18n, classes }}
                            Template={Template}
                            doUseDefaultCss={true}
                        />
                    );

                    case "webauthn-register.ftl": return (
                        <WebauthnRegister
                            {...{ kcContext, i18n, classes }}
                            Template={Template}
                            doUseDefaultCss={true}
                        />
                    );

                    default:
                        return (
                            <DefaultPage
                                kcContext={kcContext}
                                i18n={i18n}
                                classes={classes}
                                Template={Template}
                                doUseDefaultCss={true}
                                UserProfileFormFields={UserProfileFormFields}
                                doMakeUserConfirmPassword={doMakeUserConfirmPassword}
                            />
                        );
                }
            })()}
        </Suspense>
    );
}

