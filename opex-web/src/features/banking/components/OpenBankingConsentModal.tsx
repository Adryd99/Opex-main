import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('settings');
  const [previewSlug, setPreviewSlug] = useState<LegalDocumentSlug | null>(null);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-[6px]">
      <div className="w-full max-w-2xl rounded-[2.25rem] border border-white/70 bg-white/95 p-6 shadow-[0_32px_80px_-32px_rgba(15,23,42,0.45)] md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{t('bankingConsent.badge')}</p>
            <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{t('bankingConsent.title')}</h3>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
              {t('bankingConsent.description')}
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
            <p className="text-sm font-black text-slate-900">{t('bankingConsent.dataImported')}</p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
              {t('bankingConsent.dataImportedDescription')}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-black text-slate-900">{t('bankingConsent.thirdPartyProcessing')}</p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
              {t('bankingConsent.thirdPartyProcessingDescription')}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-5">
          <label className="flex items-start gap-4">
            <input
              type="checkbox"
              checked={acceptOpenBankingNotice}
              onChange={(event) => onAcceptOpenBankingNoticeChange(event.target.checked)}
              className="mt-1 h-5 w-5 min-h-5 min-w-5 shrink-0 rounded border-slate-300 text-opex-dark focus:ring-opex-dark"
              disabled={isSubmittingOpenBankingConsent}
            />
            <span>
              <span className="block text-base font-black text-slate-900">
                {t('bankingConsent.acceptNotice', { version: openBankingNoticeVersion || 'current' })}
              </span>
              <span className="mt-1 block text-sm font-medium leading-relaxed text-slate-500">
                {t('bankingConsent.acceptNoticeDescription')}
              </span>
              <span className="mt-2 block text-sm font-medium leading-relaxed text-slate-500">
                <button
                  type="button"
                  onClick={() => setPreviewSlug('open-banking')}
                  className="font-black text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                  disabled={isSubmittingOpenBankingConsent || !legalPublicInfo}
                >
                  {t('bankingConsent.readNotice')}
                </button>
              </span>
            </span>
          </label>
          <label className="flex items-start gap-4">
            <input
              type="checkbox"
              checked={acceptSaltEdgeTransfer}
              onChange={(event) => onAcceptSaltEdgeTransferChange(event.target.checked)}
              className="mt-1 h-5 w-5 min-h-5 min-w-5 shrink-0 rounded border-slate-300 text-opex-dark focus:ring-opex-dark"
              disabled={isSubmittingOpenBankingConsent}
            />
            <span>
              <span className="block text-base font-black text-slate-900">
                {t('bankingConsent.saltEdgeRedirect')}
              </span>
              <span className="mt-1 block text-sm font-medium leading-relaxed text-slate-500">
                {t('bankingConsent.saltEdgeRedirectDescription')}
              </span>
            </span>
          </label>
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-slate-50 px-5 py-4 text-sm font-medium leading-relaxed text-slate-500">
          {t('bankingConsent.legalAlreadyAccepted')}
        </div>

        {openBankingConsentError && (
          <p className="mt-5 text-sm font-bold text-red-600">{openBankingConsentError}</p>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="inline-flex h-12 items-center justify-center rounded-[1rem] border border-slate-200 bg-white px-5 text-sm font-black text-slate-500 transition-colors hover:border-slate-300 hover:text-opex-dark" disabled={isSubmittingOpenBankingConsent}>
            {t('bankingConsent.cancel')}
          </button>
          <button type="button" onClick={onSubmit} className="inline-flex h-12 items-center justify-center rounded-[1rem] bg-opex-dark px-5 text-sm font-black text-white disabled:opacity-60" disabled={isSubmittingOpenBankingConsent}>
            {isSubmittingOpenBankingConsent ? t('bankingConsent.opening') : t('bankingConsent.continueToSaltEdge')}
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
