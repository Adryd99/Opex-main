import type { DeepPartial } from "keycloakify/tools/DeepPartial";
import type { KcContext } from "./KcContext";
import KcPage from "./KcPage";
import { createGetKcContextMock } from "keycloakify/login/KcContext";
import type { KcContextExtension, KcContextExtensionPerPage } from "./KcContext";
import { themeNames, kcEnvDefaults } from "../kc.gen";

const kcContextExtension: KcContextExtension = {
    themeName: themeNames[0],
    properties: {
        ...kcEnvDefaults
    }
};
const kcContextExtensionPerPage: KcContextExtensionPerPage = {
    "login-update-password.ftl": {
        opexCurrentPasswordRequired: true
    },
    "login-update-profile.ftl": {
        profileBasicsShowFirstNameField: true,
        profileBasicsShowLastNameField: true,
        profileBasicsShowBirthDateField: true,
        profileBasicsBrokeredGoogleLogin: false,
        profileBasicsCurrentFirstName: "Daniele",
        profileBasicsCurrentLastName: "Caporaletti",
        profileBasicsCurrentBirthDate: "1990-01-01"
    },
    "security-setup-choice.ftl": {
        currentSecuritySetupChoice: "later"
    },
    "country-selection.ftl": {
        currentCountry: "IT",
        allowedCountries: ["IT", "NL", "BE", "DE"]
    },
    "occupation.ftl": {
        currentOccupation: "Freelance designer",
        occupationMaxLength: 100
    },
    "legal-acceptance.ftl": {
        privacyUrl: "http://localhost:3000/legal/privacy",
        termsUrl: "http://localhost:3000/legal/terms",
        cookiesUrl: "http://localhost:3000/legal/cookies",
        legalApiUrl: "http://localhost:8080/api/legal/public",
        currentCookieChoice: "accept",
        strictlyNecessaryChecked: false
    }
};

export const { getKcContextMock } = createGetKcContextMock({
    kcContextExtension,
    kcContextExtensionPerPage,
    overrides: {},
    overridesPerPage: {}
});

export function createKcPageStory<PageId extends KcContext["pageId"]>(params: {
    pageId: PageId;
}) {
    const { pageId } = params;

    function KcPageStory(props: {
        kcContext?: DeepPartial<Extract<KcContext, { pageId: PageId }>>;
    }) {
        const { kcContext: overrides } = props;

        const kcContextMock = getKcContextMock({
            pageId,
            overrides
        });

        return <KcPage kcContext={kcContextMock} />;
    }

    return { KcPageStory };
}
