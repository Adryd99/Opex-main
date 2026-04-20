import { useTranslation } from 'react-i18next';

import { useAppLanguage } from '../../../i18n';
import { Badge, Card, type BadgeVariant } from '../../../shared/ui';
import { formatTaxDate } from '../support';

type TaxDeadlineItem = {
  id?: string | number | null;
  title: string;
  category?: string | null;
  systemGenerated?: boolean | null;
  periodLabel?: string | null;
  dueDate?: string | null;
  description?: string | null;
  status: string;
};

type TaxComplianceCalendarCardProps = {
  deadlines: TaxDeadlineItem[];
};

export const TaxComplianceCalendarCard = ({ deadlines }: TaxComplianceCalendarCardProps) => {
  const { t } = useTranslation('taxes');
  const { language } = useAppLanguage();

  return (
    <Card title={t('calendar.title')}>
      <div className="space-y-4">
        {deadlines.length === 0 && (
          <p className="text-sm font-medium text-app-secondary">{t('calendar.noDeadlines')}</p>
        )}
        {deadlines.map((item) => {
          const isOverdue = item.status.toLowerCase().includes('overdue');
          const isDone = item.status.toLowerCase().includes('paid') || item.status.toLowerCase().includes('completed');
          const badgeVariant: BadgeVariant = isOverdue ? 'danger' : isDone ? 'success' : 'info';

          return (
            <div
              key={`calendar-${item.id || `${item.title}-${item.dueDate}`}`}
              className={`rounded-[1.75rem] border p-5 transition-all ${isOverdue ? 'border-red-100 bg-red-50/70 dark:border-red-400/20 dark:bg-red-500/10' : 'border-app-border bg-app-surface'}`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-black text-app-primary">{item.title}</p>
                    {item.category && <Badge variant="neutral">{item.category}</Badge>}
                    {item.systemGenerated && <Badge variant="info">{t('calendar.system')}</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-app-tertiary">
                    <span>{item.periodLabel || t('calendar.customDeadline')}</span>
                    <span>{t('calendar.duePrefix', { date: formatTaxDate(item.dueDate, language) })}</span>
                  </div>
                  {item.description && (
                    <p className="text-sm font-medium leading-relaxed text-app-secondary">{item.description}</p>
                  )}
                </div>
                <Badge variant={badgeVariant}>{item.status}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
