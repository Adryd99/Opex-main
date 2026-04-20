import { useMemo, useState } from 'react';
import { ChevronRight, Download, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SubpageShell } from '../../../app/layout';
import { useAppLanguage, formatDateForLanguage } from '../../../i18n';
import { formatCurrency } from '../../../shared/formatting';
import { Badge, Button, Card, ToggleFilter } from '../../../shared/ui';
import { TransactionRecord } from '../../../shared/types';

type TransactionsPageProps = {
  onBack: () => void;
  transactions: TransactionRecord[];
  initialFilter?: 'All' | 'In' | 'Out';
};

export const TransactionsPage = ({
  onBack,
  transactions,
  initialFilter = 'All'
}: TransactionsPageProps) => {
  const { t } = useTranslation('dashboard');
  const { language } = useAppLanguage();
  const [filter, setFilter] = useState(initialFilter);

  const filteredTransactions = useMemo(() => {
    const normalized = transactions
      .map((transaction) => {
        const amount = Number(transaction.amount ?? 0);
        const isIncome = amount >= 0;
        return {
          id: transaction.id,
          date: transaction.bookingDate || new Date().toISOString().slice(0, 10),
          name: transaction.merchantName || transaction.description || transaction.category || t('transactions.transactionFallback'),
          category: transaction.category || (isIncome ? t('transactions.incomeFallback') : t('transactions.expenseFallback')),
          amount,
          status: transaction.status || 'COMPLETED',
          icon: isIncome ? 'IN' : 'OUT',
          color: isIncome ? 'bg-emerald-500' : 'bg-opex-dark'
        };
      })
      .sort((left, right) => right.date.localeCompare(left.date));

    if (filter === 'In') {
      return normalized.filter((item) => item.amount >= 0);
    }
    if (filter === 'Out') {
      return normalized.filter((item) => item.amount < 0);
    }
    return normalized;
  }, [filter, t, transactions]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filteredTransactions> = {};

    filteredTransactions.forEach((transaction) => {
      if (!groups[transaction.date]) {
        groups[transaction.date] = [];
      }
      groups[transaction.date].push(transaction);
    });

    return Object.entries(groups).sort((left, right) => right[0].localeCompare(left[0]));
  }, [filteredTransactions]);

  return (
    <SubpageShell
      onBack={onBack}
      title={t('transactions.allActivity')}
      actions={(
        <div className="flex gap-2">
          <button className="rounded-xl p-2 text-app-tertiary transition-colors hover:bg-app-muted hover:text-app-secondary">
            <Download size={20} />
          </button>
        </div>
      )}
    >
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-app-primary">{t('transactions.historyTitle')}</h2>
            <p className="text-sm font-medium text-app-secondary">{t('transactions.historyDescription')}</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <ToggleFilter
              options={[
                { value: 'All', label: t('transactions.all') },
                { value: 'In', label: t('transactions.in') },
                { value: 'Out', label: t('transactions.out') }
              ]}
              active={filter}
              onChange={setFilter}
            />
            <Button variant="outline" size="sm" icon={Filter} className="shrink-0">{t('transactions.filters')}</Button>
          </div>
        </div>

        <div className="space-y-10">
          {grouped.length === 0 && (
            <Card>
              <div className="py-14 text-center">
                <p className="text-sm font-bold text-app-secondary">{t('transactions.noTransactions')}</p>
              </div>
            </Card>
          )}
          {grouped.map(([date, items]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-4 px-2">
                <span className="text-xs font-black uppercase tracking-widest text-app-tertiary">
                  {formatDateForLanguage(language, `${date}T12:00:00`, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <div className="h-px flex-1 bg-app-border" />
              </div>
              <div className="overflow-hidden rounded-[2rem] border border-app-border bg-app-surface shadow-sm divide-y divide-app-border">
                {items.map((transaction) => (
                  <div key={transaction.id} className="group flex cursor-pointer flex-col justify-between gap-4 p-6 transition-colors hover:bg-app-muted/60 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${transaction.color} flex items-center justify-center text-white text-xs font-bold shadow-sm transition-transform group-hover:scale-110`}>
                        {transaction.icon}
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-app-primary">{transaction.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge>{transaction.category}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-8">
                      <div className="text-right">
                        <p className={`text-lg font-black ${transaction.amount > 0 ? 'text-green-600 dark:text-emerald-300' : 'text-app-primary'}`}>
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount), language)}
                        </p>
                        <p className={`text-[10px] font-bold uppercase tracking-tighter ${String(transaction.status).toUpperCase() === 'COMPLETED' ? 'text-app-tertiary' : 'text-orange-500 dark:text-orange-300'}`}>
                          {transaction.status}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-app-tertiary transition-colors group-hover:text-opex-teal" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SubpageShell>
  );
};
