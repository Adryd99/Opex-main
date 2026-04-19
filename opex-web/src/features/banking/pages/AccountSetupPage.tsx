import React, { useEffect, useState } from 'react';
import { Calculator, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SubpageShell } from '../../../app/layout';
import { Button, Card } from '../../../shared/ui';
import { BankAccountRecord, BankOption, ManualBankSetupInput } from '../../../shared/types';
import { AccountCategory } from '../types';
import { ACCOUNT_CATEGORY_OPTIONS, ACCOUNT_CATEGORY_TO_NATURE, toAccountCategory } from '../utils';

export const AccountSetupPage = ({
  bank,
  onBack,
  onComplete,
  isSaving = false,
  isManual = false,
  presetAccount = null
}: {
  bank: BankOption;
  onBack: () => void;
  onComplete: (payload: ManualBankSetupInput) => Promise<void>;
  isSaving?: boolean;
  isManual?: boolean;
  presetAccount?: BankAccountRecord | null;
}) => {
  const { t } = useTranslation('banking');
  const isConnectionEdit = !isManual && Boolean(presetAccount);
  const [accountType, setAccountType] = useState<AccountCategory>(toAccountCategory(presetAccount?.nature));
  const [isTaxBuffer, setIsTaxBuffer] = useState(Boolean(presetAccount?.isForTax));
  const [institutionName, setInstitutionName] = useState(
    isConnectionEdit ? ((presetAccount?.institutionName ?? '').trim() || bank.name) : bank.name
  );
  const [balance, setBalance] = useState(String(presetAccount?.balance ?? 0));
  const [currency, setCurrency] = useState((presetAccount?.currency ?? 'EUR').trim().toUpperCase() || 'EUR');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setAccountType(toAccountCategory(presetAccount?.nature));
    setIsTaxBuffer(Boolean(presetAccount?.isForTax));
    setInstitutionName(isConnectionEdit ? ((presetAccount?.institutionName ?? '').trim() || bank.name) : bank.name);
    setBalance(String(presetAccount?.balance ?? 0));
    setCurrency((presetAccount?.currency ?? 'EUR').trim().toUpperCase() || 'EUR');
    setFormError(null);
  }, [
    bank.name,
    isConnectionEdit,
    presetAccount?.balance,
    presetAccount?.currency,
    presetAccount?.id,
    presetAccount?.isForTax,
    presetAccount?.nature
  ]);

  const handleComplete = async () => {
    const parsedBalance = Number.parseFloat(balance);
    if (isManual && !Number.isFinite(parsedBalance)) {
      setFormError(t('accountSetup.invalidBalance'));
      return;
    }

    const fallbackBalance = Number.isFinite(parsedBalance) ? parsedBalance : Number(presetAccount?.balance ?? 0) || 0;

    const payload: ManualBankSetupInput = {
      institutionName: institutionName.trim() || bank.name,
      balance: fallbackBalance,
      currency: currency.trim().toUpperCase() || 'EUR',
      isForTax: isTaxBuffer,
      nature: ACCOUNT_CATEGORY_TO_NATURE[accountType]
    };

    setFormError(null);
    try {
      await onComplete(payload);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t('accountSetup.saveError'));
    }
  };

  return (
    <SubpageShell
      onBack={onBack}
      title={isConnectionEdit ? t('accountSetup.editConnection') : t('accountSetup.configureAccount')}
    >
      <div className="max-w-2xl mx-auto space-y-8 pb-20">
        <Card>
          <div className="flex items-center gap-5 p-2">
            <div className={`w-16 h-16 rounded-[1.5rem] ${bank.color} text-white flex items-center justify-center text-2xl font-black shadow-lg`}>
              {typeof bank.icon === 'string' ? bank.icon : React.isValidElement(bank.icon) ? React.cloneElement(bank.icon as React.ReactElement<any>, { size: 32 }) : bank.icon}
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 leading-none">{bank.name}</h3>
              <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-widest">
                {t('accountSetup.successfullyAuthorized')}
              </p>
            </div>
            <div className="ml-auto">
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center"><Check size={20} /></div>
            </div>
          </div>
        </Card>

        {(isManual || isConnectionEdit) && (
          <Card title={isConnectionEdit ? t('accountSetup.connectionDetails') : t('accountSetup.manualAccountDetails')}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {isConnectionEdit ? t('accountSetup.accountName') : t('accountSetup.institutionName')}
                </label>
                <input
                  value={institutionName}
                  onChange={(event) => setInstitutionName(event.target.value)}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none"
                  placeholder={
                    isConnectionEdit
                      ? t('accountSetup.placeholders.accountName')
                      : t('accountSetup.placeholders.institutionName')
                  }
                />
              </div>
              {isManual && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {t('accountSetup.initialBalance')}
                    </label>
                    <input
                      type="number"
                      value={balance}
                      onChange={(event) => setBalance(event.target.value)}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none"
                      placeholder="500.50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {t('accountSetup.currency')}
                    </label>
                    <input
                      value={currency}
                      onChange={(event) => setCurrency(event.target.value)}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none"
                      placeholder="EUR"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
            {t('accountSetup.accountCategory')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ACCOUNT_CATEGORY_OPTIONS.map(type => (
              <button
                key={type}
                onClick={() => setAccountType(type)}
                className={`p-6 rounded-[2rem] border-2 text-center transition-all ${accountType === type ? 'bg-white border-opex-teal shadow-xl scale-105' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
              >
                <p className={`text-sm font-black ${accountType === type ? 'text-gray-900' : 'text-gray-400'}`}>
                  {t(`accountSetup.categories.${type.toLowerCase()}`)}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
            {t('accountSetup.fiscalSettings')}
          </h3>
          <div
            onClick={() => setIsTaxBuffer(!isTaxBuffer)}
            className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer flex items-center justify-between group ${isTaxBuffer ? 'bg-opex-teal text-white border-opex-teal shadow-2xl shadow-teal-900/20' : 'bg-white border-gray-100 hover:border-opex-teal/30'}`}
          >
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isTaxBuffer ? 'bg-white/10' : 'bg-gray-50 text-gray-400'}`}>
                <Calculator size={28} />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-black leading-none">{t('accountSetup.taxBufferTitle')}</p>
                <p className={`text-xs font-medium ${isTaxBuffer ? 'text-teal-100' : 'text-gray-400'}`}>
                  {t('accountSetup.taxBufferDescription')}
                </p>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isTaxBuffer ? 'bg-white border-white' : 'border-gray-200 group-hover:border-opex-teal'}`}>
              {isTaxBuffer && <Check size={14} className="text-opex-teal" />}
            </div>
          </div>
        </div>

        <div className="pt-6">
          <Button fullWidth size="lg" icon={Check} onClick={() => void handleComplete()} disabled={isSaving}>
            {isSaving
              ? t('accountSetup.saving')
              : isConnectionEdit
                ? t('accountSetup.saveChanges')
                : t('accountSetup.completeSetup')}
          </Button>
          {formError && <p className="mt-3 text-sm text-red-600 font-medium">{formError}</p>}
        </div>
      </div>
    </SubpageShell>
  );
};




