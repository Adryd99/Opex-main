import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { BankAccountRecord } from '../../../shared/types';
import { TaxReserveSuggestion } from './TaxReserveSuggestion';
import { AccountCategory } from '../types';
import {
  ACCOUNT_CATEGORY_OPTIONS,
  formatBankBalance,
  resolveConnectionAccountName
} from '../utils';

type BankAccountEditViewProps = {
  account: BankAccountRecord | null;
  providerName: string;
  editAccountName: string;
  editAccountBalance: string;
  editAccountCurrency: string;
  editAccountCategory: AccountCategory;
  editIsTaxBuffer: boolean;
  isSavingAccount: boolean;
  accountEditError: string | null;
  onBack: () => void;
  onNameChange: (value: string) => void;
  onBalanceChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onCategoryChange: (value: AccountCategory) => void;
  onTaxBufferToggle: () => void;
  onSave: () => void;
};

export const BankAccountEditView = ({
  account,
  providerName,
  editAccountName,
  editAccountBalance,
  editAccountCurrency,
  editAccountCategory,
  editIsTaxBuffer,
  isSavingAccount,
  accountEditError,
  onBack,
  onNameChange,
  onBalanceChange,
  onCurrencyChange,
  onCategoryChange,
  onTaxBufferToggle,
  onSave
}: BankAccountEditViewProps) => {
  const { t } = useTranslation('settings');
  const isManualAccount = Boolean(account && !account.isSaltedge);
  const displayName = account
    ? resolveConnectionAccountName(account, providerName)
    : t('bankingEdit.fallbackTitle');

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-black text-app-secondary transition-colors hover:text-opex-dark dark:hover:text-opex-teal"
      >
        <ArrowLeft size={16} />
        {t('bankingEdit.backToBank')}
      </button>

      <div className="pt-1">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-app-tertiary">{t('bankingEdit.editAccount')}</p>
        <h2 className="mt-1.5 text-2xl font-black text-app-primary">{displayName}</h2>
        {account ? (
          <p className="mt-1 text-sm font-medium text-app-tertiary">
            {account.isSaltedge ? t('bankingEdit.liveSource') : t('bankingEdit.manualSource')}
            {' - '}
            {formatBankBalance(Number(account.balance ?? 0), account.currency)}
          </p>
        ) : null}
        <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-app-secondary">
          {t('bankingEdit.editAccountDescription')}
        </p>
      </div>

      <div className="space-y-3 rounded-[2rem] border border-app-border bg-app-surface p-6 shadow-sm transition-colors duration-200">
        <label className="block text-[11px] font-black uppercase tracking-[0.24em] text-app-tertiary">
          {t('bankingEdit.accountName')}
        </label>
        <input
          type="text"
          value={editAccountName}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={t('bankingEdit.accountNamePlaceholder')}
          className="w-full border-0 border-b-2 border-app-border bg-transparent pb-3 text-xl font-black text-app-primary placeholder:text-app-tertiary focus:border-opex-dark focus:outline-none focus:ring-0 dark:focus:border-opex-teal"
          disabled={isSavingAccount}
        />
        {isManualAccount ? (
          <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-app-tertiary">
                {t('bankingEdit.initialBalance')}
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={editAccountBalance}
                onChange={(event) => onBalanceChange(event.target.value)}
                className="w-full rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-sm font-bold text-app-primary outline-none focus:ring-2 focus:ring-opex-teal/10"
                disabled={isSavingAccount}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-app-tertiary">
                {t('bankingEdit.currency')}
              </label>
              <input
                value={editAccountCurrency}
                onChange={(event) => onCurrencyChange(event.target.value)}
                className="w-full rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-sm font-bold uppercase text-app-primary outline-none focus:ring-2 focus:ring-opex-teal/10"
                disabled={isSavingAccount}
                placeholder="EUR"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-4 rounded-[2rem] border border-app-border bg-app-surface p-6 shadow-sm transition-colors duration-200">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-app-tertiary">{t('bankingEdit.accountCategory')}</p>
        <div className="flex flex-wrap gap-3">
          {ACCOUNT_CATEGORY_OPTIONS.map((category) => {
            const categoryKey = category.toLowerCase();

            return (
              <button
                key={category}
                type="button"
                onClick={() => onCategoryChange(category)}
                disabled={isSavingAccount}
                className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all ${
                  editAccountCategory === category
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
          {t(`bankingEdit.categoryDescription.${editAccountCategory.toLowerCase()}`)}
        </p>
        <div className="rounded-[1.25rem] border border-app-border bg-app-muted px-4 py-3">
          <p className="text-xs font-medium leading-relaxed text-app-secondary">
            {t('bankingEdit.categoryHelperCopy')}
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-app-border bg-app-surface p-6 shadow-sm transition-colors duration-200">
        <p className="mb-5 text-[11px] font-black uppercase tracking-[0.24em] text-app-tertiary">{t('bankingEdit.fiscalSettings')}</p>
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
            aria-checked={editIsTaxBuffer}
            onClick={onTaxBufferToggle}
            disabled={isSavingAccount}
            className={`relative inline-flex h-7 w-14 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
              editIsTaxBuffer ? 'bg-opex-dark dark:bg-opex-teal' : 'bg-slate-200 dark:bg-app-border'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ${
                editIsTaxBuffer ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="mt-4 text-xs font-medium leading-relaxed text-app-tertiary">
          {t('bankingEdit.taxBufferHelper')}
        </p>
        {editAccountCategory === 'Savings' && !editIsTaxBuffer ? (
          <div className="mt-4">
            <TaxReserveSuggestion
              title={t('bankingEdit.savingsSuggestionTitle')}
              description={t('bankingEdit.savingsSuggestionDescription')}
              actionLabel={t('bankingEdit.savingsSuggestionAction')}
              onAccept={onTaxBufferToggle}
            />
          </div>
        ) : null}
        {editIsTaxBuffer && (
          <div className="mt-4 rounded-xl border border-opex-teal/10 bg-opex-teal/5 px-4 py-3 dark:border-opex-teal/20 dark:bg-opex-teal/10">
            <p className="text-xs font-black text-opex-teal dark:text-emerald-200">{t('bankingEdit.taxBufferEnabled')}</p>
            <p className="mt-0.5 text-xs font-medium text-app-secondary">
              {t('bankingEdit.taxBufferEnabledDescriptionCopy')}
            </p>
          </div>
        )}
      </div>

      {accountEditError && (
        <div className="rounded-[1.5rem] border border-red-100 bg-red-50 px-4 py-3 dark:border-red-400/20 dark:bg-red-500/10 transition-colors duration-200">
          <p className="text-sm font-bold text-red-600 dark:text-red-200">{accountEditError}</p>
        </div>
      )}

      <div className="pt-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isSavingAccount}
          className="inline-flex h-12 w-full items-center justify-center rounded-[1rem] bg-opex-dark px-5 text-sm font-black text-white shadow-[0_20px_40px_-20px_rgba(12,33,49,0.55)] transition-all hover:bg-slate-800 disabled:opacity-60 dark:bg-opex-teal dark:text-slate-950 dark:hover:bg-opex-teal/90"
        >
          {isSavingAccount ? t('bankingEdit.savingChanges') : t('bankingEdit.saveChanges')}
        </button>
      </div>
    </div>
  );
};
