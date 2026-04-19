export const budgetEn = {
  page: {
    title: 'Budget control',
    providerAll: 'Provider: All',
    providerSelected: 'Provider: {{provider}}',
    safeToSpend: 'Safe to spend',
    safeAmountDescription: 'Safe amount you can withdraw this month',
    incomeExpensesSummary: 'Income {{income}} • Expenses {{expenses}}',
    financialRunway: 'Financial runway',
    monthsOfCoverage: '{{count}} months of coverage',
    reachedTarget: '{{progress}}% reached',
    targetMonths: 'Target: 3 months',
    basedOnExpenses: 'Based on your aggregated expenses of {{amount}}',
    clientRisk: 'Client risk',
    highRisk: 'High risk',
    moderateRisk: 'Moderate risk',
    highRiskMessage: 'Revenue is highly concentrated. Diversification recommended.',
    moderateRiskMessage: 'Revenue is moderately concentrated. Consider diversification.',
    revenueFromOneClient: '{{value}}% of revenue comes from 1 client',
    clientRiskComingSoon: 'Client risk analysis in development.',
    comingSoon: 'Coming soon'
  },
  forecast: {
    title: 'Forecast',
    income: 'Income',
    expense: 'Expense',
    net: 'Net',
    noData: 'No data',
    forecast: 'Forecast',
    estimated: 'est.',
    filters: {
      month: 'Month',
      quarter: 'Quarter',
      year: 'Year'
    }
  }
} as const;
