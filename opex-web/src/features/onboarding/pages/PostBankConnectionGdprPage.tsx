import { useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { LegalPublicInfoRecord } from '../../../shared/types';
import { openLegalDocument } from '../../../shared/legal';

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

  const handleConfirm = () => {
    if (!accepted) {
      setFormError('Devi confermare il trattamento dei dati open banking per continuare.');
      return;
    }
    setFormError(null);
    onConfirm();
  };

  return (
    <div className="min-h-screen bg-[#f7f7f3] px-6 py-8 md:px-10 md:py-12 text-gray-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col justify-center">

        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-slate-200/70 text-opex-dark shadow-sm">
          <Building2 size={30} />
        </div>

        <h1 className="max-w-2xl text-4xl font-black tracking-tight text-opex-dark md:text-5xl">
          Conferma il trattamento dei dati bancari.
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-medium leading-relaxed text-slate-500 md:text-xl">
          La connessione con la tua banca è avvenuta con successo. Prima di importare conti e movimenti, conferma che autorizzi Opex a trattare i tuoi dati open banking.
        </p>

        <div className="mt-10 space-y-6 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-sm md:p-8">

          {legalPublicInfo.openBankingNotice.sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-opex-dark/60" />
                    <p className="text-sm font-medium leading-relaxed text-slate-600">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="border-t border-slate-100 pt-5">
            <label className="flex cursor-pointer items-start gap-4">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => {
                  setAccepted(e.target.checked);
                  if (formError) setFormError(null);
                }}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-opex-dark focus:ring-opex-dark"
                disabled={isSyncing}
              />
              <span className="space-y-1">
                <span className="block text-base font-black text-gray-900">
                  Autorizzo Opex a importare e trattare i miei dati open banking.
                </span>
                <span className="block text-sm font-medium leading-relaxed text-slate-500">
                  Questo include metadati di connessione, dettagli dei conti, saldi e movimenti della banca appena collegata. Informativa Open Banking v{legalPublicInfo.openBankingNotice.version}.
                </span>
              </span>
            </label>
          </div>

          <div className="rounded-[1.5rem] bg-slate-50 px-5 py-4 text-sm font-medium leading-relaxed text-slate-500">
            Leggi l&apos;{' '}
            <button
              type="button"
              onClick={() => openLegalDocument('open-banking')}
              className="font-black text-opex-dark hover:underline"
              disabled={isSyncing}
            >
              Informativa Open Banking completa
            </button>
            . Puoi disconnettere la banca in qualsiasi momento da{' '}
            <span className="font-black text-opex-dark">Impostazioni &gt; Banking</span>.
          </div>
        </div>

        {formError && (
          <p className="mt-6 text-sm font-bold text-red-600">{formError}</p>
        )}

        <div className="mt-10 flex flex-col-reverse gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-14 items-center justify-center rounded-[1.3rem] border border-slate-200 bg-white px-6 text-sm font-black text-slate-500 transition-colors hover:border-slate-300 hover:text-opex-dark disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSyncing}
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex h-16 flex-1 items-center justify-center rounded-[1.3rem] bg-opex-dark px-8 text-base font-black text-white shadow-[0_20px_40px_-20px_rgba(12,33,49,0.55)] transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSyncing}
          >
            {isSyncing ? (
              <span className="flex items-center gap-3">
                <Loader2 size={20} className="animate-spin" />
                Sincronizzazione...
              </span>
            ) : (
              'Conferma e sincronizza'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


