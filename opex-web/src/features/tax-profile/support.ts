import { UserProfile } from '../../shared/types';

type TaxSetupOption = {
  value: string;
  label: string;
  description: string;
  meta?: string;
};

export const TAX_REGIME_OPTIONS: TaxSetupOption[] = [
  {
    value: 'Forfettario',
    label: 'Forfettario',
    description: 'Flat 5% or 15% tax rate'
  },
  {
    value: 'Ordinario',
    label: 'Ordinario',
    description: 'Standard IRPEF brackets'
  }
];

export const TAX_ACTIVITY_OPTIONS: TaxSetupOption[] = [
  {
    value: 'Professional / Consultant',
    label: 'Professional / Consultant',
    description: 'Freelancers, digital services',
    meta: '78%'
  },
  {
    value: 'Retail & E-commerce',
    label: 'Retail & E-commerce',
    description: 'Online shops, reselling',
    meta: '40%'
  },
  {
    value: 'Food & Hospitality',
    label: 'Food & Hospitality',
    description: 'Restaurants, bars',
    meta: '40%'
  },
  {
    value: 'Construction & Real Estate',
    label: 'Construction & Real Estate',
    description: 'Renovation, property',
    meta: '86%'
  },
  {
    value: 'Other Activities',
    label: 'Other Activities',
    description: 'Other or unsure',
    meta: '67%'
  }
];

export const TAX_RESIDENCE_OPTIONS: TaxSetupOption[] = [
  {
    value: 'Italy (IT)',
    label: 'IT',
    description: 'Italy'
  },
  {
    value: 'Netherlands (NL)',
    label: 'NL',
    description: 'Netherlands'
  },
  {
    value: 'Belgium (BE)',
    label: 'BE',
    description: 'Belgium'
  },
  {
    value: 'Germany (DE)',
    label: 'DE',
    description: 'Germany'
  },
  {
    value: 'Other',
    label: 'Other',
    description: 'Other country'
  }
];

const TAX_PROFILE_REQUIRED_FIELDS = [
  {
    key: 'fiscalResidence',
    label: 'fiscal residence'
  },
  {
    key: 'taxRegime',
    label: 'tax regime'
  },
  {
    key: 'activityType',
    label: 'activity type'
  }
] as const;

export const hasTaxProfileConfigured = (profile: UserProfile): boolean =>
  TAX_PROFILE_REQUIRED_FIELDS.every(({ key }) => (profile[key] ?? '').trim().length > 0);

export const getMissingTaxProfileFields = (profile: UserProfile): string[] =>
  TAX_PROFILE_REQUIRED_FIELDS
    .filter(({ key }) => (profile[key] ?? '').trim().length === 0)
    .map(({ label }) => label);

export const getInitialFiscalResidence = (profile: UserProfile): string => {
  const fiscalResidence = (profile.fiscalResidence ?? '').trim();
  if (fiscalResidence.length > 0) {
    return fiscalResidence;
  }

  const residence = (profile.residence ?? '').trim();
  const matchedResidence = TAX_RESIDENCE_OPTIONS.find((option) => option.value === residence);
  return matchedResidence?.value ?? '';
};
