import { Info } from 'lucide-react';
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

export const TaxBufferSummaryCard = ({ summary }: TaxBufferSummaryCardProps) => (
  <Card className="border-opex-teal/10 shadow-lg shadow-teal-900/5">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mb-8">
      <div className="space-y-1">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">You should set aside</p>
        <p className="text-3xl font-black text-gray-900">{formatTaxMoney(summary.shouldSetAside)}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Already saved</p>
        <p className="text-3xl font-black text-opex-teal">{formatTaxMoney(summary.alreadySaved)}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Missing</p>
        <p className="text-3xl font-black text-gray-900">{formatTaxMoney(summary.missing)}</p>
      </div>
    </div>

    <div className="space-y-4">
      <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden relative">
        <div
          className="h-full bg-opex-teal transition-all duration-1000 ease-out"
          style={{ width: `${Math.max(0, Math.min(summary.completionPercentage, 100))}%` }}
        />
      </div>
      <div className="flex justify-between items-center text-xs font-bold text-gray-400">
        <span className="flex items-center gap-1.5">
          <Info size={14} />
          Save {formatTaxMoney(summary.weeklyTarget)}/week - target {formatTaxDate(summary.targetDate)}
        </span>
        <span className="text-gray-900">{Math.round(summary.completionPercentage)}% Complete</span>
      </div>
    </div>
  </Card>
);
