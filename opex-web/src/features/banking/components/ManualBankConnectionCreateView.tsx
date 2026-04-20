import { Building2, Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../../shared/ui';

type ManualBankConnectionCreateViewProps = {
  providerName: string;
  errorMessage: string | null;
  isSaving: boolean;
  onBack: () => void;
  onProviderNameChange: (value: string) => void;
  onSubmit: () => void;
};

export const ManualBankConnectionCreateView = ({
  providerName,
  errorMessage,
  isSaving,
  onBack,
  onProviderNameChange,
  onSubmit
}: ManualBankConnectionCreateViewProps) => {
  const { t } = useTranslation('settings');

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-black text-app-secondary transition-colors hover:text-opex-dark dark:hover:text-opex-teal"
      >
        {t('manualBankCreate.backToSources')}
      </button>

      <div className="rounded-[2rem] border border-app-border bg-app-surface p-6 shadow-sm transition-colors duration-200">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.5rem] bg-app-muted text-app-primary shadow-sm">
            <Landmark size={26} />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-app-tertiary">
              {t('manualBankCreate.badge')}
            </p>
            <h3 className="text-2xl font-black tracking-tight text-app-primary">
              {t('manualBankCreate.title')}
            </h3>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-app-secondary">
              {t('manualBankCreate.description')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 rounded-[2rem] border border-app-border bg-app-surface p-6 shadow-sm transition-colors duration-200">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.22em] text-app-tertiary">
            {t('manualBankCreate.nameLabel')}
          </label>
          <input
            value={providerName}
            onChange={(event) => onProviderNameChange(event.target.value)}
            className="w-full rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-sm font-bold text-app-primary outline-none focus:ring-2 focus:ring-opex-teal/10"
            placeholder={t('manualBankCreate.namePlaceholder')}
            autoFocus
          />
        </div>

        <div className="rounded-[1.5rem] border border-app-border bg-app-muted px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-app-surface text-app-secondary">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-app-primary">{t('manualBankCreate.helperTitle')}</p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-app-secondary">
                {t('manualBankCreate.helperDescription')}
              </p>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <p className="text-sm font-bold text-red-600 dark:text-red-200">{errorMessage}</p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" size="lg" onClick={onBack} disabled={isSaving}>
            {t('manualBankCreate.cancel')}
          </Button>
          <Button size="lg" onClick={onSubmit} disabled={isSaving}>
            {isSaving ? t('manualBankCreate.creating') : t('manualBankCreate.create')}
          </Button>
        </div>
      </div>
    </div>
  );
};
