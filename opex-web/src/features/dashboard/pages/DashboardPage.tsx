import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, ArrowUpRight, Lock, RefreshCw, Sparkles, TrendingDown, Wallet } from 'lucide-react';
import { AccountSelector, QuickActions } from '../../../app/layout';
import { Badge, Button, Card, ToggleFilter } from '../../../shared/ui';
import { MONTHLY_INSIGHT_MESSAGES } from '../data/monthlyInsights';
import { TransactionRecord } from '../../../shared/types';
import { ClickableStat } from '../components/ClickableStat';
import { RecurringWidget } from '../components/RecurringWidget';
import { formatCurrency } from '../../../shared/formatting';
import { MONTHLY_INSIGHT_AREA_CLASS } from '../constants';

export const DashboardPage = ({
  onNavigate,
  userName,
  transactions,
  selectedProviderName,
  aggregatedSummary,
  isLoading,
  onRefresh
}: {
  onNavigate: (tab: string) => void;
  userName: string;
  transactions: TransactionRecord[];
  selectedProviderName: string | null;
  aggregatedSummary: {
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
  };
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}) => {
  const [spendingFilter, setSpendingFilter] = useState('Week');
  const [monthlyInsightIndex, setMonthlyInsightIndex] = useState(0);

  const getChartData = (filter: string) => {
    switch (filter) {
      case 'Week': return { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [420, 780, 360, 540, 960, 300, 660] };
      case 'Month': return { labels: ['W1', 'W2', 'W3', 'W4'], values: [1850, 1200, 2100, 1550] };
      case 'Year': return { labels: ['Q1', 'Q2', 'Q3', 'Q4'], values: [14200, 11500, 18500, 15200] };
      default: return { labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], values: [500, 500, 500, 500, 500, 500, 500] };
    }
  };

  const { labels, values } = getChartData(spendingFilter);
  const maxValue = Math.max(...values, 1);
  const firstName = userName.split(' ')[0] || 'there';

  const totalBalance = Number(aggregatedSummary.totalBalance || 0);
  const totalIncome = Number(aggregatedSummary.totalIncome || 0);
  const totalExpenses = Number(aggregatedSummary.totalExpenses || 0);
  const monthlyInsightSeed = useMemo(() => {
    if (MONTHLY_INSIGHT_MESSAGES.length === 0) {
      return 0;
    }

    const today = new Date();
    const dateSeed = Number(
      `${today.getUTCFullYear()}${String(today.getUTCMonth() + 1).padStart(2, '0')}${String(today.getUTCDate()).padStart(2, '0')}`
    );
    const metricSeed =
      transactions.length
      + Math.round(totalBalance)
      + Math.round(totalIncome)
      + Math.round(Math.abs(totalExpenses));

    return Math.abs(dateSeed + metricSeed) % MONTHLY_INSIGHT_MESSAGES.length;
  }, [transactions.length, totalBalance, totalIncome, totalExpenses]);

  const recentTransactions = useMemo(
    () =>
      transactions
        .map((transaction) => {
          const amount = Number(transaction.amount ?? 0);
          const isIncome = amount >= 0;
          return {
            id: transaction.id,
            name: transaction.merchantName || transaction.description || transaction.category || 'Transaction',
            category: transaction.category || (isIncome ? 'Income' : 'Expense'),
            amount,
            icon: isIncome ? 'IN' : 'OUT',
            color: isIncome ? 'bg-emerald-500' : 'bg-opex-dark',
            bookingDate: transaction.bookingDate || ''
          };
        })
        .sort((a, b) => b.bookingDate.localeCompare(a.bookingDate))
        .slice(0, 8),
    [transactions]
  );

  useEffect(() => {
    setMonthlyInsightIndex(monthlyInsightSeed);
  }, [monthlyInsightSeed]);

  useEffect(() => {
    if (isLoading || MONTHLY_INSIGHT_MESSAGES.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setMonthlyInsightIndex((currentIndex) => (currentIndex + 1) % MONTHLY_INSIGHT_MESSAGES.length);
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [isLoading]);

  const activeMonthlyInsight = MONTHLY_INSIGHT_MESSAGES[monthlyInsightIndex] ?? MONTHLY_INSIGHT_MESSAGES[0];
  const monthlyInsightAreaClass = MONTHLY_INSIGHT_AREA_CLASS[activeMonthlyInsight?.area ?? 'Insight'] ?? 'text-white';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 relative z-20">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Overview</h2>
          <p className="text-sm text-gray-500">
            Welcome back, {firstName}. {isLoading ? 'Syncing latest data...' : "Here's what's happening today."}{' '}
            {!isLoading && (
              <span className="font-bold">
                {selectedProviderName ? `Provider: ${selectedProviderName}` : 'Provider: All'}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AccountSelector />
          <QuickActions onNavigate={onNavigate} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-opex-dark to-slate-800 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full translate-x-10 -translate-y-10 blur-3xl"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="relative">
            {/* Coming Soon overlay for Monthly Insight */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl pointer-events-auto select-none">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full">
                <Lock size={13} className="text-white/70" />
                <span className="text-xs font-black text-white/80 uppercase tracking-widest">Coming Soon</span>
              </div>
            </div>
            <div className="pointer-events-none select-none" style={{ filter: 'blur(4px)', opacity: 0.35 }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">Monthly Insight</span>
                {!isLoading && activeMonthlyInsight && (
                  <span className={`bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${monthlyInsightAreaClass}`}>
                    <Sparkles size={14} /> {activeMonthlyInsight.area}
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight max-w-lg mb-4">
                {isLoading
                  ? 'Waiting for backend synchronization...'
                  : activeMonthlyInsight?.name ?? 'Monthly insight unavailable.'}
              </h2>
              <p className="text-gray-400 text-sm max-w-sm">
                {isLoading
                  ? 'The dashboard is waiting for the latest backend data before generating an insight.'
                  : activeMonthlyInsight?.description ?? 'No insight available right now.'}
              </p>
            </div>
          </div>
          <div className="lg:text-right bg-white/10 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-white/5 flex flex-col items-start lg:items-end justify-center">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
              <Wallet size={14} /> Total Balance
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-bold tracking-tight">
                {isLoading ? '...' : formatCurrency(totalBalance)}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full text-green-300 text-xs font-bold border border-green-500/30">
              <ArrowUpRight size={14} /> Live backend data
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ClickableStat
          title="Total Income"
          amount={Math.round(totalIncome).toLocaleString('it-IT')}
          trend={isLoading ? 'sync...' : 'month'}
          icon={ArrowUp}
          trendUp={true}
          onClick={() => onNavigate('TRANSACTIONS_IN')}
        />
        <ClickableStat
          title="Total Expenses"
          amount={Math.round(totalExpenses).toLocaleString('it-IT')}
          trend={isLoading ? 'sync...' : 'month'}
          icon={TrendingDown}
          trendUp={false}
          onClick={() => onNavigate('TRANSACTIONS_OUT')}
        />
        <RecurringWidget onClick={() => onNavigate('RECURRING')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card
            title="Spending Trend"
            action={<ToggleFilter options={['Week', 'Month', 'Year']} active={spendingFilter} onChange={setSpendingFilter} />}
          >
            <div className="h-56 flex items-end justify-between gap-3 px-2 mt-4 relative">
              {values.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full">
                  <div className="w-full flex-1 flex items-end relative">
                    <div className="w-full h-full bg-gray-50 rounded-t-lg absolute bottom-0 opacity-40"></div>
                    <div
                      className="w-full bg-opex-teal rounded-t-lg transition-all duration-700 ease-out group-hover:bg-opex-dark relative"
                      style={{ height: `${(v / maxValue) * 100}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                        €{v.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] text-gray-400 font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full text-center shrink-0">
                    {labels[i]}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card
            title="Recent Activity"
            action={
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => void onRefresh()}>
                  Sync
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('[]')}>
                  View All
                </Button>
              </div>
            }
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="p-4">Transaction</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => onNavigate('[]')}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>{t.icon}</div>
                          <span className="font-medium text-gray-900 truncate max-w-[120px]">{t.name}</span>
                        </div>
                      </td>
                      <td className="p-4"><Badge>{t.category}</Badge></td>
                      <td className={`p-4 text-right font-bold ${t.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {t.amount > 0 ? '+' : ''}€{Math.abs(t.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {recentTransactions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-sm text-gray-500 font-medium">
                        No synchronized activity yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};


