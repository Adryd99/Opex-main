export const taxesEn = {
  page: {
    title: 'Tax Buffer',
    providerAll: 'Provider: All',
    providerSelected: 'Provider: {{provider}}',
    profileRequiredTitle: 'Complete your tax profile first',
    profileRequiredDescription: 'Complete your tax profile first to unlock tax estimates and compliance guidance.',
    setupRequiredBadge: 'Tax setup required',
    setupRequiredHeading: 'Configure your tax profile in Settings before using Taxes',
    setupRequiredBody: 'We need your fiscal residence, tax regime and activity type before we can estimate liabilities, show deadlines and build the Tax Buffer dashboard correctly.',
    openTaxSettings: 'Open tax settings',
    settingsHint: 'You will find the same tax setup flow inside Settings > Taxes.',
    loading: 'Loading tax dashboard...'
  },
  summary: {
    shouldSetAside: 'You should set aside',
    alreadySaved: 'Already saved',
    missing: 'Missing',
    savePerWeek: 'Save {{amount}}/week - target {{date}}',
    complete: '{{value}}% complete'
  },
  breakdown: {
    title: 'Detailed tax breakdown',
    incomeSocial: 'Income & social',
    taxableIncome: 'Taxable income',
    incomeTax: 'Income tax',
    socialContributions: 'Social contributions',
    subtotal: 'Subtotal',
    vat: 'Value added tax',
    vatRegime: 'VAT regime',
    contributionRate: 'Contribution rate',
    vatLiability: 'VAT liability',
    notAvailable: 'N/A'
  },
  liabilities: {
    title: 'Liability split'
  },
  calendar: {
    title: '2026 compliance calendar',
    noDeadlines: 'No tax deadlines configured yet.',
    system: 'System',
    customDeadline: 'Custom deadline',
    duePrefix: 'Due {{date}}'
  },
  sidebar: {
    setupTitle: 'Tax setup',
    fiscalResidence: 'Fiscal residence',
    taxRegime: 'Tax regime',
    activityType: 'Activity type',
    vatFiling: 'VAT filing',
    notConfigured: 'Not configured',
    setupDescription: 'These values drive tax estimates, compliance suggestions and country-specific guidance.',
    updateSetup: 'Update tax setup',
    completeSetup: 'Complete tax setup',
    deadlinesTitle: 'Tax deadlines',
    noUpcomingDeadlines: 'No upcoming deadlines.',
    activityTitle: 'Buffer activity',
    noRecentActivity: 'No recent activity.'
  },
  support: {
    incomeTax: 'Income Tax',
    socialContributions: 'Social Contributions',
    vat: 'VAT'
  }
} as const;
