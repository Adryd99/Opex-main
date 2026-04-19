import { Fragment } from "react";
import { useScript } from "keycloakify/login/pages/LoginPasskeysConditionalAuthenticate.useScript";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

export default function LoginPasskeysConditionalAuthenticate(
    props: PageProps<Extract<KcContext, { pageId: "login-passkeys-conditional-authenticate.ftl" }>, I18n>
) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;
    const { url, usernameHidden, login, authenticators, shouldDisplayAuthenticators, realm, messagesPerField } = kcContext;
    const { msg, msgStr, advancedMsg } = i18n;

    const authButtonId = "authenticateWebAuthnButton";

    useScript({ authButtonId, kcContext, i18n });

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayInfo={false}
            headerNode={
                <>
                    <h1 id="kc-page-title">{msg("passkeyAuthTitle")}</h1>
                    <p className="opex-auth-description">{msg("passkeyAuthDescription")}</p>
                </>
            }
        >
            <form id="webauth" action={url.loginAction} method="post">
                <input type="hidden" id="clientDataJSON" name="clientDataJSON" />
                <input type="hidden" id="authenticatorData" name="authenticatorData" />
                <input type="hidden" id="signature" name="signature" />
                <input type="hidden" id="credentialId" name="credentialId" />
                <input type="hidden" id="userHandle" name="userHandle" />
                <input type="hidden" id="error" name="error" />
            </form>

            {realm.password && !usernameHidden && (
                <form id="kc-form-login" action={url.loginAction} method="post" style={{ display: "none" }}>
                    <input
                        id="username"
                        aria-invalid={messagesPerField.existsError("username")}
                        name="username"
                        defaultValue={login.username ?? ""}
                        autoComplete="username webauthn"
                        type="text"
                    />
                </form>
            )}

            {authenticators !== undefined && Object.keys(authenticators).length !== 0 && (
                <>
                    <form id="authn_select">
                        {authenticators.authenticators.map((authenticator, index) => (
                            <input key={index} type="hidden" name="authn_use_chk" readOnly value={authenticator.credentialId} />
                        ))}
                    </form>

                    {shouldDisplayAuthenticators && (
                        <section className="opex-auth-panel opex-auth-passkey-panel">
                            <p className="opex-auth-panel-title">{msg("passkeyAuthAvailableTitle")}</p>
                            <div className="opex-auth-method-list">
                                {authenticators.authenticators.map((authenticator, index) => (
                                    <div key={index} className="opex-auth-method-option opex-auth-passkey-option">
                                        <span className="opex-auth-passkey-icon" aria-hidden="true">
                                            &#128273;
                                        </span>
                                        <span className="opex-auth-method-option-copy">
                                            <strong className="opex-auth-method-option-title">{advancedMsg(authenticator.label)}</strong>
                                            {authenticator.transports?.displayNameProperties?.length ? (
                                                <span className="opex-auth-method-option-description">
                                                    {msg("passkeyAuthTransports")}:{" "}
                                                    {authenticator.transports.displayNameProperties.map((nameProperty, itemIndex, items) => (
                                                        <Fragment key={`${authenticator.credentialId}-${itemIndex}`}>
                                                            {advancedMsg(nameProperty)}
                                                            {itemIndex !== items.length - 1 && ", "}
                                                        </Fragment>
                                                    ))}
                                                </span>
                                            ) : null}
                                            <span className="opex-auth-method-option-description">
                                                {msg("passkeyAuthCreatedAt")}: {authenticator.createdAt}
                                            </span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}

            <div className="opex-auth-actions">
                <input
                    id={authButtonId}
                    type="button"
                    autoFocus
                    value={msgStr("passkey-doAuthenticate")}
                    className="kcButtonClass kcButtonPrimaryClass kcButtonBlockClass kcButtonLargeClass"
                />
            </div>
        </Template>
    );
}
