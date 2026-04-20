import { ArrowLeft, Landmark, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AccountCategory } from '../types';
import { ACCOUNT_CATEGORY_OPTIONS } from '../utils';
import { TaxReserveSuggestion } from './TaxReserveSuggestion';
import { Button } from '../../../shared/ui';

type ManualBankAccountCreateViewProps = {
  bankName: string;
  accountName: string;
  balance: string;
  currency: string;
  accountCategory: AccountCategory;
  isTaxBuffer: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  onBack: () => void;
  onAccountNameChange: (value: string) => void;
  onBalanceChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onCategoryChange: (value: AccountCategory) => void;
  onTaxBufferToggle: () => void;
  onSubmit: () => void;
};

export const ManualBankAccountCreateView = ({
  bankName,
  accountName,
  balance,
  currency,
  accountCategory,
  isTaxBuffer,
  isSaving,
  errorMessage,
  onBack,
  onAccountNameChange,
  onBalanceChange,
  onCurrencyChange,
  onCategoryChange,
  onTaxBufferToggle,
  onSubmit
}: ManualBankAccountCreateViewProps) => {
  const { t } = useTranslation('settings');

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-black text-app-secondary transition-colors hover:text-opex-dark dark:hover:text-opex-teal"
      >
        <ArrowLeft size={16} />
        {t('manualAccountCreate.backToBank')}
      </button>

      <div className="rounded-[2rem] border border-app-border bg-app-surface p-6 shadow-sm transition-colors duration-200">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.5rem] bg-app-muted text-app-primary shadow-sm">
            <Wallet size={26} />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-app-tertiary">
              {t('manualAccountCreate.badge')}
            </p>
            <h3 className="text-2xl font-black tracking-tight text-app-primary">
              {t('manualAccountCreate.title')}
            </h3>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-app-secondary">
              {t('manualAccountCreate.description', { bank: bankName })}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-[2rem] border border-app-border bg-app-surface p-6 shadow-sm transition-colors duration-200">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.22em] text-app-tertiary">
            {t('manualAccountCreate.accountNameLabel')}
          </label>
          <input
            value={accountName}
            onChange={(event) => onAccountNameChange(event.target.value)}
            className="w-full rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-sm font-bold text-app-primary outline-none focus:ring-2 focus:ring-opex-teal/10"
            placeholder={t('manualAccountCreate.accountNamePlaceholder')}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.22em] text-app-tertiary">
              {t('manualAccountCreate.initialBalanceLabel')}
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={balance}
              onChange={(event) => onBalanceChange(event.target.value)}
              className="w-full rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-sm font-bold text-app-primary outline-none focus:ring-2 focus:ring-opex-teal/10"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.22em] text-app-tertiary">
              {t('manualAccountCreate.currencyLabel')}
            </label>
            <input
              value={currency}
              onChange={(event) => onCurrencyChange(event.target.value)}
              className="w-full rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-sm font-bold uppercase text-app-primary outline-none focus:ring-2 focus:ring-opex-teal/10"
              placeholder="EUR"
            />
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-app-border bg-app-muted px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-app-surface text-app-secondary">
              <Landmark size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-app-primary">{t('manualAccountCreate.helperTitle')}</p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-app-secondary">
                {t('manualAccountCreate.helperDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-[2rem] border border-app-border bg-app-surface p-6 shadow-sm transition-colors duration-200">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-app-tertiary">
          {t('bankingEdit.accountCategory')}
        </p>
        <div className="flex flex-wrap gap-3">
          {ACCOUNT_CATEGORY_OPTIONS.map((category) => {
            const categoryKey = category.toLowerCase();

            return (
              <button
                key={category}
                type="button"
                onClick={() => onCategoryChange(category)}
                disabled={isSaving}
                className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all ${
                  accountCategory === category
                    ? 'bg-opex-dark text-white shadow-md dark:bg-opex-teal dark:text-slate-950'
                    : 'border border-app-border bg-app-muted text-app-secondary hover:border-gray-300 hover:bg-gray-100 dark:hover:border-app-tertiary/50 dark:hover:bg-app-surface'
                }`}
              >
                {t(`bankingEdit.categoryLabel.${categoryKey}`)}
              </button>
            );
          })}
        </div>
        <p className="text-xs font-medium text-app-tertiary">
          {t(`bankingEdit.categoryDescription.${accountCategory.toLowerCase()}`)}
        </p>
      </div>

      <div className="rounded-[2rem] border border-app-border bg-app-surface p-6 shadow-sm transition-colors duration-200">
        <p className="mb-5 text-[11px] font-black uppercase tracking-[0.24em] text-app-tertiary">
          {t('bankingEdit.fiscalSettings')}
        </p>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-base font-black text-app-primary">{t('bankingEdit.taxBufferTitle')}</p>
            <p className="mt-1 max-w-sm text-sm font-medium text-app-secondary">
              {t('bankingEdit.taxBufferDescription')}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isTaxBuffer}
            onClick={onTaxBufferToggle}
            disabled={isSaving}
            className={`relative inline-flex h-7 w-14 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
              isTaxBuffer ? 'bg-opex-dark dark:bg-opex-teal' : 'bg-slate-200 dark:bg-app-border'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ${
                isTaxBuffer ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="mt-4 text-xs font-medium leading-relaxed text-app-tertiary">
          {t('bankingEdit.taxBufferHelper')}
        </p>
        {accountCategory === 'Savings' && !isTaxBuffer ? (
          <div className="mt-4">
            <TaxReserveSuggestion
              title={t('bankingEdit.savingsSuggestionTitle')}
              description={t('bankingEdit.savingsSuggestionDescription')}
              actionLabel={t('bankingEdit.savingsSuggestionAction')}
              onAccept={onTaxBufferToggle}
            />
          </div>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="text-sm font-bold text-red-600 dark:text-red-200">{errorMessage}</p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" size="lg" onClick={onBack} disabled={isSaving}>
          {t('manualAccountCreate.cancel')}
        </Button>
        <Button size="lg" onClick={onSubmit} disabled={isSaving}>
          {isSaving ? t('manualAccountCreate.creating') : t('manualAccountCreate.create')}
        </Button>
      </div>
    </div>
  );
};
