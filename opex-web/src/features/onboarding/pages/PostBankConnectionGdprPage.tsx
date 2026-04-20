import { useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LegalDocumentModal } from '../../legal';
import { LegalPublicInfoRecord } from '../../../shared/types';
import type { LegalDocumentSlug } from '../../../shared/legal';

export const PostBankConnectionGdprPage = ({
  legalPublicInfo,
  onConfirm,
  onCancel,
  isSyncing
}: {
  legalPublicInfo: LegalPublicInfoRecord;
  onConfirm: () => void;
  onCancel: () => void;
  isSyncing: boolean;
}) => {
  const [accepted, setAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewSlug, setPreviewSlug] = useState<LegalDocumentSlug | null>(null);

  const handleConfirm = () => {
    if (!accepted) {
      setFormError('Devi confermare il trattamento dei dati open banking per continuare.');
      return;
    }

    setFormError(null);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-[6px] dark:bg-slate-950/55">
      <div className="w-full max-w-2xl rounded-[2.25rem] border border-white/70 bg-white/95 p-6 shadow-[0_32px_80px_-32px_rgba(15,23,42,0.45)] md:p-8 dark:border-app-border dark:bg-app-surface/95">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-app-muted text-app-primary shadow-sm transition-colors duration-200">
            <Building2 size={30} />
          </div>

          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.24em] text-app-tertiary">
            Open Banking
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-app-primary md:text-5xl">
            Conferma il trattamento dei dati bancari.
          </h1>
          <p className="mt-4 text-base font-medium leading-relaxed text-app-secondary md:text-lg">
            La connessione con la tua banca è avvenuta con successo. Prima di importare conti e movimenti,
            conferma che autorizzi Opex a trattare i tuoi dati open banking.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-app-border bg-app-muted p-5 transition-colors duration-200">
              <p className="text-sm font-black text-app-primary">Cosa importiamo</p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-app-secondary">
                Opex può importare metadati di connessione, dettagli dei conti, saldi e movimenti della banca che hai appena collegato.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-app-border bg-app-muted p-5 transition-colors duration-200">
              <p className="text-sm font-black text-app-primary">Come usiamo i dati</p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-app-secondary">
                I dati bancari collegati servono per popolare dashboard, setup account, budget, storico movimenti e viste fiscali.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-app-border bg-app-muted p-5 transition-colors duration-200 md:col-span-2">
              <p className="text-sm font-black text-app-primary">Rinnovo del consenso</p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-app-secondary">
                Il consenso open banking può scadere in base alle regole della tua banca o del provider, quindi Opex potrebbe chiederti di rinnovarlo periodicamente.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4 rounded-[1.75rem] border border-app-border bg-app-surface p-5 transition-colors duration-200">
            <label className="flex cursor-pointer items-start gap-4">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => {
                  setAccepted(event.target.checked);
                  if (formError) {
                    setFormError(null);
                  }
                }}
                className="mt-1 h-5 w-5 min-h-5 min-w-5 shrink-0 rounded border-slate-300 text-opex-dark focus:ring-opex-dark"
                disabled={isSyncing}
              />
              <span>
                <span className="block text-base font-black text-app-primary">
                  Autorizzo Opex a importare e trattare i miei dati open banking.
                </span>
                <span className="mt-1 block text-sm font-medium leading-relaxed text-app-secondary">
                  Questo include metadati di connessione, dettagli dei conti, saldi e movimenti della banca appena collegata.
                  Informativa Open Banking v{legalPublicInfo.openBankingNotice.version}.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-4 rounded-[1.5rem] bg-app-muted px-5 py-4 text-sm font-medium leading-relaxed text-app-secondary transition-colors duration-200">
            Leggi l&apos;{' '}
            <button
              type="button"
              onClick={() => setPreviewSlug('open-banking')}
              className="font-black text-blue-600 transition-colors hover:text-blue-700 hover:underline"
              disabled={isSyncing}
            >
              Informativa Open Banking completa
            </button>
            . Puoi disconnettere la banca in qualsiasi momento da{' '}
            <span className="font-black text-app-primary">Impostazioni &gt; Banche e conti</span>.
          </div>

          {formError && (
            <p className="mt-5 text-sm font-bold text-red-600 dark:text-red-200">{formError}</p>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-12 items-center justify-center rounded-[1rem] border border-app-border bg-app-surface px-5 text-sm font-black text-app-secondary transition-colors hover:border-slate-300 hover:text-opex-dark disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-app-tertiary/50 dark:hover:text-opex-teal"
              disabled={isSyncing}
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex h-12 items-center justify-center rounded-[1rem] bg-opex-dark px-5 text-sm font-black text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-opex-teal dark:text-slate-950"
              disabled={isSyncing}
            >
              {isSyncing ? (
                <span className="flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin" />
                  Sincronizzazione...
                </span>
              ) : (
                'Conferma e sincronizza'
              )}
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

export const PostBankConnectionSuccessOverlay = ({
  bankName,
  importedAccountCount,
  onReviewAccounts,
  onDoLater
}: {
  bankName: string;
  importedAccountCount: number;
  onReviewAccounts: () => void;
  onDoLater: () => void;
}) => {
  const { t } = useTranslation('banking');

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-[6px] dark:bg-slate-950/55">
      <div className="w-full max-w-2xl rounded-[2.25rem] border border-white/70 bg-white/95 p-6 shadow-[0_32px_80px_-32px_rgba(15,23,42,0.45)] md:p-8 dark:border-app-border dark:bg-app-surface/95">
        <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-app-muted text-app-primary shadow-sm transition-colors duration-200">
          <Building2 size={30} />
        </div>

        <p className="mt-6 text-[11px] font-black uppercase tracking-[0.24em] text-app-tertiary">
          {t('postSync.badge')}
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-app-primary md:text-5xl">
          {t('postSync.title')}
        </h1>
        <p className="mt-4 text-base font-medium leading-relaxed text-app-secondary md:text-lg">
          {t('postSync.description', { count: importedAccountCount, bank: bankName })}
        </p>

        <div className="mt-8 rounded-[1.75rem] border border-app-border bg-app-muted p-5 transition-colors duration-200">
          <p className="text-sm font-black text-app-primary">
            {t('postSync.importedAccountsSummary', { count: importedAccountCount })}
          </p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-app-secondary">
            {t('postSync.summaryHelper')}
          </p>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDoLater}
            className="inline-flex h-12 items-center justify-center rounded-[1rem] border border-app-border bg-app-surface px-5 text-sm font-black text-app-secondary transition-colors hover:border-slate-300 hover:text-opex-dark dark:hover:border-app-tertiary/50 dark:hover:text-opex-teal"
          >
            {t('postSync.secondaryAction')}
          </button>
          <button
            type="button"
            onClick={onReviewAccounts}
            className="inline-flex h-12 items-center justify-center rounded-[1rem] bg-opex-dark px-5 text-sm font-black text-white transition-colors hover:bg-slate-800 dark:bg-opex-teal dark:text-slate-950"
          >
            {t('postSync.primaryAction')}
          </button>
        </div>
      </div>
    </div>
  );
};
