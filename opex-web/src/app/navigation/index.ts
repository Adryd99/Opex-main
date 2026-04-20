export const APP_TABS = {
  DASHBOARD: 'DASHBOARD',
  BUDGET: 'BUDGET',
  TAXES: 'TAXES',
  INVOICING: 'INVOICING',
  RECURRING: 'RECURRING',
  INCOME: 'INCOME',
  EXPENSES: 'EXPENSES',
  TRANSACTIONS_IN: 'TRANSACTIONS_IN',
  TRANSACTIONS_OUT: 'TRANSACTIONS_OUT',
  INSIGHTS: 'INSIGHTS',
  ALL_ACTIVITY: '[]',
  SETTINGS: 'SETTINGS',
  QUICK_INCOME: 'QUICK_INCOME',
  QUICK_EXPENSE: 'QUICK_EXPENSE',
  QUICK_INVOICE: 'QUICK_INVOICE',
  SETTINGS_TAXES: 'SETTINGS_TAXES',
  SETTINGS_BANKING: 'SETTINGS_BANKING',
  SETTINGS_RENEW_CONSENT: 'SETTINGS_RENEW_CONSENT',
  BANKING: 'BANKING'
} as const;

export type AppTab = (typeof APP_TABS)[keyof typeof APP_TABS];
type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

const MAIN_TABS = [
  APP_TABS.DASHBOARD,
  APP_TABS.BUDGET,
  APP_TABS.TAXES,
  APP_TABS.SETTINGS
] as const;

export type MainAppTab = (typeof MAIN_TABS)[number];

const APP_TAB_SET = new Set<AppTab>(Object.values(APP_TABS));
const MAIN_TAB_SET = new Set<MainAppTab>(MAIN_TABS);
const SETTINGS_ROOT_TAB_SET = new Set<AppTab>([
  APP_TABS.SETTINGS_TAXES,
  APP_TABS.SETTINGS_BANKING
]);
const SUBPAGE_TAB_SET = new Set<AppTab>([
  APP_TABS.INCOME,
  APP_TABS.EXPENSES,
  APP_TABS.TRANSACTIONS_IN,
  APP_TABS.TRANSACTIONS_OUT,
  APP_TABS.INSIGHTS,
  APP_TABS.ALL_ACTIVITY,
  APP_TABS.QUICK_INCOME,
  APP_TABS.QUICK_EXPENSE,
  APP_TABS.QUICK_INVOICE
]);
const DASHBOARD_MOBILE_TAB_SET = new Set<AppTab>([
  APP_TABS.INCOME,
  APP_TABS.EXPENSES,
  APP_TABS.ALL_ACTIVITY
]);
const BUDGET_MOBILE_TAB_SET = new Set<AppTab>([
  APP_TABS.INSIGHTS
]);
const LEGACY_TAB_ALIASES: Record<string, AppTab> = {
  [APP_TABS.BANKING]: APP_TABS.SETTINGS_BANKING,
  ADD_BANK: APP_TABS.SETTINGS_BANKING,
  OPEN_BANKING: APP_TABS.SETTINGS_BANKING,
  SETTINGS_ADD_BANK: APP_TABS.SETTINGS_BANKING,
  SETTINGS_OPEN_BANKING: APP_TABS.SETTINGS_BANKING
};

export const DEFAULT_APP_TAB: MainAppTab = APP_TABS.DASHBOARD;

export const isAppTab = (value: string): value is AppTab =>
  APP_TAB_SET.has(value as AppTab);

export const normalizeAppTab = (value: string): AppTab => {
  const aliasTarget = LEGACY_TAB_ALIASES[value];
  if (aliasTarget) {
    return aliasTarget;
  }

  return isAppTab(value) ? value : DEFAULT_APP_TAB;
};

export const isMainAppTab = (tab: AppTab): tab is MainAppTab =>
  MAIN_TAB_SET.has(tab as MainAppTab);

export const isSettingsTab = (tab: AppTab): boolean =>
  tab.startsWith('SETTINGS_');

export const isQuickActionTab = (value: string): boolean =>
  value.startsWith('QUICK_')
  || value === APP_TABS.BANKING
  || value === 'ADD_BANK'
  || value === 'OPEN_BANKING'
  || value === 'SETTINGS_ADD_BANK'
  || value === 'SETTINGS_OPEN_BANKING';

export const resolveSettingsNavigationTarget = (value: string): AppTab =>
  isQuickActionTab(value)
    ? normalizeAppTab(value)
    : normalizeAppTab(`SETTINGS_${value}`);

export const getAppPageTitle = (tab: AppTab, t: TranslateFn): string => {
  if (tab === APP_TABS.QUICK_INVOICE) {
    return t('app:pageTitles.invoicing');
  }

  if (isSettingsTab(tab)) {
    return t('app:pageTitles.settings');
  }

  if (tab.startsWith('QUICK_')) {
    return t('app:pageTitles.newTransaction');
  }

  switch (tab) {
    case APP_TABS.DASHBOARD:
      return t('app:pageTitles.overview');
    case APP_TABS.BUDGET:
      return t('app:pageTitles.budget');
    case APP_TABS.TAXES:
      return t('app:pageTitles.taxBuffer');
    case APP_TABS.INVOICING:
      return t('app:pageTitles.invoicing');
    case APP_TABS.INCOME:
      return t('app:pageTitles.incomeBreakdown');
    case APP_TABS.EXPENSES:
      return t('app:pageTitles.expenseBreakdown');
    case APP_TABS.TRANSACTIONS_IN:
      return t('app:pageTitles.incomeTransactions');
    case APP_TABS.TRANSACTIONS_OUT:
      return t('app:pageTitles.expenseTransactions');
    case APP_TABS.INSIGHTS:
      return t('app:pageTitles.financialInsights');
    case APP_TABS.ALL_ACTIVITY:
      return t('app:pageTitles.allActivity');
    case APP_TABS.SETTINGS:
      return t('app:pageTitles.settings');
    default:
      return t('app:pageTitles.opex');
  }
};

export const isSubpageAppTab = (tab: AppTab): boolean =>
  SUBPAGE_TAB_SET.has(tab)
  || (isSettingsTab(tab) && !SETTINGS_ROOT_TAB_SET.has(tab));

export const isDashboardMobileTab = (tab: AppTab): boolean =>
  tab === APP_TABS.DASHBOARD || DASHBOARD_MOBILE_TAB_SET.has(tab);

export const isBudgetMobileTab = (tab: AppTab): boolean =>
  tab === APP_TABS.BUDGET || BUDGET_MOBILE_TAB_SET.has(tab);
