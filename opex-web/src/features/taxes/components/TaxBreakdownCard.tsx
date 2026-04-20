import { Calculator, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAppLanguage } from '../../../i18n';
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

export const TaxBreakdownCard = ({ incomeSocial, vat }: TaxBreakdownCardProps) => {
  const { t } = useTranslation('taxes');
  const { language } = useAppLanguage();

  return (
    <Card title={t('breakdown.title')}>
      <div className="grid grid-cols-1 gap-12 divide-y divide-app-border md:grid-cols-2 md:divide-x md:divide-y-0">
        <div className="space-y-6 pb-6 md:pb-0 md:pr-12">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-app-muted text-app-secondary">
              <Calculator size={16} />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest text-app-primary">{t('breakdown.incomeSocial')}</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-app-secondary">{t('breakdown.taxableIncome')}</span>
              <span className="font-bold text-app-primary">{formatTaxMoney(incomeSocial.taxableIncome, 'EUR', language)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-app-secondary">{t('breakdown.incomeTax')}</span>
              <span className="font-bold text-app-primary">{formatTaxMoney(incomeSocial.incomeTax, 'EUR', language)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-app-secondary">{t('breakdown.socialContributions')}</span>
              <span className="font-bold text-app-primary">{formatTaxMoney(incomeSocial.socialContributions, 'EUR', language)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-app-border pt-3">
              <span className="text-[10px] font-black uppercase text-app-tertiary">{t('breakdown.subtotal')}</span>
              <span className="text-lg font-black text-opex-teal">{formatTaxMoney(incomeSocial.subtotal, 'EUR', language)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-6 md:pt-0 md:pl-12">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-app-muted text-app-secondary">
              <Receipt size={16} />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest text-app-primary">{t('breakdown.vat')}</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-app-secondary">{t('breakdown.vatRegime')}</span>
              <Badge variant={vat.regime.toLowerCase().includes('kor') ? 'success' : 'neutral'}>
                {vat.regime || t('breakdown.notAvailable')}
              </Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-app-secondary">{t('breakdown.contributionRate')}</span>
              <span className="font-bold text-app-primary">{(vat.rate * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-app-border pt-3">
              <span className="text-[10px] font-black uppercase text-app-tertiary">{t('breakdown.vatLiability')}</span>
              <span className="text-lg font-black text-opex-teal">{formatTaxMoney(vat.vatLiability, 'EUR', language)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
