import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAppLanguage } from '../../../i18n';
import { Card } from '../../../shared/ui';
import { formatTaxDate, formatTaxMoney } from '../support';

type TaxBufferSummaryCardProps = {
  summary: {
    shouldSetAside: number;
    alreadySaved: number;
    missing: number;
    completionPercentage: number;
    weeklyTarget: number;
    targetDate: string | null;
  };
};

export const TaxBufferSummaryCard = ({ summary }: TaxBufferSummaryCardProps) => {
  const { t } = useTranslation('taxes');
  const { language } = useAppLanguage();

  return (
    <Card className="border-opex-teal/10 shadow-lg shadow-teal-900/5 dark:bg-gradient-to-br dark:from-app-surface dark:to-opex-teal/5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mb-8">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-app-tertiary">{t('summary.shouldSetAside')}</p>
          <p className="text-3xl font-black text-app-primary">{formatTaxMoney(summary.shouldSetAside, 'EUR', language)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-app-tertiary">{t('summary.alreadySaved')}</p>
          <p className="text-3xl font-black text-opex-teal">{formatTaxMoney(summary.alreadySaved, 'EUR', language)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest">{t('summary.missing')}</p>
          <p className="text-3xl font-black text-app-primary">{formatTaxMoney(summary.missing, 'EUR', language)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-app-muted">
          <div
            className="h-full bg-opex-teal transition-all duration-1000 ease-out"
            style={{ width: `${Math.max(0, Math.min(summary.completionPercentage, 100))}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs font-bold text-app-tertiary">
          <span className="flex items-center gap-1.5">
            <Info size={14} />
            {t('summary.savePerWeek', {
              amount: formatTaxMoney(summary.weeklyTarget, 'EUR', language),
              date: formatTaxDate(summary.targetDate, language)
            })}
          </span>
          <span className="text-app-primary">{t('summary.complete', { value: Math.round(summary.completionPercentage) })}</span>
        </div>
      </div>
    </Card>
  );
};
