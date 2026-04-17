import { useMemo, useState } from 'react';
import { ChevronRight, Download, Filter } from 'lucide-react';
import { SubpageShell } from '../../../app/layout';
import { Badge, Button, Card, ToggleFilter } from '../../../shared/ui';
import { TransactionRecord } from '../../../shared/types';

export const TransactionsPage = ({
  onBack,
  transactions,
  initialFilter = 'All'
}: {
  onBack: () => void;
  transactions: TransactionRecord[];
  initialFilter?: 'All' | 'In' | 'Out';
}) => {
  const [filter, setFilter] = useState(initialFilter);

  const filteredTransactions = useMemo(() => {
    const normalized = transactions
      .map((transaction) => {
        const amount = Number(transaction.amount ?? 0);
        const isIncome = amount >= 0;
        return {
          id: transaction.id,
          date: transaction.bookingDate || new Date().toISOString().slice(0, 10),
          name: transaction.merchantName || transaction.description || transaction.category || 'Transaction',
          category: transaction.category || (isIncome ? 'Income' : 'Expense'),
          amount,
          status: transaction.status || 'COMPLETED',
          icon: isIncome ? 'IN' : 'OUT',
          color: isIncome ? 'bg-emerald-500' : 'bg-opex-dark'
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    if (filter === 'In') {
      return normalized.filter((item) => item.amount >= 0);
    }
    if (filter === 'Out') {
      return normalized.filter((item) => item.amount < 0);
    }
    return normalized;
  }, [filter, transactions]);

  // Simple grouping by date
  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredTransactions.forEach((transaction) => {
      if (!groups[transaction.date]) {
        groups[transaction.date] = [];
      }
      groups[transaction.date].push(transaction);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  return (
    <SubpageShell
      onBack={onBack}
      title="All Activity"
      actions={
        <div className="flex gap-2">
          <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl">
            <Download size={20} />
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-gray-900">Transaction History</h2>
            <p className="text-sm font-medium text-gray-500">Comprehensive list of all your fiscal movements.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <ToggleFilter options={['All', 'In', 'Out']} active={filter} onChange={setFilter} />
            <Button variant="outline" size="sm" icon={Filter} className="shrink-0">Filters</Button>
          </div>
        </div>

        <div className="space-y-10">
          {grouped.length === 0 && (
            <Card>
              <div className="py-14 text-center">
                <p className="text-sm font-bold text-gray-500">No transactions found for this filter.</p>
              </div>
            </Card>
          )}
          {grouped.map(([date, items]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-4 px-2">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{date}</span>
                <div className="flex-1 h-px bg-gray-100"></div>
              </div>
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {items.map((t) => (
                  <div key={t.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${t.color} flex items-center justify-center text-white text-xs font-bold shadow-sm transition-transform group-hover:scale-110`}>
                        {t.icon}
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-gray-900">{t.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge>{t.category}</Badge>
                          <span className="text-[10px] text-gray-400 font-bold">• 14:32</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-8">
                      <div className="text-right">
                        <p className={`text-lg font-black ${t.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          {t.amount > 0 ? '+' : ''}€{Math.abs(t.amount).toLocaleString()}
                        </p>
                        <p className={`text-[10px] font-bold uppercase tracking-tighter ${String(t.status).toUpperCase() === 'COMPLETED' ? 'text-gray-400' : 'text-orange-500'}`}>{t.status}</p>
                      </div>
                      <ChevronRight size={18} className="text-gray-200 group-hover:text-opex-teal transition-colors" />
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


