import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SubpageShell } from '../../../app/layout';
import { useAppLanguage, formatDateForLanguage } from '../../../i18n';
import { formatCurrency } from '../../../shared/formatting';
import { Badge, Button, Card, ToggleFilter } from '../../../shared/ui';
import { EnhancedLineChart } from '../components/EnhancedLineChart';
import { MiniPieChart } from '../components/MiniPieChart';

type BreakdownLayoutProps = {
  type: 'INCOME' | 'EXPENSES';
  onBack: () => void;
};

export const BreakdownLayout = ({ type, onBack }: BreakdownLayoutProps) => {
  const { t } = useTranslation('dashboard');
  const { language } = useAppLanguage();
  const [filter, setFilter] = useState('Week');
  const isIncome = type === 'INCOME';

  const getSubtitle = (currentFilter: string) => {
    switch (currentFilter) {
      case 'Week':
        return isIncome ? t('breakdown.subtitleWeekIncome') : t('breakdown.subtitleWeekExpenses');
      case 'Month':
        return isIncome ? t('breakdown.subtitleMonthIncome') : t('breakdown.subtitleMonthExpenses');
      case 'Year':
        return isIncome ? t('breakdown.subtitleYearIncome') : t('breakdown.subtitleYearExpenses');
      default:
        return t('breakdown.analysisFallback');
    }
  };

  const sources = isIncome
    ? [
        { name: 'Freelance', tag: 'Direct', amount: 2400, color: 'bg-green-500', icon: 'F' },
        { name: 'Dividends', tag: 'Invest', amount: 1200, color: 'bg-blue-500', icon: 'D' },
        { name: 'Consulting', tag: 'Project', amount: 650, color: 'bg-purple-500', icon: 'C' }
      ]
    : [
        { name: 'Software', tag: 'SaaS', amount: 1200, color: 'bg-blue-500', icon: 'S' },
        { name: 'Groceries', tag: 'Essential', amount: 450, color: 'bg-yellow-500', icon: 'G' },
        { name: 'Rent', tag: 'Monthly', amount: 1200, color: 'bg-red-400', icon: 'R' }
      ];

  const groupedTransactions = useMemo(() => [
    {
      date: '2026-07-09',
      total: isIncome ? 1400 : -250,
      items: isIncome
        ? [{ name: 'Client X', tag: 'Payment', amount: 1400, icon: 'CX', color: 'bg-green-500' }]
        : [{ name: 'Adobe CC', tag: 'Software', amount: -52.99, icon: 'A', color: 'bg-red-500' }]
    },
    {
      date: '2026-07-08',
      total: isIncome ? 850 : -124,
      items: isIncome
        ? [{ name: 'Upwork', tag: 'Withdrawal', amount: 850, icon: 'U', color: 'bg-emerald-500' }]
        : [{ name: 'Webflow', tag: 'Hosting', amount: -124, icon: 'W', color: 'bg-blue-600' }]
    },
    {
      date: '2026-07-07',
      total: isIncome ? 320 : -45,
      items: isIncome
        ? [{ name: 'Shutterstock', tag: 'Royalty', amount: 320, icon: 'S', color: 'bg-orange-500' }]
        : [{ name: 'Grab', tag: 'Transport', amount: -45, icon: 'G', color: 'bg-green-600' }]
    }
  ], [isIncome]);

  return (
    <SubpageShell onBack={onBack} title={isIncome ? t('breakdown.incomeTitle') : t('breakdown.expensesTitle')}>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full space-y-8">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-gray-900">{isIncome ? t('breakdown.incomeBreakdown') : t('breakdown.expenseBreakdown')}</h2>
                <p className="text-sm font-medium text-gray-400 transition-all duration-300">{getSubtitle(filter)}</p>
              </div>
              <ToggleFilter
                options={[
                  { value: 'Week', label: t('filters.week') },
                  { value: 'Month', label: t('filters.month') },
                  { value: 'Year', label: t('filters.year') }
                ]}
                active={filter}
                onChange={setFilter}
              />
            </div>

            <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col justify-center">
              <EnhancedLineChart color={isIncome ? '#22C55E' : '#3B82F6'} period={filter} heightPixels={300} />
            </div>
          </div>

          <Card
            title={isIncome ? t('breakdown.incomeSources') : t('breakdown.expenseCategories')}
            action={<button className="text-opex-teal text-xs font-bold hover:underline">{t('breakdown.fullAnalytics')}</button>}
          >
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex flex-col items-center gap-4">
                <MiniPieChart type={isIncome ? 'income' : 'expense'} />
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('breakdown.activeRate')}</p>
                  <p className="text-xl font-black text-gray-900">82.4%</p>
                </div>
              </div>
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                {sources.map((source) => (
                  <div key={`${source.name}-${source.tag}`} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50/50 p-2 -m-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${source.color} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>{source.icon}</div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{source.name}</p>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{source.tag}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(source.amount, language)}</span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-900 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="w-full lg:w-[380px] space-y-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-gray-900">{t('breakdown.activityHistory')}</h3>
            <button className="text-[10px] font-black text-opex-teal uppercase tracking-widest hover:underline">{t('breakdown.downloadCsv')}</button>
          </div>

          <div className="space-y-8">
            {groupedTransactions.map((group) => (
              <div key={group.date} className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {formatDateForLanguage(language, `${group.date}T12:00:00`, { day: 'numeric', month: 'short' })}
                  </span>
                  <span className={`text-[10px] font-black ${isIncome ? 'text-green-500' : 'text-gray-900'}`}>
                    {group.total > 0 ? '+' : '-'}{formatCurrency(Math.abs(group.total), language)}
                  </span>
                </div>
                <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {group.items.map((item) => (
                    <div key={`${group.date}-${item.name}`} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-white text-xs font-bold transition-transform group-hover:scale-105 shadow-sm`}>
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{item.name}</p>
                          <Badge>{item.tag}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${item.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          {item.amount > 0 ? '+' : '-'}{formatCurrency(Math.abs(item.amount), language)}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold">14:24</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" fullWidth className="py-4 border-dashed border-2 hover:border-opex-teal hover:text-opex-teal">
            {t('breakdown.loadMoreTransactions')}
          </Button>
        </div>
      </div>
    </SubpageShell>
  );
};
