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

export const TaxComplianceCalendarCard = ({ deadlines }: TaxComplianceCalendarCardProps) => (
  <Card title="2026 Compliance Calendar">
    <div className="space-y-4">
      {deadlines.length === 0 && (
        <p className="text-sm text-gray-500 font-medium">No tax deadlines configured yet.</p>
      )}
      {deadlines.map((item) => {
        const isOverdue = item.status.toLowerCase().includes('overdue');
        const isDone = item.status.toLowerCase().includes('paid') || item.status.toLowerCase().includes('completed');
        const badgeVariant: BadgeVariant = isOverdue ? 'danger' : isDone ? 'success' : 'info';

        return (
          <div
            key={`calendar-${item.id || `${item.title}-${item.dueDate}`}`}
            className={`rounded-[1.75rem] border p-5 transition-all ${isOverdue ? 'border-red-100 bg-red-50/70' : 'border-gray-100 bg-white'}`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-black text-gray-900">{item.title}</p>
                  {item.category && <Badge variant="neutral">{item.category}</Badge>}
                  {item.systemGenerated && <Badge variant="info">System</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>{item.periodLabel || 'Custom deadline'}</span>
                  <span>Due {formatTaxDate(item.dueDate)}</span>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.description}</p>
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
