import { UserProfile } from '../../shared/types';

type TaxSetupOption = {
  value: string;
  label?: string;
  labelKey?: string;
  descriptionKey: string;
  meta?: string;
};

export const TAX_REGIME_OPTIONS: TaxSetupOption[] = [
  {
    value: 'Forfettario',
    labelKey: 'settings:taxForm.regime.forfettarioLabel',
    descriptionKey: 'settings:taxForm.regime.forfettarioDescription'
  },
  {
    value: 'Ordinario',
    labelKey: 'settings:taxForm.regime.ordinarioLabel',
    descriptionKey: 'settings:taxForm.regime.ordinarioDescription'
  }
];

export const TAX_ACTIVITY_OPTIONS: TaxSetupOption[] = [
  {
    value: 'Professional / Consultant',
    labelKey: 'settings:taxForm.activity.professionalLabel',
    descriptionKey: 'settings:taxForm.activity.professionalDescription',
    meta: '78%'
  },
  {
    value: 'Retail & E-commerce',
    labelKey: 'settings:taxForm.activity.retailLabel',
    descriptionKey: 'settings:taxForm.activity.retailDescription',
    meta: '40%'
  },
  {
    value: 'Food & Hospitality',
    labelKey: 'settings:taxForm.activity.foodLabel',
    descriptionKey: 'settings:taxForm.activity.foodDescription',
    meta: '40%'
  },
  {
    value: 'Construction & Real Estate',
    labelKey: 'settings:taxForm.activity.constructionLabel',
    descriptionKey: 'settings:taxForm.activity.constructionDescription',
    meta: '86%'
  },
  {
    value: 'Other Activities',
    labelKey: 'settings:taxForm.activity.otherLabel',
    descriptionKey: 'settings:taxForm.activity.otherDescription',
    meta: '67%'
  }
];

export const TAX_RESIDENCE_OPTIONS: TaxSetupOption[] = [
  {
    value: 'Italy (IT)',
    label: 'IT',
    descriptionKey: 'settings:taxForm.residence.italy'
  },
  {
    value: 'Netherlands (NL)',
    label: 'NL',
    descriptionKey: 'settings:taxForm.residence.netherlands'
  },
  {
    value: 'Belgium (BE)',
    label: 'BE',
    descriptionKey: 'settings:taxForm.residence.belgium'
  },
  {
    value: 'Germany (DE)',
    label: 'DE',
    descriptionKey: 'settings:taxForm.residence.germany'
  },
  {
    value: 'Other',
    label: 'Other',
    descriptionKey: 'settings:taxForm.residence.other'
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
