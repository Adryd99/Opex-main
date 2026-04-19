export const dashboardEn = {
  overview: {
    title: 'Financial overview',
    subtitleLoading: 'Welcome back, {{name}}. Syncing the latest data...',
    subtitleReady: "Welcome back, {{name}}. Here's what's happening today.",
    providerAll: 'Provider: All',
    providerSelected: 'Provider: {{provider}}',
    monthlyInsight: 'Monthly insight',
    comingSoon: 'Coming soon',
    monthlyInsightWaitingTitle: 'Waiting for backend synchronization...',
    monthlyInsightWaitingDescription: 'The dashboard is waiting for the latest backend data before generating an insight.',
    monthlyInsightUnavailableTitle: 'Monthly insight unavailable.',
    monthlyInsightUnavailableDescription: 'No insight available right now.',
    totalBalance: 'Total balance',
    liveBackendData: 'Live backend data',
    totalIncome: 'Total income',
    totalExpenses: 'Total expenses',
    syncShort: 'sync...',
    monthShort: 'month',
    spendingTrend: 'Spending trend',
    recentActivity: 'Recent activity',
    sync: 'Sync',
    viewAll: 'View all',
    transaction: 'Transaction',
    category: 'Category',
    amount: 'Amount',
    noSynchronizedActivity: 'No synchronized activity yet.',
    nameFallback: 'there',
    chartLabels: {
      week: {
        mon: 'Mon',
        tue: 'Tue',
        wed: 'Wed',
        thu: 'Thu',
        fri: 'Fri',
        sat: 'Sat',
        sun: 'Sun'
      },
      month: {
        w1: 'W1',
        w2: 'W2',
        w3: 'W3',
        w4: 'W4'
      },
      year: {
        q1: 'Q1',
        q2: 'Q2',
        q3: 'Q3',
        q4: 'Q4'
      }
    }
  },
  filters: {
    week: 'Week',
    month: 'Month',
    year: 'Year'
  },
  recurring: {
    title: 'Recurring',
    comingSoon: 'Coming soon',
    inDevelopment: 'In development',
    income: 'Income',
    expenses: 'Expenses',
    next: 'Next'
  },
  breakdown: {
    incomeTitle: 'Income',
    expensesTitle: 'Expenses',
    incomeBreakdown: 'Income breakdown',
    expenseBreakdown: 'Expense breakdown',
    subtitleWeekIncome: 'Current week activity recap',
    subtitleMonthIncome: 'Last 30 days financial analysis',
    subtitleYearIncome: 'Full year revenue breakdown',
    subtitleWeekExpenses: 'Current week spending recap',
    subtitleMonthExpenses: 'Last 30 days spending analysis',
    subtitleYearExpenses: 'Full year spending breakdown',
    analysisFallback: 'Analysis',
    incomeSources: 'Income sources',
    expenseCategories: 'Expense categories',
    fullAnalytics: 'Full analytics',
    activeRate: 'Active rate',
    activityHistory: 'Activity history',
    downloadCsv: 'Download CSV',
    loadMoreTransactions: 'Load more transactions'
  },
  transactions: {
    allActivity: 'All activity',
    historyTitle: 'Transaction history',
    historyDescription: 'Comprehensive list of all your fiscal movements.',
    all: 'All',
    in: 'In',
    out: 'Out',
    filters: 'Filters',
    noTransactions: 'No transactions found for this filter.',
    transactionFallback: 'Transaction',
    incomeFallback: 'Income',
    expenseFallback: 'Expense'
  },
  insights: {
    title: 'Financial insights',
    hubTitle: 'Intelligence hub',
    hubDescription: 'Deep analysis of your current financial ecosystem',
    overallScore: 'Overall score',
    previous: 'Previous',
    peerAverage: 'Peer avg.',
    excellent: 'Excellent',
    smartAlertsTitle: 'Smart alerts',
    smartAlertsDescription: 'Our AI is learning your patterns. Real-time push notifications for spending anomalies and cashflow peaks are in development.',
    joinWaitlist: 'Join waitlist',
    tags: {
      risk: 'Risk',
      growth: 'Growth'
    },
    items: {
      concentrationAlert: {
        title: 'Concentration alert',
        description: 'Your revenue is highly dependent on Nebula Corp (45% of total). We recommend diversifying your client base to mitigate risk and reduce single-source reliance.',
        cta: 'Analyze client mix'
      },
      trendSignal: {
        title: 'Trend signal',
        description: 'Identified a consistent 12% monthly growth in subscription revenue. Projecting an additional €5,400 by the end of Q4 if the current trajectory remains stable.',
        cta: 'View projections'
      }
    }
  },
  addTransaction: {
    addIncome: 'Add income',
    addExpense: 'Add expense',
    amount: 'Transaction amount',
    localAccount: 'Local account',
    localAccountLabel: 'Local account',
    noLocalAccount: 'No local account available.',
    noLocalAccountDescription: 'Create a manual account before adding income or expenses.',
    selectCategory: 'Select category',
    details: 'Transaction details',
    notePlaceholder: 'Add a note or description...',
    saving: 'Saving...',
    confirm: 'Confirm transaction',
    amountError: 'Please enter a valid amount greater than 0.',
    accountError: 'Please select a bank account before saving.',
    submitError: 'Unable to create transaction.',
    categories: {
      salary: 'Salary',
      freelance: 'Freelance',
      gift: 'Gift',
      investment: 'Investment',
      other: 'Other',
      groceries: 'Groceries',
      food: 'Food',
      transport: 'Transport',
      home: 'Home',
      shopping: 'Shopping',
      software: 'Software',
      taxes: 'Taxes',
      general: 'General'
    }
  }
} as const;
