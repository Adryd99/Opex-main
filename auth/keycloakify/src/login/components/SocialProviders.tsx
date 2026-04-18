import type { KcClsx } from "keycloakify/login/lib/kcClsx";
import type { I18n } from "../i18n";

type SocialProvider = {
    loginUrl: string;
    alias: string;
    providerId: string;
    displayName: string;
    iconClasses?: string;
};

type SocialProvidersProps = {
    social:
        | {
              providers?: SocialProvider[];
          }
        | undefined;
    kcClsx: KcClsx;
    i18n: I18n;
};

function GoogleIcon() {
    return (
        <svg viewBox="0 0 48 48" aria-hidden="true" className="opex-auth-google-icon-svg">
            <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.262 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.842 1.154 7.96 3.04l5.657-5.657C34.05 6.053 29.279 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917Z"
            />
            <path
                fill="#FF3D00"
                d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.96 3.04l5.657-5.657C34.05 6.053 29.279 4 24 4c-7.682 0-14.347 4.337-17.694 10.691Z"
            />
            <path
                fill="#4CAF50"
                d="M24 44c5.177 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.143 35.153 26.684 36 24 36c-5.241 0-9.618-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44Z"
            />
            <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.05 12.05 0 0 1-4.084 5.571h-.003l6.19 5.238C36.971 39.204 44 34 44 24c0-1.341-.138-2.65-.389-3.917Z"
            />
        </svg>
    );
}

function getProviderLabel(provider: SocialProvider, msg: I18n["msg"]) {
    if (provider.alias === "google") {
        return msg("signInWithGoogle");
    }

    return `${msg("continueWithProviderPrefix")} ${provider.displayName}`;
}

export function SocialProviders(props: SocialProvidersProps) {
    const { social, i18n } = props;
    const { msg } = i18n;

    if (social?.providers === undefined || social.providers.length === 0) {
        return null;
    }

    return (
        <div id="kc-social-providers" className="opex-auth-social">
            <div className="opex-auth-divider">
                <span>{msg("socialDividerLabel")}</span>
            </div>
            <ul className="opex-auth-social-list">
                {social.providers.map(provider => (
                    <li key={provider.alias} className="opex-auth-social-item">
                        <a
                            id={`social-${provider.alias}`}
                            className="opex-auth-social-button"
                            type="button"
                            href={provider.loginUrl}
                        >
                            <span className="opex-auth-social-icon-wrap" aria-hidden="true">
                                {provider.alias === "google" ? (
                                    <GoogleIcon />
                                ) : (
                                    <span className="opex-auth-social-icon">
                                        <span className="opex-auth-social-icon-letter">{provider.displayName.slice(0, 1)}</span>
                                    </span>
                                )}
                            </span>
                            <span className="opex-auth-social-copy">
                                <span className="opex-auth-social-label">{getProviderLabel(provider, msg)}</span>
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
