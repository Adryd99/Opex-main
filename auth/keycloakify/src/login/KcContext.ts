/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { ExtendKcContext } from "keycloakify/login";
import type { KcEnvName, ThemeName } from "../kc.gen";

export type KcContextExtension = {
    themeName: ThemeName;
    properties: Record<KcEnvName, string> & {};
    // NOTE: Here you can declare more properties to extend the KcContext
    // See: https://docs.keycloakify.dev/faq-and-help/some-values-you-need-are-missing-from-in-kccontext
};

export type KcContextExtensionPerPage = {
    "login-update-password.ftl": {
        opexCurrentPasswordRequired?: boolean;
    };
    "login-update-profile.ftl": {
        profileBasicsShowFirstNameField?: boolean;
        profileBasicsShowLastNameField?: boolean;
        profileBasicsShowBirthDateField?: boolean;
        profileBasicsBrokeredGoogleLogin?: boolean;
        profileBasicsCurrentFirstName?: string;
        profileBasicsCurrentLastName?: string;
        profileBasicsCurrentBirthDate?: string;
    };
    "security-setup-choice.ftl": {
        currentSecuritySetupChoice?: string;
    };
    "country-selection.ftl": {
        currentCountry?: string;
        allowedCountries: string[];
    };
    "occupation.ftl": {
        currentOccupation?: string;
        occupationMaxLength: number;
    };
    "legal-acceptance.ftl": {
        privacyUrl: string;
        termsUrl: string;
        cookiesUrl: string;
        legalApiUrl: string;
        currentCookieChoice?: string;
        strictlyNecessaryChecked?: boolean;
    };
};

export type KcContext = ExtendKcContext<KcContextExtension, KcContextExtensionPerPage>;
