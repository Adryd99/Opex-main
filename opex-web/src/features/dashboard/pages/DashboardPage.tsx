import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, ArrowUpRight, Lock, RefreshCw, Sparkles, TrendingDown, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AccountSelector, QuickActions } from '../../../app/layout';
import { useAppLanguage } from '../../../i18n';
import { Badge, Button, Card, ToggleFilter } from '../../../shared/ui';
import { formatCurrency, formatRoundedNumber } from '../../../shared/formatting';
import { TransactionRecord } from '../../../shared/types';
import { ClickableStat } from '../components/ClickableStat';
import { RecurringWidget } from '../components/RecurringWidget';
import { resolveMonthlyInsightMessages } from '../data/monthlyInsights';
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
  const { t } = useTranslation('dashboard');
  const { language } = useAppLanguage();
  const [spendingFilter, setSpendingFilter] = useState('Week');
  const [monthlyInsightIndex, setMonthlyInsightIndex] = useState(0);
  const monthlyInsightMessages = useMemo(() => resolveMonthlyInsightMessages(language), [language]);

  const spendingFilterOptions = [
    { value: 'Week', label: t('filters.week') },
    { value: 'Month', label: t('filters.month') },
    { value: 'Year', label: t('filters.year') }
  ];

  const getChartData = (filter: string) => {
    const weekLabels = [
      t('overview.chartLabels.week.mon'),
      t('overview.chartLabels.week.tue'),
      t('overview.chartLabels.week.wed'),
      t('overview.chartLabels.week.thu'),
      t('overview.chartLabels.week.fri'),
      t('overview.chartLabels.week.sat'),
      t('overview.chartLabels.week.sun')
    ];
    const monthLabels = [
      t('overview.chartLabels.month.w1'),
      t('overview.chartLabels.month.w2'),
      t('overview.chartLabels.month.w3'),
      t('overview.chartLabels.month.w4')
    ];
    const yearLabels = [
      t('overview.chartLabels.year.q1'),
      t('overview.chartLabels.year.q2'),
      t('overview.chartLabels.year.q3'),
      t('overview.chartLabels.year.q4')
    ];

    switch (filter) {
      case 'Week':
        return { labels: weekLabels, values: [420, 780, 360, 540, 960, 300, 660] };
      case 'Month':
        return { labels: monthLabels, values: [1850, 1200, 2100, 1550] };
      case 'Year':
        return { labels: yearLabels, values: [14200, 11500, 18500, 15200] };
      default:
        return { labels: weekLabels, values: [500, 500, 500, 500, 500, 500, 500] };
    }
  };

  const { labels, values } = getChartData(spendingFilter);
  const maxValue = Math.max(...values, 1);
  const firstName = userName.split(' ')[0] || t('overview.nameFallback');

  const totalBalance = Number(aggregatedSummary.totalBalance || 0);
  const totalIncome = Number(aggregatedSummary.totalIncome || 0);
  const totalExpenses = Number(aggregatedSummary.totalExpenses || 0);
  const monthlyInsightSeed = useMemo(() => {
    if (monthlyInsightMessages.length === 0) {
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

    return Math.abs(dateSeed + metricSeed) % monthlyInsightMessages.length;
  }, [monthlyInsightMessages.length, transactions.length, totalBalance, totalIncome, totalExpenses]);

  const recentTransactions = useMemo(
    () =>
      transactions
        .map((transaction) => {
          const amount = Number(transaction.amount ?? 0);
          const isIncome = amount >= 0;
          return {
            id: transaction.id,
            name: transaction.merchantName || transaction.description || transaction.category || t('transactions.transactionFallback'),
            category: transaction.category || (isIncome ? t('transactions.incomeFallback') : t('transactions.expenseFallback')),
            amount,
            icon: isIncome ? 'IN' : 'OUT',
            color: isIncome ? 'bg-emerald-500' : 'bg-opex-dark',
            bookingDate: transaction.bookingDate || ''
          };
        })
        .sort((a, b) => b.bookingDate.localeCompare(a.bookingDate))
        .slice(0, 8),
    [t, transactions]
  );

  useEffect(() => {
    setMonthlyInsightIndex(monthlyInsightSeed);
  }, [monthlyInsightSeed]);

  useEffect(() => {
    if (isLoading || monthlyInsightMessages.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setMonthlyInsightIndex((currentIndex) => (currentIndex + 1) % monthlyInsightMessages.length);
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [isLoading, monthlyInsightMessages.length]);

  const activeMonthlyInsight = monthlyInsightMessages[monthlyInsightIndex] ?? monthlyInsightMessages[0];
  const monthlyInsightAreaClass = MONTHLY_INSIGHT_AREA_CLASS[activeMonthlyInsight?.areaKey ?? 'insight'] ?? 'text-white';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 relative z-20">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('overview.title')}</h2>
          <p className="text-sm text-gray-500">
            {isLoading
              ? t('overview.subtitleLoading', { name: firstName })
              : t('overview.subtitleReady', { name: firstName })}{' '}
            {!isLoading && (
              <span className="font-bold">
                {selectedProviderName
                  ? t('overview.providerSelected', { provider: selectedProviderName })
                  : t('overview.providerAll')}
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
        <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full translate-x-10 -translate-y-10 blur-3xl" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="relative">
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl pointer-events-auto select-none">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full">
                <Lock size={13} className="text-white/70" />
                <span className="text-xs font-black text-white/80 uppercase tracking-widest">{t('overview.comingSoon')}</span>
              </div>
            </div>
            <div className="pointer-events-none select-none" style={{ filter: 'blur(4px)', opacity: 0.35 }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">{t('overview.monthlyInsight')}</span>
                {!isLoading && activeMonthlyInsight && (
                  <span className={`bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${monthlyInsightAreaClass}`}>
                    <Sparkles size={14} /> {activeMonthlyInsight.area}
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight max-w-lg mb-4">
                {isLoading
                  ? t('overview.monthlyInsightWaitingTitle')
                  : activeMonthlyInsight?.name ?? t('overview.monthlyInsightUnavailableTitle')}
              </h2>
              <p className="text-gray-400 text-sm max-w-sm">
                {isLoading
                  ? t('overview.monthlyInsightWaitingDescription')
                  : activeMonthlyInsight?.description ?? t('overview.monthlyInsightUnavailableDescription')}
              </p>
            </div>
          </div>
          <div className="lg:text-right bg-white/10 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-white/5 flex flex-col items-start lg:items-end justify-center">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
              <Wallet size={14} /> {t('overview.totalBalance')}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-bold tracking-tight">
                {isLoading ? '...' : formatCurrency(totalBalance, language)}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full text-green-300 text-xs font-bold border border-green-500/30">
              <ArrowUpRight size={14} /> {t('overview.liveBackendData')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ClickableStat
          title={t('overview.totalIncome')}
          amount={formatRoundedNumber(Math.round(totalIncome), language)}
          trend={isLoading ? t('overview.syncShort') : t('overview.monthShort')}
          icon={ArrowUp}
          trendUp={true}
          onClick={() => onNavigate('TRANSACTIONS_IN')}
        />
        <ClickableStat
          title={t('overview.totalExpenses')}
          amount={formatRoundedNumber(Math.round(totalExpenses), language)}
          trend={isLoading ? t('overview.syncShort') : t('overview.monthShort')}
          icon={TrendingDown}
          trendUp={false}
          onClick={() => onNavigate('TRANSACTIONS_OUT')}
        />
        <RecurringWidget onClick={() => onNavigate('RECURRING')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card
            title={t('overview.spendingTrend')}
            action={<ToggleFilter options={spendingFilterOptions} active={spendingFilter} onChange={setSpendingFilter} />}
          >
            <div className="h-56 flex items-end justify-between gap-3 px-2 mt-4 relative">
              {values.map((v, i) => (
                <div key={labels[i]} className="flex-1 flex flex-col items-center group relative h-full">
                  <div className="w-full flex-1 flex items-end relative">
                    <div className="w-full h-full bg-gray-50 rounded-t-lg absolute bottom-0 opacity-40" />
                    <div
                      className="w-full bg-opex-teal rounded-t-lg transition-all duration-700 ease-out group-hover:bg-opex-dark relative"
                      style={{ height: `${(v / maxValue) * 100}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                        {formatCurrency(v, language)}
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
            title={t('overview.recentActivity')}
            action={(
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => void onRefresh()}>
                  {t('overview.sync')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('[]')}>
                  {t('overview.viewAll')}
                </Button>
              </div>
            )}
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="p-4">{t('overview.transaction')}</th>
                    <th className="p-4">{t('overview.category')}</th>
                    <th className="p-4 text-right">{t('overview.amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => onNavigate('[]')}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${transaction.color} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>{transaction.icon}</div>
                          <span className="font-medium text-gray-900 truncate max-w-[120px]">{transaction.name}</span>
                        </div>
                      </td>
                      <td className="p-4"><Badge>{transaction.category}</Badge></td>
                      <td className={`p-4 text-right font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount), language)}
                      </td>
                    </tr>
                  ))}
                  {recentTransactions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-sm text-gray-500 font-medium">
                        {t('overview.noSynchronizedActivity')}
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
