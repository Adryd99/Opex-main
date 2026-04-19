import { clsx } from "keycloakify/tools/clsx";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { PasswordPolicies } from "keycloakify/login/KcContext";
import type { I18n } from "../i18n";

type Props = {
    i18n: I18n;
    passwordPolicies?: PasswordPolicies;
    password: string;
    passwordConfirm?: string;
    identifier?: string;
    isVisible: boolean;
    serverErrorHtml?: string;
    hasEditedSinceError?: boolean;
};

export function PasswordRequirements(props: Props) {
    const { i18n, passwordPolicies, password, passwordConfirm, identifier, isVisible, serverErrorHtml, hasEditedSinceError = false } = props;
    const { msg, msgStr } = i18n;

    if (!passwordPolicies || !isVisible) {
        return null;
    }

    const missingRequirements = buildMissingRequirements({
        msgStr,
        passwordPolicies,
        password,
        passwordConfirm,
        identifier,
        shouldTreatUntouchedPasswordAsInvalid: true
    });

    const shouldShowServerMessage = !!serverErrorHtml && missingRequirements.length === 0 && !hasEditedSinceError;

    if (missingRequirements.length === 0 && !shouldShowServerMessage) {
        return null;
    }

    return (
        <div className="opex-auth-password-requirements" aria-live="polite">
            <p className="opex-auth-password-requirements-title">{msg("passwordRequirementsTitle")}</p>

            {missingRequirements.length > 0 && (
                <ul className="opex-auth-password-requirements-list">
                    {missingRequirements.map(requirement => (
                        <li key={requirement.key} className={clsx("opex-auth-password-requirement", "opex-auth-password-requirement--missing")}>
                            <span className="opex-auth-password-requirement-indicator" aria-hidden>
                                x
                            </span>
                            <span className="opex-auth-password-requirement-label">{requirement.label}</span>
                        </li>
                    ))}
                </ul>
            )}

            {shouldShowServerMessage && (
                <span
                    className="kcInputErrorMessageClass"
                    aria-live="polite"
                    dangerouslySetInnerHTML={{
                        __html: kcSanitize(serverErrorHtml)
                    }}
                />
            )}
        </div>
    );
}

function buildMissingRequirements(params: {
    msgStr: I18n["msgStr"];
    passwordPolicies: PasswordPolicies;
    password: string;
    passwordConfirm?: string;
    identifier?: string;
    shouldTreatUntouchedPasswordAsInvalid: boolean;
}): { key: string; label: string }[] {
    const { msgStr, passwordPolicies, password, passwordConfirm, identifier, shouldTreatUntouchedPasswordAsInvalid } = params;
    const hasTypedPassword = password.length > 0;
    const requirements: { key: string; label: string }[] = [];

    if (passwordPolicies.length !== undefined) {
        maybePushRequirement(
            requirements,
            "length",
            msgStr("passwordRequirementMinLength", String(passwordPolicies.length)),
            password.length < passwordPolicies.length || (!hasTypedPassword && shouldTreatUntouchedPasswordAsInvalid)
        );
    }

    if (passwordPolicies.lowerCase !== undefined) {
        maybePushRequirement(
            requirements,
            "lowerCase",
            msgStr("passwordRequirementLowerCase", String(passwordPolicies.lowerCase)),
            countMatches(password, /[a-z]/g) < passwordPolicies.lowerCase || (!hasTypedPassword && shouldTreatUntouchedPasswordAsInvalid)
        );
    }

    if (passwordPolicies.upperCase !== undefined) {
        maybePushRequirement(
            requirements,
            "upperCase",
            msgStr("passwordRequirementUpperCase", String(passwordPolicies.upperCase)),
            countMatches(password, /[A-Z]/g) < passwordPolicies.upperCase || (!hasTypedPassword && shouldTreatUntouchedPasswordAsInvalid)
        );
    }

    if (passwordPolicies.digits !== undefined) {
        maybePushRequirement(
            requirements,
            "digits",
            msgStr("passwordRequirementDigit", String(passwordPolicies.digits)),
            countMatches(password, /\d/g) < passwordPolicies.digits || (!hasTypedPassword && shouldTreatUntouchedPasswordAsInvalid)
        );
    }

    if (passwordPolicies.specialChars !== undefined) {
        maybePushRequirement(
            requirements,
            "specialChars",
            msgStr("passwordRequirementSpecial", String(passwordPolicies.specialChars)),
            countMatches(password, /[^A-Za-z0-9]/g) < passwordPolicies.specialChars || (!hasTypedPassword && shouldTreatUntouchedPasswordAsInvalid)
        );
    }

    if (passwordPolicies.notUsername && identifier) {
        maybePushRequirement(
            requirements,
            "notUsername",
            msgStr("passwordRequirementDifferentFromIdentifier"),
            (!hasTypedPassword && shouldTreatUntouchedPasswordAsInvalid) || normalize(password) === normalize(identifier)
        );
    }

    if (passwordConfirm !== undefined && passwordConfirm.length > 0 && password.length > 0 && password !== passwordConfirm) {
        requirements.push({
            key: "passwordConfirm",
            label: msgStr("passwordRequirementMatch")
        });
    }

    return requirements;
}

function maybePushRequirement(
    requirements: { key: string; label: string }[],
    key: string,
    label: string,
    shouldInclude: boolean
) {
    if (shouldInclude) {
        requirements.push({ key, label });
    }
}

function countMatches(value: string, pattern: RegExp): number {
    return value.match(pattern)?.length ?? 0;
}

function normalize(value: string): string {
    return value.trim().toLowerCase();
}
