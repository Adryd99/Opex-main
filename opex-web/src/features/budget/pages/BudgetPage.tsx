import { AlertTriangle, Calendar, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AccountSelector, QuickActions } from '../../../app/layout';
import { useAppLanguage } from '../../../i18n';
import { formatCurrency } from '../../../shared/formatting';
import { Badge, type BadgeVariant } from '../../../shared/ui';
import { ForecastResponse, TimeAggregatedRecord } from '../../../shared/types';
import { ForecastCompactWidget } from '../components/ForecastCompactWidget';

type BudgetPageProps = {
  onNavigate: (tab: string) => void;
  selectedProviderName: string | null;
  aggregatedSummary: {
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
  };
  timeAggregatedSummary: TimeAggregatedRecord;
  forecastData?: ForecastResponse | null;
};

type RiskStyles = {
  bg: string;
  border: string;
  text: string;
  iconBg: string;
  iconText: string;
  badge: BadgeVariant;
  label: string;
  message: string;
};

export const BudgetPage = ({
  onNavigate,
  selectedProviderName,
  aggregatedSummary,
  timeAggregatedSummary,
  forecastData
}: BudgetPageProps) => {
  const { t } = useTranslation('budget');
  const { language } = useAppLanguage();

  const clientConcentration = 62;
  const totalBalance = Number(aggregatedSummary.totalBalance || 0);
  const totalIncome = Number(aggregatedSummary.totalIncome || 0);
  const totalExpenses = Number(aggregatedSummary.totalExpenses || 0);
  const safeToSpend = totalBalance - totalExpenses;
  const monthlyBurn = Math.max(totalExpenses, 1);
  const runwayMonths = totalBalance / monthlyBurn;
  const runwayProgress = Math.max(0, Math.min((runwayMonths / 3) * 100, 100));

  const getRiskStyles = (val: number): RiskStyles => {
    if (val > 70) {
      return {
        bg: 'bg-red-50/50',
        border: 'border-red-100',
        text: 'text-red-600',
        iconBg: 'bg-red-100',
        iconText: 'text-red-600',
        badge: 'danger',
        label: t('page.highRisk'),
        message: t('page.highRiskMessage')
      };
    }

    return {
      bg: 'bg-orange-50/50',
      border: 'border-orange-100',
      text: 'text-orange-600',
      iconBg: 'bg-orange-100',
      iconText: 'text-orange-600',
      badge: 'warning',
      label: t('page.moderateRisk'),
      message: t('page.moderateRiskMessage')
    };
  };

  const risk = getRiskStyles(clientConcentration);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1 relative z-20">
        <div>
          <h2 className="text-xl font-bold text-app-primary">{t('page.title')}</h2>
          <p className="text-xs font-semibold text-app-secondary">
            {selectedProviderName ? t('page.providerSelected', { provider: selectedProviderName }) : t('page.providerAll')}
          </p>
        </div>
        <div className="flex items-center gap-2 scale-90 origin-right">
          <AccountSelector />
          <QuickActions onNavigate={onNavigate} />
        </div>
      </div>

      <div className="relative flex min-h-[130px] flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-app-border bg-app-surface px-5 py-4 shadow-sm">
        <div className="absolute top-0 right-0 p-10 bg-opex-teal/5 rounded-full translate-x-6 -translate-y-6 blur-xl" />
        <p className="relative z-10 mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-app-tertiary">{t('page.safeToSpend')}</p>
        <div className="relative z-10">
          <span className="text-5xl font-black tracking-tight text-app-primary">
            {formatCurrency(Math.max(safeToSpend, 0), language)}
          </span>
        </div>
        <div className="text-center relative z-10">
          <p className="text-xs font-bold text-app-primary">{t('page.safeAmountDescription')}</p>
          <p className="text-[10px] font-bold text-app-tertiary">
            {t('page.incomeExpensesSummary', {
              income: formatCurrency(totalIncome, language),
              expenses: formatCurrency(totalExpenses, language)
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 items-stretch">
        <div className={`${clientConcentration > 50 ? 'lg:col-span-6' : 'lg:col-span-10'}`}>
          <div className="flex h-full flex-col justify-center rounded-[2rem] border border-app-border bg-app-surface p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-app-tertiary">{t('page.financialRunway')}</p>
                  <h3 className="text-xl font-black text-app-primary">{t('page.monthsOfCoverage', { count: runwayMonths.toFixed(1) })}</h3>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-tighter text-app-tertiary">
                  <span className="text-emerald-600 font-black">{t('page.reachedTarget', { progress: Math.round(runwayProgress) })}</span> • {t('page.targetMonths')}
                </p>
              </div>
            </div>
            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-app-muted">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${runwayProgress}%` }} />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-tight text-app-tertiary">
              {t('page.basedOnExpenses', { amount: formatCurrency(totalExpenses, language) })}
            </p>
          </div>
        </div>

        {clientConcentration > 50 && (
          <div className="lg:col-span-4 relative">
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[2rem] bg-app-surface/75 backdrop-blur-sm pointer-events-auto select-none">
              <div className="flex flex-col items-center gap-2 text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-app-muted">
                  <Lock size={20} className="text-app-tertiary" />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight text-app-primary">{t('page.comingSoon')}</p>
                  <p className="mt-0.5 max-w-xs text-xs font-medium text-app-tertiary">{t('page.clientRiskComingSoon')}</p>
                </div>
              </div>
            </div>
            <div className={`${risk.bg} rounded-[2rem] p-5 border ${risk.border} h-full flex flex-col justify-center pointer-events-none select-none`} style={{ filter: 'blur(2px)', opacity: 0.5 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${risk.iconBg} flex items-center justify-center ${risk.iconText}`}>
                    <AlertTriangle size={20} />
                  </div>
                  <p className={`text-[10px] font-black ${risk.iconText} uppercase tracking-widest`}>{t('page.clientRisk')}</p>
                </div>
                <Badge variant={risk.badge}>{risk.label}</Badge>
              </div>
              <p className="text-sm font-bold leading-tight text-app-primary">
                <span className={`${risk.text} text-lg`}>{t('page.revenueFromOneClient', { value: clientConcentration })}</span>
              </p>
              <p className="mt-1 text-[10px] font-bold text-app-tertiary">{risk.message}</p>
            </div>
          </div>
        )}
      </div>

      <div className="scale-[0.99] origin-top">
        <ForecastCompactWidget timeAggregatedSummary={timeAggregatedSummary} forecastData={forecastData} />
      </div>
    </div>
  );
};
