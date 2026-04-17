import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Calculator, Calendar, Car, Check, Coins, Edit2, Gift, Home, Layers, ShoppingBag, TrendingUp, Utensils } from 'lucide-react';
import { SubpageShell } from '../../../app/layout';
import { Button, Card } from '../../../shared/ui';
import { BankAccountRecord, CreateLocalTransactionInput } from '../../../shared/types';

export const AddTransactionPage = ({
  type,
  onBack,
  bankAccounts,
  onSubmit,
  isSaving
}: {
  type: 'INCOME' | 'EXPENSE';
  onBack: () => void;
  bankAccounts: BankAccountRecord[];
  onSubmit: (input: CreateLocalTransactionInput) => Promise<void>;
  isSaving: boolean;
}) => {
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
      { name: 'Salary', icon: Briefcase, color: 'bg-green-100 text-green-600' },
      { name: 'Freelance', icon: Coins, color: 'bg-blue-100 text-blue-600' },
      { name: 'Gift', icon: Gift, color: 'bg-pink-100 text-pink-600' },
      { name: 'Investment', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
      { name: 'Other', icon: Layers, color: 'bg-gray-100 text-gray-600' }
    ]
    : [
      { name: 'Groceries', icon: ShoppingBag, color: 'bg-yellow-100 text-yellow-600' },
      { name: 'Food', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
      { name: 'Transport', icon: Car, color: 'bg-blue-100 text-blue-600' },
      { name: 'Home', icon: Home, color: 'bg-emerald-100 text-emerald-600' },
      { name: 'Shopping', icon: ShoppingBag, color: 'bg-purple-100 text-purple-600' },
      { name: 'Software', icon: Layers, color: 'bg-indigo-100 text-indigo-600' },
      { name: 'Taxes', icon: Calculator, color: 'bg-red-100 text-red-600' }
    ];

  const handleConfirm = async () => {
    const parsedAmount = Number.parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setSubmitError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!selectedAccountId) {
      setSubmitError('Please select a bank account before saving.');
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
      setSubmitError(error instanceof Error ? error.message : 'Unable to create transaction.');
    }
  };

  return (
    <SubpageShell onBack={onBack} title={isIncome ? 'Add Income' : 'Add Expense'}>
      <div className="max-w-2xl mx-auto space-y-8 pb-20">
        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 text-center space-y-8">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction Amount</p>
            <div className="flex items-center justify-center gap-2 group">
              <span className="text-4xl font-black text-gray-300">€</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className={`text-6xl font-black w-full max-w-[280px] bg-transparent border-none focus:ring-0 text-center outline-none ${isIncome ? 'text-green-500' : 'text-opex-dark'}`}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-2xl space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Local Account</p>
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
                            ? 'bg-white border-opex-teal/40 shadow-lg shadow-teal-900/10'
                            : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                          }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-gray-900">{account.institutionName}</p>
                            <p className="mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Local Account</p>
                          </div>
                          <p className="text-sm font-bold text-gray-700">
                            {new Intl.NumberFormat('it-IT', {
                              style: 'currency',
                              currency: account.currency || 'EUR',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2
                            }).format(account.balance ?? 0)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-gray-100 bg-gray-50 px-5 py-4 text-center">
                  <p className="text-sm font-bold text-gray-500">No local account available.</p>
                  <p className="mt-1 text-xs text-gray-400">Create a manual account before adding income or expenses.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Select Category</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {categories.map(cat => (
              <button
                key={cat.name}
                onClick={() => setSelectedCat(cat.name)}
                className={`flex flex-col items-center gap-3 p-4 rounded-[1.5rem] border-2 transition-all ${selectedCat === cat.name ? 'bg-white border-opex-teal shadow-lg scale-105' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
              >
                <div className={`w-12 h-12 rounded-2xl ${cat.color} flex items-center justify-center`}>
                  <cat.icon size={24} />
                </div>
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-tighter">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Transaction Details</h3>
          <Card>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-gray-400 flex-shrink-0" />
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-900 outline-none"
                />
              </div>
              <div className="h-px bg-gray-50 w-full"></div>
              <div className="flex items-center gap-3">
                <Edit2 size={20} className="text-gray-400" />
                <input
                  placeholder="Add a note or description..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-900 outline-none"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="pt-6">
          <Button fullWidth size="lg" icon={Check} onClick={() => void handleConfirm()} disabled={isSaving || localAccounts.length === 0}>
            {isSaving ? 'Saving...' : 'Confirm Transaction'}
          </Button>
          {submitError && <p className="text-sm text-red-600 font-medium mt-3">{submitError}</p>}
        </div>
      </div>
    </SubpageShell>
  );
};



