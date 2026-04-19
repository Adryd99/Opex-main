export const appEn = {
  navigation: {
    dashboard: 'Dashboard',
    budget: 'Budget',
    taxes: 'Taxes',
    invoicing: 'Invoicing',
    settings: 'Settings',
    logOut: 'Log out'
  },
  pageTitles: {
    overview: 'Overview',
    budget: 'Budget',
    taxBuffer: 'Tax Buffer',
    invoicing: 'Invoicing',
    incomeBreakdown: 'Income Breakdown',
    expenseBreakdown: 'Expense Breakdown',
    incomeTransactions: 'Income Transactions',
    expenseTransactions: 'Expense Transactions',
    financialInsights: 'Financial Insights',
    allActivity: 'All Activity',
    settings: 'Settings',
    newTransaction: 'New Transaction',
    opex: 'Opex'
  },
  quickActions: {
    title: 'Quick Actions',
    addIncome: 'Add Income',
    addExpense: 'Add Expense',
    openBanking: 'Open Banking'
  },
  accountSelector: {
    selectAccount: 'Select Account',
    allProviders: 'All Providers',
    combined: 'Combined',
    provider: 'Provider'
  },
  topBar: {
    globalSearch: 'Global search...'
  },
  workspacePreparation: {
    badge: 'Opex Workspace',
    title: 'Preparing your workspace',
    description: 'We are syncing your profile, security status and latest banking data before the app opens.'
  },
  notifications: {
    title: 'Notifications',
    markAsRead: 'Mark as read',
    noNotifications: 'No notifications',
    viewAll: 'View all notifications'
  },
  status: {
    dismiss: 'Dismiss',
    authTitle: 'Keycloak authentication',
    retryLogin: 'Retry login',
    syncTitle: 'Synchronizing bank data',
    syncInProgress: 'Sync in progress, please wait...',
    preparingSync: 'Preparing synchronization...',
    retrySync: 'Retry sync'
  },
  subpage: {
    back: 'Back'
  }
} as const;
