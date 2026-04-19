import { useMemo, useState } from "react";
import { clsx } from "keycloakify/tools/clsx";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../../KcContext";
import type { I18n } from "../../i18n";

export default function LoginRecoveryAuthnCodeConfig(
    props: PageProps<Extract<KcContext, { pageId: "login-recovery-authn-code-config.ftl" }>, I18n>
) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });

    const { recoveryAuthnCodesConfigBean, url, isAppInitiatedAction } = kcContext;
    const { msg, msgStr } = i18n;
    const [hasConfirmedStorage, setHasConfirmedStorage] = useState(false);

    const formattedRecoveryCodes = useMemo(
        () =>
            recoveryAuthnCodesConfigBean.generatedRecoveryAuthnCodesList.map((code, index) => ({
                id: index + 1,
                value: formatRecoveryCode(code)
            })),
        [recoveryAuthnCodesConfigBean.generatedRecoveryAuthnCodesList]
    );

    const plainTextCodes = useMemo(
        () => formattedRecoveryCodes.map(code => `${code.id}: ${code.value}`).join("\n"),
        [formattedRecoveryCodes]
    );

    const downloadContent = useMemo(
        () =>
            [
                msgStr("recovery-codes-download-file-header"),
                "",
                plainTextCodes,
                "",
                msgStr("recovery-codes-download-file-description"),
                "",
                `${msgStr("recovery-codes-download-file-date")} ${formatCurrentDateTime()}`
            ].join("\n"),
        [msgStr, plainTextCodes]
    );

    const handleCopy = async () => {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(plainTextCodes);
                return;
            }
        } catch {
            // Fall back to the textarea-based copy flow below.
        }

        const fallbackTextarea = document.createElement("textarea");
        fallbackTextarea.value = plainTextCodes;
        fallbackTextarea.setAttribute("readonly", "true");
        fallbackTextarea.style.position = "absolute";
        fallbackTextarea.style.left = "-9999px";
        document.body.appendChild(fallbackTextarea);
        fallbackTextarea.select();
        document.execCommand("copy");
        document.body.removeChild(fallbackTextarea);
    };

    const handleDownload = () => {
        const downloadBlob = new Blob([downloadContent], {
            type: "text/plain;charset=utf-8"
        });
        const downloadUrl = window.URL.createObjectURL(downloadBlob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "opex-recovery-codes.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
    };

    const handlePrint = () => {
        const printWindow = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
        if (printWindow === null) {
            return;
        }

        const listMarkup = formattedRecoveryCodes
            .map(
                code => `
                    <li>
                        <span>${code.id}</span>
                        <strong>${code.value}</strong>
                    </li>
                `
            )
            .join("");

        printWindow.document.write(`
            <html>
                <head>
                    <title>Opes recovery codes</title>
                    <style>
                        body {
                            margin: 0;
                            padding: 40px;
                            color: #0c2131;
                            font-family: Inter, Arial, sans-serif;
                            background: #f7f7f3;
                        }
                        h1 {
                            margin: 0 0 10px;
                            font-size: 30px;
                            line-height: 1;
                        }
                        p {
                            margin: 0 0 28px;
                            font-size: 14px;
                            line-height: 1.6;
                            color: #667684;
                        }
                        ol {
                            margin: 0;
                            padding: 0;
                            list-style: none;
                            display: grid;
                            grid-template-columns: repeat(2, minmax(0, 1fr));
                            gap: 12px 16px;
                        }
                        li {
                            display: grid;
                            grid-template-columns: auto 1fr;
                            gap: 12px;
                            align-items: center;
                            padding: 14px 16px;
                            border: 1px solid #d7dce1;
                            border-radius: 16px;
                            background: #ffffff;
                        }
                        span {
                            font-size: 12px;
                            font-weight: 800;
                            color: #667684;
                        }
                        strong {
                            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                            font-size: 14px;
                            font-weight: 800;
                            letter-spacing: 0.08em;
                        }
                    </style>
                </head>
                <body>
                    <h1>${escapeHtml(msgStr("recoveryCodesTitle"))}</h1>
                    <p>${escapeHtml(msgStr("recoveryCodesDescription"))}</p>
                    <ol>${listMarkup}</ol>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            headerNode={
                <>
                    <p className="opex-auth-kicker">{msg("recoveryCodesEyebrow")}</p>
                    <h1 id="kc-page-title">{msg("recoveryCodesTitle")}</h1>
                    <p className="opex-auth-description">{msg("recoveryCodesDescription")}</p>
                </>
            }
        >
            <div className="opex-auth-recovery-stack">
                <section className="opex-auth-recovery-alert" aria-label={msgStr("recovery-code-config-warning-title")}>
                    <div className="opex-auth-recovery-alert-icon" aria-hidden>
                        !
                    </div>
                    <div className="opex-auth-recovery-alert-copy">
                        <p className="opex-auth-recovery-alert-title">{msg("recovery-code-config-warning-title")}</p>
                        <p className="opex-auth-recovery-alert-body">{msg("recovery-code-config-warning-message")}</p>
                    </div>
                </section>

                <section className="opex-auth-recovery-sheet">
                    <div className="opex-auth-recovery-sheet-header">
                        <div className="opex-auth-recovery-sheet-copy">
                            <h2>{msg("recoveryCodesListTitle")}</h2>
                            <p>{msg("recoveryCodesListDescription", String(formattedRecoveryCodes.length))}</p>
                        </div>

                        <div className="opex-auth-recovery-actions" aria-label={msgStr("recoveryCodesActionsLabel")}>
                            <button type="button" className="opex-auth-recovery-action" onClick={handlePrint}>
                                {msg("recovery-codes-print")}
                            </button>
                            <button type="button" className="opex-auth-recovery-action" onClick={handleDownload}>
                                {msg("recovery-codes-download")}
                            </button>
                            <button type="button" className="opex-auth-recovery-action" onClick={handleCopy}>
                                {msg("recovery-codes-copy")}
                            </button>
                        </div>
                    </div>

                    <ol className="opex-auth-recovery-grid">
                        {formattedRecoveryCodes.map(code => (
                            <li key={code.id} className="opex-auth-recovery-code">
                                <span className="opex-auth-recovery-code-index">{code.id}</span>
                                <strong className="opex-auth-recovery-code-value">{code.value}</strong>
                            </li>
                        ))}
                    </ol>
                </section>

                <form action={url.loginAction} className="opex-auth-form" id="kc-recovery-codes-settings-form" method="post">
                    <input type="hidden" name="generatedRecoveryAuthnCodes" value={recoveryAuthnCodesConfigBean.generatedRecoveryAuthnCodesAsString} />
                    <input type="hidden" name="generatedAt" value={recoveryAuthnCodesConfigBean.generatedAt} />
                    <input type="hidden" id="userLabel" name="userLabel" value={msgStr("recovery-codes-label-default")} />

                    <div className="opex-auth-recovery-options">
                        <label className="opex-auth-checkbox-control">
                            <input
                                type="checkbox"
                                id="kcRecoveryCodesConfirmationCheck"
                                name="kcRecoveryCodesConfirmationCheck"
                                checked={hasConfirmedStorage}
                                onChange={event => setHasConfirmedStorage(event.target.checked)}
                            />
                            <span>{msg("recovery-codes-confirmation-message")}</span>
                        </label>

                        <label className="opex-auth-checkbox-control">
                            <input type="checkbox" id="logout-sessions" name="logout-sessions" value="on" />
                            <span>{msg("logoutOtherSessions")}</span>
                        </label>
                    </div>

                    <div className="opex-auth-actions">
                        <input
                            type="submit"
                            className={kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonBlockClass", "kcButtonLargeClass")}
                            id="saveRecoveryAuthnCodesBtn"
                            value={msgStr("recovery-codes-action-complete")}
                            disabled={!hasConfirmedStorage}
                        />

                        {isAppInitiatedAction && (
                            <button
                                type="submit"
                                className={clsx(kcClsx("kcButtonClass", "kcButtonLargeClass"), "opex-auth-secondary-button")}
                                id="cancelRecoveryAuthnCodesBtn"
                                name="cancel-aia"
                                value="true"
                            >
                                {msg("recovery-codes-action-cancel")}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </Template>
    );
}

function formatRecoveryCode(code: string) {
    if (code.length <= 8) {
        return code;
    }

    return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;
}

function formatCurrentDateTime() {
    return new Intl.DateTimeFormat(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short"
    }).format(new Date());
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
