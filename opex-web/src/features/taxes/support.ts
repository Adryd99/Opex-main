import { TaxBufferDashboardResponse } from '../../shared/types';
export {
  TAX_ACTIVITY_OPTIONS,
  TAX_REGIME_OPTIONS,
  TAX_RESIDENCE_OPTIONS,
  getInitialFiscalResidence,
  hasTaxProfileConfigured
} from '../tax-profile';

const TAX_CURRENCY = 'EUR';

const DEFAULT_TAX_SUMMARY = {
  shouldSetAside: 0,
  alreadySaved: 0,
  missing: 0,
  completionPercentage: 0,
  weeklyTarget: 0,
  safeToSpend: 0,
  targetDate: null
};

const DEFAULT_INCOME_SOCIAL = {
  taxableIncome: 0,
  incomeTax: 0,
  socialContributions: 0,
  subtotal: 0
};

const DEFAULT_VAT = {
  regime: 'N/A',
  rate: 0,
  vatLiability: 0
};

export const formatTaxMoney = (value: number, currency = TAX_CURRENCY): string =>
  new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value);

export const formatTaxDate = (value: string | null | undefined): string => {
  if (!value) {
    return '-';
  }

  return new Date(`${value}T12:00:00`).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const getTaxSummary = (taxBufferDashboard: TaxBufferDashboardResponse | null) =>
  taxBufferDashboard?.summary ?? DEFAULT_TAX_SUMMARY;

export const getTaxIncomeSocial = (taxBufferDashboard: TaxBufferDashboardResponse | null) =>
  taxBufferDashboard?.incomeSocial ?? DEFAULT_INCOME_SOCIAL;

export const getTaxVat = (taxBufferDashboard: TaxBufferDashboardResponse | null) =>
  taxBufferDashboard?.vat ?? DEFAULT_VAT;

export const getTaxLiabilities = (taxBufferDashboard: TaxBufferDashboardResponse | null) => {
  const liabilities = taxBufferDashboard?.liabilitySplit ?? [];

  if (liabilities.length > 0) {
    return liabilities;
  }

  const incomeSocial = getTaxIncomeSocial(taxBufferDashboard);
  const vat = getTaxVat(taxBufferDashboard);

  return [
    { label: 'Income Tax', amount: incomeSocial.incomeTax, percentage: 0 },
    { label: 'Social Contributions', amount: incomeSocial.socialContributions, percentage: 0 },
    { label: 'VAT', amount: vat.vatLiability, percentage: 0 }
  ];
};

export const getSortedTaxDeadlines = (taxBufferDashboard: TaxBufferDashboardResponse | null) => {
  const deadlines = taxBufferDashboard?.deadlines ?? [];

  return [...deadlines].sort((left, right) => {
    const leftTime = left.dueDate ? new Date(`${left.dueDate}T12:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
    const rightTime = right.dueDate ? new Date(`${right.dueDate}T12:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
    return leftTime - rightTime;
  });
};

export const getUpcomingTaxDeadlines = (
  taxBufferDashboard: TaxBufferDashboardResponse | null,
  limit = 4
) => getSortedTaxDeadlines(taxBufferDashboard).slice(0, limit);

export const getTaxBufferActivity = (taxBufferDashboard: TaxBufferDashboardResponse | null) =>
  taxBufferDashboard?.activity ?? [];
