import { ArrowDownRight, ArrowUp, Calendar, Clock, Edit2, Globe, History } from 'lucide-react';
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
}: TaxSidebarCardsProps) => (
  <>
    <Card title="Tax Setup" action={<Globe size={18} className="text-gray-400" />}>
      <div className="space-y-4">
        <div className="rounded-[1.5rem] bg-gray-50 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Fiscal Residence</span>
            <span className="text-sm font-black text-gray-900">{userProfile.fiscalResidence || 'Not configured'}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Tax Regime</span>
            <span className="text-sm font-black text-gray-900">{userProfile.taxRegime || 'Not configured'}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Activity Type</span>
            <span className="text-sm font-black text-gray-900 text-right">{userProfile.activityType || 'Not configured'}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">VAT Filing</span>
            <span className="text-sm font-black text-gray-900">{userProfile.vatFrequency}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 font-medium leading-relaxed">
          These values drive tax estimates, compliance suggestions, and country-specific guidance.
        </p>
        <Button
          variant="outline"
          size="sm"
          fullWidth
          icon={Edit2}
          onClick={onOpenTaxSettings}
        >
          {isTaxProfileConfigured ? 'Update Tax Setup' : 'Complete Tax Setup'}
        </Button>
      </div>
    </Card>

    <Card title="Tax Deadlines" action={<Calendar size={18} className="text-gray-400" />}>
      <div className="space-y-5">
        {nextDeadlines.length === 0 && (
          <p className="text-sm text-gray-500 font-medium">No upcoming deadlines.</p>
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
                    {item.periodLabel ? `${item.periodLabel} - ` : ''}{formatTaxDate(item.dueDate)}
                  </p>
                </div>
              </div>
              <Badge variant={badgeVariant}>{item.status}</Badge>
            </div>
          );
        })}
      </div>
    </Card>

    <Card title="Buffer Activity" action={<History size={18} className="text-gray-400" />}>
      <div className="space-y-6">
        {activity.length === 0 && (
          <p className="text-sm text-gray-500 font-medium">No recent activity.</p>
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
                  <p className="text-xs text-gray-400">{formatTaxDate(item.date)}</p>
                </div>
              </div>
              <span className={`text-sm font-bold ${isIn ? 'text-green-600' : 'text-gray-900'}`}>
                {isIn ? '+' : '-'}{formatTaxMoney(Math.abs(item.amount))}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  </>
);
