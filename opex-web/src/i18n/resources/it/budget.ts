export const budgetIt = {
  page: {
    title: 'Controllo budget',
    providerAll: 'Provider: Tutti',
    providerSelected: 'Provider: {{provider}}',
    safeToSpend: 'Disponibile da spendere',
    safeAmountDescription: 'Importo sicuro che puoi prelevare questo mese',
    incomeExpensesSummary: 'Entrate {{income}} • Uscite {{expenses}}',
    financialRunway: 'Autonomia finanziaria',
    monthsOfCoverage: '{{count}} mesi di copertura',
    reachedTarget: '{{progress}}% raggiunto',
    targetMonths: 'Target: 3 mesi',
    basedOnExpenses: 'Basato sulle tue uscite aggregate di {{amount}}',
    clientRisk: 'Rischio clienti',
    highRisk: 'Rischio alto',
    moderateRisk: 'Rischio moderato',
    highRiskMessage: 'Il fatturato è molto concentrato. Si consiglia di diversificare.',
    moderateRiskMessage: 'Il fatturato è moderatamente concentrato. Valuta una diversificazione.',
    revenueFromOneClient: '{{value}}% del fatturato arriva da 1 cliente',
    clientRiskComingSoon: 'Analisi del rischio clienti in sviluppo.',
    comingSoon: 'Prossimamente'
  },
  forecast: {
    title: 'Forecast',
    income: 'Entrate',
    expense: 'Uscite',
    net: 'Netto',
    noData: 'Nessun dato',
    forecast: 'Forecast',
    estimated: 'stim.',
    filters: {
      month: 'Mese',
      quarter: 'Trimestre',
      year: 'Anno'
    }
  }
} as const;
