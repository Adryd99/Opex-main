export const appIt = {
  navigation: {
    dashboard: 'Dashboard',
    budget: 'Budget',
    taxes: 'Tasse',
    invoicing: 'Fatturazione',
    settings: 'Impostazioni',
    logOut: 'Esci'
  },
  pageTitles: {
    overview: 'Panoramica',
    budget: 'Budget',
    taxBuffer: 'Tax Buffer',
    invoicing: 'Fatturazione',
    incomeBreakdown: 'Dettaglio entrate',
    expenseBreakdown: 'Dettaglio uscite',
    incomeTransactions: 'Transazioni in entrata',
    expenseTransactions: 'Transazioni in uscita',
    financialInsights: 'Insight finanziari',
    allActivity: 'Tutta l’attività',
    settings: 'Impostazioni',
    newTransaction: 'Nuova transazione',
    opex: 'Opex'
  },
  quickActions: {
    title: 'Azioni rapide',
    addIncome: 'Aggiungi entrata',
    addExpense: 'Aggiungi uscita',
    openBanking: 'Open Banking'
  },
  accountSelector: {
    selectAccount: 'Seleziona account',
    allProviders: 'Tutti i provider',
    combined: 'Combinato',
    provider: 'Provider'
  },
  topBar: {
    globalSearch: 'Ricerca globale...'
  },
  workspacePreparation: {
    badge: 'Workspace Opex',
    title: 'Stiamo preparando il tuo workspace',
    description: 'Stiamo sincronizzando il tuo profilo, lo stato di sicurezza e gli ultimi dati bancari prima di aprire l’app.'
  },
  notifications: {
    title: 'Notifiche',
    markAsRead: 'Segna come lette',
    noNotifications: 'Nessuna notifica',
    viewAll: 'Vedi tutte le notifiche'
  },
  status: {
    dismiss: 'Chiudi',
    authTitle: 'Autenticazione Keycloak',
    retryLogin: 'Riprova login',
    syncTitle: 'Sincronizzazione dati bancari',
    syncInProgress: 'Sincronizzazione in corso, attendi...',
    preparingSync: 'Preparazione sincronizzazione...',
    retrySync: 'Riprova sincronizzazione'
  },
  subpage: {
    back: 'Indietro'
  }
} as const;
