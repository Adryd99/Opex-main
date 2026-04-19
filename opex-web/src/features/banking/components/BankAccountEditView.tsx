import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { BankAccountRecord } from '../../../shared/types';
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
  editAccountCategory: AccountCategory;
  editIsTaxBuffer: boolean;
  isSavingAccount: boolean;
  accountEditError: string | null;
  onBack: () => void;
  onNameChange: (value: string) => void;
  onCategoryChange: (value: AccountCategory) => void;
  onTaxBufferToggle: () => void;
  onSave: () => void;
};

export const BankAccountEditView = ({
  account,
  providerName,
  editAccountName,
  editAccountCategory,
  editIsTaxBuffer,
  isSavingAccount,
  accountEditError,
  onBack,
  onNameChange,
  onCategoryChange,
  onTaxBufferToggle,
  onSave
}: BankAccountEditViewProps) => {
  const { t } = useTranslation('settings');
  const displayName = account
    ? resolveConnectionAccountName(account, providerName)
    : t('bankingEdit.fallbackTitle');

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-black text-gray-500 hover:text-opex-dark transition-colors"
      >
        <ArrowLeft size={16} />
        {t('bankingEdit.backToConnection')}
      </button>

      <div className="pt-1">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{t('bankingEdit.editAccount')}</p>
        <h2 className="mt-1.5 text-2xl font-black text-opex-dark">{displayName}</h2>
        {account ? (
          <p className="mt-1 text-sm font-medium text-slate-400">
            {account.isSaltedge ? t('bankingEdit.liveSource') : t('bankingEdit.localSource')}
            {' - '}
            {formatBankBalance(Number(account.balance ?? 0), account.currency)}
          </p>
        ) : null}
      </div>

      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm space-y-3">
        <label className="block text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
          {t('bankingEdit.accountName')}
        </label>
        <input
          type="text"
          value={editAccountName}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={t('bankingEdit.accountNamePlaceholder')}
          className="w-full border-0 border-b-2 border-slate-200 bg-transparent pb-3 text-xl font-black text-opex-dark placeholder:text-slate-300 focus:border-opex-dark focus:outline-none focus:ring-0"
          disabled={isSavingAccount}
        />
      </div>

      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{t('bankingEdit.accountCategory')}</p>
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
                    ? 'bg-opex-dark text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 border border-gray-100 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                {t(`bankingEdit.categoryLabel.${categoryKey}`)}
              </button>
            );
          })}
        </div>
        <p className="text-xs font-medium text-slate-400">
          {t(`bankingEdit.categoryDescription.${editAccountCategory.toLowerCase()}`)}
        </p>
      </div>

      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 mb-5">{t('bankingEdit.fiscalSettings')}</p>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-base font-black text-gray-900">{t('bankingEdit.taxBufferTitle')}</p>
            <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm">
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
              editIsTaxBuffer ? 'bg-opex-dark' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ${
                editIsTaxBuffer ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {editIsTaxBuffer && (
          <div className="mt-4 rounded-xl bg-opex-teal/5 border border-opex-teal/10 px-4 py-3">
            <p className="text-xs font-black text-opex-teal">{t('bankingEdit.taxBufferEnabled')}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {t('bankingEdit.taxBufferEnabledDescription')}
            </p>
          </div>
        )}
      </div>

      {accountEditError && (
        <div className="rounded-[1.5rem] border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm font-bold text-red-600">{accountEditError}</p>
        </div>
      )}

      <div className="pt-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isSavingAccount}
          className="inline-flex h-12 w-full items-center justify-center rounded-[1rem] bg-opex-dark px-5 text-sm font-black text-white shadow-[0_20px_40px_-20px_rgba(12,33,49,0.55)] transition-all hover:bg-slate-800 disabled:opacity-60"
        >
          {isSavingAccount ? t('bankingEdit.savingChanges') : t('bankingEdit.saveChanges')}
        </button>
      </div>
    </div>
  );
};
