import type { LegalDocumentPayload } from "../support/legalSupport";

export function LegalPreviewModal(props: {
    document: LegalDocumentPayload;
    fullPageUrl: string;
    onClose: () => void;
}) {
    const { document, fullPageUrl, onClose } = props;

    return (
        <div className="opex-auth-legal-modal-overlay" role="presentation">
            <div className="opex-auth-legal-modal-backdrop" onClick={onClose} />
            <div className="opex-auth-legal-modal" role="dialog" aria-modal="true" aria-labelledby="opex-legal-preview-title">
                <div className="opex-auth-legal-modal-header">
                    <div>
                        <p className="opex-auth-kicker">Legal preview</p>
                        <h2 id="opex-legal-preview-title" className="opex-auth-legal-modal-title">
                            {document.title}
                        </h2>
                        <p className="opex-auth-panel-copy">
                            {document.summary}
                        </p>
                    </div>

                    <div className="opex-auth-legal-modal-actions">
                        <a className="opex-auth-doc-link" href={fullPageUrl} target="_blank" rel="noreferrer">
                            Open full page
                        </a>
                        <button
                            type="button"
                            className="opex-auth-legal-close"
                            onClick={onClose}
                            aria-label="Close legal preview"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="opex-auth-legal-modal-body">
                    {document.sections.map(section => (
                        <section key={`${document.slug}-${section.title}`} className="opex-auth-panel opex-auth-legal-modal-section">
                            <p className="opex-auth-panel-title">{section.title}</p>
                            <div className="opex-auth-legal-bullets">
                                {section.bullets.map((bullet, index) => (
                                    <div key={`${section.title}-${index}`} className="opex-auth-legal-bullet">
                                        <span className="opex-auth-legal-bullet-dot" />
                                        <p className="opex-auth-panel-copy">{bullet}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
