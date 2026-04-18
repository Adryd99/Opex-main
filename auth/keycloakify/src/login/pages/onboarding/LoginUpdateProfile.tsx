import type { JSX } from "keycloakify/tools/JSX";
import { useEffect, useMemo, useState } from "react";
import type { LazyOrNot } from "keycloakify/tools/LazyOrNot";
import { clsx } from "keycloakify/tools/clsx";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { UserProfileFormFieldsProps } from "keycloakify/login/UserProfileFormFieldsProps";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

type LoginUpdateProfileProps = PageProps<Extract<KcContext, { pageId: "login-update-profile.ftl" }>, I18n> & {
    UserProfileFormFields: LazyOrNot<(props: UserProfileFormFieldsProps) => JSX.Element>;
    doMakeUserConfirmPassword: boolean;
};

export default function LoginUpdateProfile(props: LoginUpdateProfileProps) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });

    const { messagesPerField, profile, url, isAppInitiatedAction } = kcContext;
    const { msg, msgStr, currentLanguage } = i18n;
    const showFirstNameField = kcContext.profileBasicsShowFirstNameField ?? true;
    const showLastNameField = kcContext.profileBasicsShowLastNameField ?? true;
    const showBirthDateField = kcContext.profileBasicsShowBirthDateField ?? true;
    const profileAttributes = profile?.attributesByName ?? {};

    const firstNameAttribute = profileAttributes.firstName;
    const lastNameAttribute = profileAttributes.lastName;
    const emailAttribute = profileAttributes.email;
    const usernameAttribute = profileAttributes.username;
    const birthDateAttribute = profileAttributes.birthDate;
    const currentFirstName = kcContext.profileBasicsCurrentFirstName ?? firstNameAttribute?.value ?? "";
    const currentLastName = kcContext.profileBasicsCurrentLastName ?? lastNameAttribute?.value ?? "";
    const currentBirthDate = kcContext.profileBasicsCurrentBirthDate ?? birthDateAttribute?.value ?? "";

    const [firstName, setFirstName] = useState(currentFirstName);
    const [lastName, setLastName] = useState(currentLastName);
    const [birthDate, setBirthDate] = useState(currentBirthDate);
    const [birthDateDisplay, setBirthDateDisplay] = useState(() =>
        formatBirthDateForDisplay(currentBirthDate, currentLanguage.languageTag)
    );

    const maxBirthDate = useMemo(() => {
        const now = new Date();
        const maxDate = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
        return maxDate.toISOString().slice(0, 10);
    }, []);
    useEffect(() => {
        setBirthDateDisplay(formatBirthDateForDisplay(birthDate, currentLanguage.languageTag));
    }, [birthDate, currentLanguage.languageTag]);

    const hasBirthDateInput = birthDateDisplay.trim() !== "";
    const isBirthDateValid = useMemo(() => {
        if (birthDate === "") {
            return false;
        }

        return birthDate <= maxBirthDate;
    }, [birthDate, maxBirthDate]);

    const isFirstNameValid = !showFirstNameField || (firstName.trim() !== "" && firstName.length <= 100);
    const isLastNameValid = !showLastNameField || (lastName.trim() !== "" && lastName.length <= 100);
    const isBirthDateFieldValid = !showBirthDateField || isBirthDateValid;
    const isFormSubmittable = isFirstNameValid && isLastNameValid && isBirthDateFieldValid;
    const firstNameHasError = messagesPerField.existsError("firstName");
    const lastNameHasError = messagesPerField.existsError("lastName");
    const birthDateHasError = messagesPerField.existsError("birthDate") || (hasBirthDateInput && !isBirthDateValid);

    const handleBirthDateChange = (rawValue: string) => {
        const normalizedDisplayValue = normalizeBirthDateInput(rawValue);
        const nextBirthDate = parseBirthDateInput(normalizedDisplayValue, currentLanguage.languageTag);

        setBirthDateDisplay(normalizedDisplayValue);
        setBirthDate(nextBirthDate ?? "");
    };

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
                    <h1 id="kc-page-title">{msg("profileTitle")}</h1>
                </>
            }
        >
            <form id="kc-update-profile-form" className="opex-auth-form" action={url.loginAction} method="post">
                {emailAttribute !== undefined && <input type="hidden" name="email" value={emailAttribute.value ?? ""} />}
                {usernameAttribute !== undefined && <input type="hidden" name="username" value={usernameAttribute.value ?? ""} />}
                {!showFirstNameField && <input type="hidden" name="firstName" value={firstName} />}
                {!showLastNameField && <input type="hidden" name="lastName" value={lastName} />}
                <input type="hidden" name="birthDate" value={birthDate} />

                {(showFirstNameField || showLastNameField) && (
                    <div className="opex-auth-split-fields">
                        {showFirstNameField && (
                            <div className={clsx("opex-auth-field", firstNameHasError && "opex-auth-field--error")}>
                                <label htmlFor="firstName" className={kcClsx("kcLabelClass")}>
                                    {msg("firstName")}
                                </label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    className={kcClsx("kcInputClass")}
                                    placeholder={msgStr("profileFirstNamePlaceholder")}
                                    value={firstName}
                                    onChange={event => setFirstName(event.target.value)}
                                    maxLength={100}
                                    aria-invalid={messagesPerField.existsError("firstName")}
                                    required
                                />
                                {messagesPerField.existsError("firstName") && (
                                    <span className={kcClsx("kcInputErrorMessageClass")} aria-live="polite">
                                        {messagesPerField.getFirstError("firstName")}
                                    </span>
                                )}
                            </div>
                        )}

                        {showLastNameField && (
                            <div className={clsx("opex-auth-field", lastNameHasError && "opex-auth-field--error")}>
                                <label htmlFor="lastName" className={kcClsx("kcLabelClass")}>
                                    {msg("lastName")}
                                </label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    className={kcClsx("kcInputClass")}
                                    placeholder={msgStr("profileLastNamePlaceholder")}
                                    value={lastName}
                                    onChange={event => setLastName(event.target.value)}
                                    maxLength={100}
                                    aria-invalid={messagesPerField.existsError("lastName")}
                                    required
                                />
                                {messagesPerField.existsError("lastName") && (
                                    <span className={kcClsx("kcInputErrorMessageClass")} aria-live="polite">
                                        {messagesPerField.getFirstError("lastName")}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {showBirthDateField && (
                    <div className={clsx("opex-auth-field", birthDateHasError && "opex-auth-field--error")}>
                        <label htmlFor="birthDate" className={kcClsx("kcLabelClass")}>
                            {msg("profileBirthDateLabel")}
                        </label>
                        <input
                            id="birthDate"
                            type="text"
                            className={kcClsx("kcInputClass")}
                            value={birthDateDisplay}
                            onChange={event => handleBirthDateChange(event.target.value)}
                            placeholder={msgStr("profileBirthDatePlaceholder")}
                            inputMode="numeric"
                            autoComplete="bday"
                            maxLength={10}
                            aria-invalid={messagesPerField.existsError("birthDate") || (hasBirthDateInput && !isBirthDateValid)}
                            required
                        />
                        {messagesPerField.existsError("birthDate") ? (
                            <span className={kcClsx("kcInputErrorMessageClass")} aria-live="polite">
                                {messagesPerField.getFirstError("birthDate")}
                            </span>
                        ) : (
                            hasBirthDateInput &&
                            !isBirthDateValid && (
                                <span className={kcClsx("kcInputErrorMessageClass")} aria-live="polite">
                                    {msg("profileMinimumAgeError")}
                                </span>
                            )
                        )}
                    </div>
                )}

                <div className="opex-auth-actions">
                    <input
                        disabled={!isFormSubmittable}
                        className={kcClsx(
                            "kcButtonClass",
                            "kcButtonPrimaryClass",
                            !isAppInitiatedAction && "kcButtonBlockClass",
                            "kcButtonLargeClass"
                        )}
                        type="submit"
                        value={msgStr("doSubmit")}
                    />
                    {isAppInitiatedAction && (
                        <button
                            className={`${kcClsx("kcButtonClass", "kcButtonLargeClass")} opex-auth-secondary-button`}
                            type="submit"
                            name="cancel-aia"
                            value="true"
                            formNoValidate
                        >
                            {msg("doCancel")}
                        </button>
                    )}
                </div>

                <div className="opex-auth-step-nav opex-auth-step-nav--single">
                    <button type="submit" name="navigateBack" value="true" className="opex-auth-text-button opex-auth-text-button--start" formNoValidate>
                        {msg("onboardingBack")}
                    </button>
                </div>
            </form>
        </Template>
    );
}

function normalizeBirthDateInput(rawValue: string) {
    const digits = rawValue.replace(/\D/g, "").slice(0, 8);
    const firstPart = digits.slice(0, 2);
    const secondPart = digits.slice(2, 4);
    const thirdPart = digits.slice(4, 8);

    return [firstPart, secondPart, thirdPart].filter(Boolean).join("/");
}

function formatBirthDateForDisplay(isoBirthDate: string, languageTag: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoBirthDate)) {
        return "";
    }

    const [year, month, day] = isoBirthDate.split("-");
    return languageTag === "it" ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
}

function parseBirthDateInput(displayValue: string, languageTag: string) {
    const digits = displayValue.replace(/\D/g, "");

    if (digits.length !== 8) {
        return null;
    }

    const [month, day, year] =
        languageTag === "it"
            ? [digits.slice(2, 4), digits.slice(0, 2), digits.slice(4, 8)]
            : [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)];

    const isoBirthDate = `${year}-${month}-${day}`;
    const parsedDate = new Date(`${isoBirthDate}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    const [parsedYear, parsedMonth, parsedDay] = [
        parsedDate.getFullYear(),
        String(parsedDate.getMonth() + 1).padStart(2, "0"),
        String(parsedDate.getDate()).padStart(2, "0")
    ];

    if (`${parsedYear}-${parsedMonth}-${parsedDay}` !== isoBirthDate) {
        return null;
    }

    return isoBirthDate;
}
