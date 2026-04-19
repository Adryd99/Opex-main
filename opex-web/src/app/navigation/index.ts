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
  SETTINGS_OPEN_BANKING: 'SETTINGS_OPEN_BANKING',
  SETTINGS_ADD_BANK: 'SETTINGS_ADD_BANK',
  SETTINGS_BANK_REDIRECT: 'SETTINGS_BANK_REDIRECT',
  SETTINGS_BANK_SETUP: 'SETTINGS_BANK_SETUP',
  SETTINGS_RENEW_CONSENT: 'SETTINGS_RENEW_CONSENT',
  SETTINGS_CATEGORIES: 'SETTINGS_CATEGORIES',
  SETTINGS_NOTIFICATIONS: 'SETTINGS_NOTIFICATIONS',
  SETTINGS_SUPPORT: 'SETTINGS_SUPPORT',
  ADD_BANK: 'ADD_BANK',
  OPEN_BANKING: 'OPEN_BANKING'
} as const;

export type AppTab = (typeof APP_TABS)[keyof typeof APP_TABS];

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
  APP_TABS.SETTINGS_OPEN_BANKING
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
  APP_TABS.QUICK_INVOICE,
  APP_TABS.SETTINGS_BANK_SETUP
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
  [APP_TABS.ADD_BANK]: APP_TABS.SETTINGS_OPEN_BANKING,
  [APP_TABS.OPEN_BANKING]: APP_TABS.SETTINGS_OPEN_BANKING,
  [APP_TABS.SETTINGS_ADD_BANK]: APP_TABS.SETTINGS_OPEN_BANKING
};

const PAGE_TITLES: Partial<Record<AppTab, string>> = {
  [APP_TABS.DASHBOARD]: 'Overview',
  [APP_TABS.BUDGET]: 'Budget',
  [APP_TABS.TAXES]: 'Tax Buffer',
  [APP_TABS.INVOICING]: 'Invoicing',
  [APP_TABS.INCOME]: 'Income Breakdown',
  [APP_TABS.EXPENSES]: 'Expense Breakdown',
  [APP_TABS.TRANSACTIONS_IN]: 'Income Transactions',
  [APP_TABS.TRANSACTIONS_OUT]: 'Expense Transactions',
  [APP_TABS.INSIGHTS]: 'Financial Insights',
  [APP_TABS.ALL_ACTIVITY]: 'All Activity',
  [APP_TABS.SETTINGS]: 'Settings'
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
  || value === APP_TABS.ADD_BANK
  || value === APP_TABS.OPEN_BANKING
  || value === APP_TABS.SETTINGS_OPEN_BANKING;

export const resolveSettingsNavigationTarget = (value: string): AppTab =>
  isQuickActionTab(value)
    ? normalizeAppTab(value)
    : normalizeAppTab(`SETTINGS_${value}`);

export const getAppPageTitle = (tab: AppTab): string => {
  if (tab === APP_TABS.QUICK_INVOICE) {
    return 'Invoicing';
  }

  if (isSettingsTab(tab)) {
    return 'Settings';
  }

  if (tab.startsWith('QUICK_')) {
    return 'New Transaction';
  }

  return PAGE_TITLES[tab] ?? 'Opex';
};

export const isSubpageAppTab = (tab: AppTab): boolean =>
  SUBPAGE_TAB_SET.has(tab)
  || (isSettingsTab(tab) && !SETTINGS_ROOT_TAB_SET.has(tab));

export const isDashboardMobileTab = (tab: AppTab): boolean =>
  tab === APP_TABS.DASHBOARD || DASHBOARD_MOBILE_TAB_SET.has(tab);

export const isBudgetMobileTab = (tab: AppTab): boolean =>
  tab === APP_TABS.BUDGET || BUDGET_MOBILE_TAB_SET.has(tab);
