import { useState } from 'react';
import { X } from 'lucide-react';

import { LegalDocumentModal } from '../../legal';
import type { LegalDocumentSlug } from '../../../shared/legal';
import type { LegalPublicInfoRecord } from '../../../shared/types';

type OpenBankingConsentModalProps = {
  isOpen: boolean;
  legalPublicInfo: LegalPublicInfoRecord | null;
  openBankingNoticeVersion: string | null;
  acceptOpenBankingNotice: boolean;
  acceptSaltEdgeTransfer: boolean;
  openBankingConsentError: string | null;
  isSubmittingOpenBankingConsent: boolean;
  onClose: () => void;
  onAcceptOpenBankingNoticeChange: (value: boolean) => void;
  onAcceptSaltEdgeTransferChange: (value: boolean) => void;
  onSubmit: () => void;
};

export const OpenBankingConsentModal = ({
  isOpen,
  legalPublicInfo,
  openBankingNoticeVersion,
  acceptOpenBankingNotice,
  acceptSaltEdgeTransfer,
  openBankingConsentError,
  isSubmittingOpenBankingConsent,
  onClose,
  onAcceptOpenBankingNoticeChange,
  onAcceptSaltEdgeTransferChange,
  onSubmit
}: OpenBankingConsentModalProps) => {
  const [previewSlug, setPreviewSlug] = useState<LegalDocumentSlug | null>(null);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-[6px]">
      <div className="w-full max-w-2xl rounded-[2.25rem] border border-white/70 bg-white/95 p-6 shadow-[0_32px_80px_-32px_rgba(15,23,42,0.45)] md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Open Banking Notice</p>
            <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Review the banking data notice</h3>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
              Before Opex redirects you to Salt Edge, confirm that you understand what banking data will be imported and why.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-opex-dark"
            disabled={isSubmittingOpenBankingConsent}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-black text-slate-900">Data imported</p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
              Opex may import account identifiers, provider metadata, balances and transactions for the connected bank.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-black text-slate-900">Third-party processing</p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
              Salt Edge handles the authorization redirect and connection workflow with your bank.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-5">
          <label className="flex items-start gap-4">
            <input
              type="checkbox"
              checked={acceptOpenBankingNotice}
              onChange={(event) => onAcceptOpenBankingNoticeChange(event.target.checked)}
              className="mt-1 h-5 w-5 rounded border-slate-300 text-opex-dark focus:ring-opex-dark"
              disabled={isSubmittingOpenBankingConsent}
            />
            <span>
              <span className="block text-base font-black text-slate-900">
                I accept the Open Banking Notice v{openBankingNoticeVersion || 'current'}.
              </span>
              <span className="mt-1 block text-sm font-medium leading-relaxed text-slate-500">
                I understand how Opex will use connected banking data inside the product.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-4">
            <input
              type="checkbox"
              checked={acceptSaltEdgeTransfer}
              onChange={(event) => onAcceptSaltEdgeTransferChange(event.target.checked)}
              className="mt-1 h-5 w-5 rounded border-slate-300 text-opex-dark focus:ring-opex-dark"
              disabled={isSubmittingOpenBankingConsent}
            />
            <span>
              <span className="block text-base font-black text-slate-900">
                I authorize the redirect to Salt Edge for bank connection setup.
              </span>
              <span className="mt-1 block text-sm font-medium leading-relaxed text-slate-500">
                This specific flow is optional. You can keep using manual accounts if you prefer not to connect a bank.
              </span>
            </span>
          </label>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => setPreviewSlug('open-banking')}
            className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition-colors hover:border-slate-300 hover:text-opex-dark"
            disabled={isSubmittingOpenBankingConsent || !legalPublicInfo}
          >
            Open Banking Notice
          </button>
          <button
            type="button"
            onClick={() => setPreviewSlug('privacy')}
            className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition-colors hover:border-slate-300 hover:text-opex-dark"
            disabled={isSubmittingOpenBankingConsent || !legalPublicInfo}
          >
            Privacy Notice
          </button>
          <button
            type="button"
            onClick={() => setPreviewSlug('terms')}
            className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition-colors hover:border-slate-300 hover:text-opex-dark"
            disabled={isSubmittingOpenBankingConsent || !legalPublicInfo}
          >
            Terms
          </button>
        </div>

        {openBankingConsentError && (
          <p className="mt-5 text-sm font-bold text-red-600">{openBankingConsentError}</p>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="inline-flex h-12 items-center justify-center rounded-[1rem] border border-slate-200 bg-white px-5 text-sm font-black text-slate-500 transition-colors hover:border-slate-300 hover:text-opex-dark" disabled={isSubmittingOpenBankingConsent}>
            Cancel
          </button>
          <button type="button" onClick={onSubmit} className="inline-flex h-12 items-center justify-center rounded-[1rem] bg-opex-dark px-5 text-sm font-black text-white disabled:opacity-60" disabled={isSubmittingOpenBankingConsent}>
            {isSubmittingOpenBankingConsent ? 'Opening...' : 'Continue to Salt Edge'}
          </button>
        </div>
      </div>

      <LegalDocumentModal
        legalInfo={legalPublicInfo}
        slug={previewSlug}
        onClose={() => setPreviewSlug(null)}
      />
    </div>
  );
};
