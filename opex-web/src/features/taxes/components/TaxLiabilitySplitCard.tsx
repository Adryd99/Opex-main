import { Card } from '../../../shared/ui';
import { formatTaxMoney } from '../support';

type TaxLiabilitySplitCardProps = {
  liabilities: Array<{
    label: string;
    amount: number;
    percentage: number;
  }>;
};

export const TaxLiabilitySplitCard = ({ liabilities }: TaxLiabilitySplitCardProps) => (
  <Card title="Liability Split">
    <div className="space-y-8 py-2">
      {liabilities.map((item) => (
        <div key={item.label} className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-base font-bold text-gray-500">{item.label}</span>
            <span className="text-lg font-black text-gray-900">{formatTaxMoney(item.amount)}</span>
          </div>
          <div className="w-full h-2.5 bg-gray-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-opex-teal rounded-full transition-all duration-700"
              style={{ width: `${Math.max(0, Math.min(item.percentage || 0, 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </Card>
);
