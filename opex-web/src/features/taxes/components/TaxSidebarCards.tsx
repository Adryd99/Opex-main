import { ArrowDownRight, ArrowUp, Calendar, Clock, Edit2, Globe, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAppLanguage } from '../../../i18n';
import { Badge, Button, Card, type BadgeVariant } from '../../../shared/ui';
import { UserProfile } from '../../../shared/types';
import { formatTaxDate, formatTaxMoney } from '../support';

type TaxSidebarCardsProps = {
  userProfile: UserProfile;
  isTaxProfileConfigured: boolean;
  onOpenTaxSettings: () => void;
  nextDeadlines: Array<{
    id?: string | number | null;
    title: string;
    periodLabel?: string | null;
    dueDate?: string | null;
    status: string;
  }>;
  activity: Array<{
    id?: string | number | null;
    title: string;
    date?: string | null;
    direction: string;
    amount: number;
  }>;
};

export const TaxSidebarCards = ({
  userProfile,
  isTaxProfileConfigured,
  onOpenTaxSettings,
  nextDeadlines,
  activity
}: TaxSidebarCardsProps) => {
  const { t } = useTranslation('taxes');
  const { language } = useAppLanguage();

  return (
    <>
      <Card title={t('sidebar.setupTitle')} action={<Globe size={18} className="text-gray-400" />}>
        <div className="space-y-4">
          <div className="rounded-[1.5rem] bg-gray-50 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('sidebar.fiscalResidence')}</span>
              <span className="text-sm font-black text-gray-900">{userProfile.fiscalResidence || t('sidebar.notConfigured')}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('sidebar.taxRegime')}</span>
              <span className="text-sm font-black text-gray-900">{userProfile.taxRegime || t('sidebar.notConfigured')}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('sidebar.activityType')}</span>
              <span className="text-sm font-black text-gray-900 text-right">{userProfile.activityType || t('sidebar.notConfigured')}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('sidebar.vatFiling')}</span>
              <span className="text-sm font-black text-gray-900">{userProfile.vatFrequency || t('sidebar.notConfigured')}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">{t('sidebar.setupDescription')}</p>
          <Button variant="outline" size="sm" fullWidth icon={Edit2} onClick={onOpenTaxSettings}>
            {isTaxProfileConfigured ? t('sidebar.updateSetup') : t('sidebar.completeSetup')}
          </Button>
        </div>
      </Card>

      <Card title={t('sidebar.deadlinesTitle')} action={<Calendar size={18} className="text-gray-400" />}>
        <div className="space-y-5">
          {nextDeadlines.length === 0 && (
            <p className="text-sm text-gray-500 font-medium">{t('sidebar.noUpcomingDeadlines')}</p>
          )}
          {nextDeadlines.map((item) => {
            const status = item.status.toLowerCase();
            const badgeVariant: BadgeVariant = status.includes('overdue')
              ? 'danger'
              : status.includes('paid') || status.includes('completed')
                ? 'success'
                : 'info';

            return (
              <div key={item.id || `${item.title}-${item.dueDate}`} className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status.includes('overdue') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-none mb-1">{item.title}</p>
                    <p className="text-xs text-gray-400 font-medium">
                      {item.periodLabel ? `${item.periodLabel} - ` : ''}{formatTaxDate(item.dueDate, language)}
                    </p>
                  </div>
                </div>
                <Badge variant={badgeVariant}>{item.status}</Badge>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title={t('sidebar.activityTitle')} action={<History size={18} className="text-gray-400" />}>
        <div className="space-y-6">
          {activity.length === 0 && (
            <p className="text-sm text-gray-500 font-medium">{t('sidebar.noRecentActivity')}</p>
          )}
          {activity.map((item) => {
            const isIn = item.direction.toLowerCase().includes('in');
            return (
              <div key={item.id || `${item.title}-${item.date}`} className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIn ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {isIn ? <ArrowUp size={16} /> : <ArrowDownRight size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-none mb-1">{item.title}</p>
                    <p className="text-xs text-gray-400">{formatTaxDate(item.date, language)}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${isIn ? 'text-green-600' : 'text-gray-900'}`}>
                  {isIn ? '+' : '-'}{formatTaxMoney(Math.abs(item.amount), 'EUR', language)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
};
