import { Calculator, Receipt } from 'lucide-react';
import { Badge, Card } from '../../../shared/ui';
import { formatTaxMoney } from '../support';

type TaxBreakdownCardProps = {
  incomeSocial: {
    taxableIncome: number;
    incomeTax: number;
    socialContributions: number;
    subtotal: number;
  };
  vat: {
    regime: string;
    rate: number;
    vatLiability: number;
  };
};

export const TaxBreakdownCard = ({ incomeSocial, vat }: TaxBreakdownCardProps) => (
  <Card title="Detailed Tax Breakdown">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 divide-y md:divide-y-0 md:divide-x divide-gray-100">
      <div className="space-y-6 pb-6 md:pb-0 md:pr-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
            <Calculator size={16} />
          </div>
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Income & Social</h4>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Taxable Income</span>
            <span className="text-gray-900 font-bold">{formatTaxMoney(incomeSocial.taxableIncome)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Income Tax</span>
            <span className="text-gray-900 font-bold">{formatTaxMoney(incomeSocial.incomeTax)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Social Contributions</span>
            <span className="text-gray-900 font-bold">{formatTaxMoney(incomeSocial.socialContributions)}</span>
          </div>
          <div className="pt-3 border-t border-dashed border-gray-100 flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase">Subtotal</span>
            <span className="text-lg font-black text-opex-teal">{formatTaxMoney(incomeSocial.subtotal)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-6 md:pt-0 md:pl-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
            <Receipt size={16} />
          </div>
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Value Added Tax</h4>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">VAT Regime</span>
            <Badge variant={vat.regime.toLowerCase().includes('kor') ? 'success' : 'neutral'}>{vat.regime || 'N/A'}</Badge>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Contribution Rate</span>
            <span className="text-gray-900 font-bold">{(vat.rate * 100).toFixed(0)}%</span>
          </div>
          <div className="pt-3 border-t border-dashed border-gray-100 flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase">VAT Liability</span>
            <span className="text-lg font-black text-opex-teal">{formatTaxMoney(vat.vatLiability)}</span>
          </div>
        </div>
      </div>
    </div>
  </Card>
);
