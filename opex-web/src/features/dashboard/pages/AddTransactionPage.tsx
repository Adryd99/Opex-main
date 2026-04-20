import { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  Calculator,
  Calendar,
  Car,
  Check,
  Coins,
  Edit2,
  Gift,
  Home,
  Layers,
  ShoppingBag,
  TrendingUp,
  Utensils
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SubpageShell } from '../../../app/layout';
import { useAppLanguage } from '../../../i18n';
import { formatCurrency } from '../../../shared/formatting';
import { Button, Card } from '../../../shared/ui';
import { BankAccountRecord, CreateLocalTransactionInput } from '../../../shared/types';

type AddTransactionPageProps = {
  type: 'INCOME' | 'EXPENSE';
  onBack: () => void;
  bankAccounts: BankAccountRecord[];
  onSubmit: (input: CreateLocalTransactionInput) => Promise<void>;
  isSaving: boolean;
};

export const AddTransactionPage = ({
  type,
  onBack,
  bankAccounts,
  onSubmit,
  isSaving
}: AddTransactionPageProps) => {
  const { t } = useTranslation('dashboard');
  const { language } = useAppLanguage();
  const isIncome = type === 'INCOME';
  const localAccounts = useMemo(
    () => bankAccounts.filter((account) => !account.isSaltedge),
    [bankAccounts]
  );
  const resolveSelectableAccountId = (account: BankAccountRecord): string =>
    account.accountId ?? account.saltedgeAccountId ?? account.saltedge_account_id ?? account.id;
  const [amount, setAmount] = useState('0.00');
  const [selectedCat, setSelectedCat] = useState('General');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAccountId, setSelectedAccountId] = useState(localAccounts[0] ? resolveSelectableAccountId(localAccounts[0]) : '');
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (localAccounts.length === 0) {
      if (selectedAccountId) {
        setSelectedAccountId('');
      }
      return;
    }

    const hasSelectedAccount = localAccounts.some((account) => resolveSelectableAccountId(account) === selectedAccountId);
    if (!hasSelectedAccount) {
      setSelectedAccountId(resolveSelectableAccountId(localAccounts[0]));
    }
  }, [localAccounts, selectedAccountId]);

  const categories = isIncome
    ? [
        { value: 'Salary', label: t('addTransaction.categories.salary'), icon: Briefcase, color: 'bg-green-100 text-green-600' },
        { value: 'Freelance', label: t('addTransaction.categories.freelance'), icon: Coins, color: 'bg-blue-100 text-blue-600' },
        { value: 'Gift', label: t('addTransaction.categories.gift'), icon: Gift, color: 'bg-pink-100 text-pink-600' },
        { value: 'Investment', label: t('addTransaction.categories.investment'), icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
        { value: 'Other', label: t('addTransaction.categories.other'), icon: Layers, color: 'bg-gray-100 text-gray-600' }
      ]
    : [
        { value: 'Groceries', label: t('addTransaction.categories.groceries'), icon: ShoppingBag, color: 'bg-yellow-100 text-yellow-600' },
        { value: 'Food', label: t('addTransaction.categories.food'), icon: Utensils, color: 'bg-orange-100 text-orange-600' },
        { value: 'Transport', label: t('addTransaction.categories.transport'), icon: Car, color: 'bg-blue-100 text-blue-600' },
        { value: 'Home', label: t('addTransaction.categories.home'), icon: Home, color: 'bg-emerald-100 text-emerald-600' },
        { value: 'Shopping', label: t('addTransaction.categories.shopping'), icon: ShoppingBag, color: 'bg-purple-100 text-purple-600' },
        { value: 'Software', label: t('addTransaction.categories.software'), icon: Layers, color: 'bg-indigo-100 text-indigo-600' },
        { value: 'Taxes', label: t('addTransaction.categories.taxes'), icon: Calculator, color: 'bg-red-100 text-red-600' }
      ];

  const handleConfirm = async () => {
    const parsedAmount = Number.parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setSubmitError(t('addTransaction.amountError'));
      return;
    }

    if (!selectedAccountId) {
      setSubmitError(t('addTransaction.accountError'));
      return;
    }

    setSubmitError(null);
    try {
      await onSubmit({
        bankAccountId: selectedAccountId,
        amount: parsedAmount,
        category: selectedCat,
        description: note,
        type,
        bookingDate: date
      });
      onBack();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('addTransaction.submitError'));
    }
  };

  return (
    <SubpageShell onBack={onBack} title={isIncome ? t('addTransaction.addIncome') : t('addTransaction.addExpense')}>
      <div className="max-w-2xl mx-auto space-y-8 pb-20">
        <div className="space-y-8 rounded-[2.5rem] border border-app-border bg-app-surface p-10 text-center shadow-xl shadow-gray-200/20 dark:shadow-slate-950/30">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-app-tertiary">{t('addTransaction.amount')}</p>
            <div className="flex items-center justify-center gap-2 group">
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className={`w-full max-w-[320px] border-none bg-transparent text-center text-6xl font-black outline-none focus:ring-0 ${isIncome ? 'text-green-500 dark:text-emerald-300' : 'text-app-primary'}`}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-2xl space-y-3">
              <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-app-tertiary">{t('addTransaction.localAccount')}</p>
              {localAccounts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {localAccounts.map((account) => {
                    const accountId = resolveSelectableAccountId(account);
                    const isSelected = selectedAccountId === accountId;

                    return (
                      <button
                        key={accountId}
                        onClick={() => setSelectedAccountId(accountId)}
                        className={`text-left rounded-[1.75rem] border p-4 transition-all ${isSelected
                          ? 'bg-app-surface border-opex-teal/40 shadow-lg shadow-teal-900/10 dark:bg-opex-teal/10'
                          : 'bg-app-muted border-app-border hover:border-gray-200 dark:hover:border-app-tertiary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-app-primary">{account.institutionName}</p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-app-tertiary">{t('addTransaction.localAccountLabel')}</p>
                          </div>
                          <p className="text-sm font-bold text-app-secondary">
                            {formatCurrency(account.balance ?? 0, language, account.currency || 'EUR')}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-app-border bg-app-muted px-5 py-4 text-center">
                  <p className="text-sm font-bold text-app-secondary">{t('addTransaction.noLocalAccount')}</p>
                  <p className="mt-1 text-xs text-app-tertiary">{t('addTransaction.noLocalAccountDescription')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="px-1 text-[10px] font-black uppercase tracking-widest text-app-tertiary">{t('addTransaction.selectCategory')}</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCat(category.value)}
                className={`flex flex-col items-center gap-3 rounded-[1.5rem] border-2 p-4 transition-all ${selectedCat === category.value ? 'bg-app-surface border-opex-teal shadow-lg scale-105 dark:bg-opex-teal/10' : 'bg-app-muted border-transparent hover:border-gray-200 dark:hover:border-app-tertiary/50'}`}
              >
                <div className={`w-12 h-12 rounded-2xl ${category.color} flex items-center justify-center`}>
                  <category.icon size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter text-app-secondary">{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="px-1 text-[10px] font-black uppercase tracking-widest text-app-tertiary">{t('addTransaction.details')}</h3>
          <Card>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="flex-shrink-0 text-app-tertiary" />
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full border-none bg-transparent text-sm font-bold text-app-primary outline-none focus:ring-0"
                />
              </div>
              <div className="h-px w-full bg-app-border" />
              <div className="flex items-center gap-3">
                <Edit2 size={20} className="text-app-tertiary" />
                <input
                  placeholder={t('addTransaction.notePlaceholder')}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="w-full border-none bg-transparent text-sm font-bold text-app-primary outline-none focus:ring-0"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="pt-6">
          <Button fullWidth size="lg" icon={Check} onClick={() => void handleConfirm()} disabled={isSaving || localAccounts.length === 0}>
            {isSaving ? t('addTransaction.saving') : t('addTransaction.confirm')}
          </Button>
          {submitError && <p className="text-sm text-red-600 font-medium mt-3">{submitError}</p>}
        </div>
      </div>
    </SubpageShell>
  );
};
