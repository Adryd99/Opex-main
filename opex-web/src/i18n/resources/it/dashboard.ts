export const dashboardIt = {
  overview: {
    title: 'Panoramica finanziaria',
    subtitleLoading: 'Bentornato, {{name}}. Stiamo sincronizzando gli ultimi dati...',
    subtitleReady: 'Bentornato, {{name}}. Ecco cosa sta succedendo oggi.',
    providerAll: 'Provider: Tutti',
    providerSelected: 'Provider: {{provider}}',
    monthlyInsight: 'Insight mensile',
    comingSoon: 'Prossimamente',
    monthlyInsightWaitingTitle: 'In attesa della sincronizzazione backend...',
    monthlyInsightWaitingDescription: 'La dashboard aspetta gli ultimi dati backend prima di generare un insight.',
    monthlyInsightUnavailableTitle: 'Insight mensile non disponibile.',
    monthlyInsightUnavailableDescription: 'Nessun insight disponibile in questo momento.',
    totalBalance: 'Saldo totale',
    liveBackendData: 'Dati backend live',
    totalIncome: 'Entrate totali',
    totalExpenses: 'Uscite totali',
    syncShort: 'sync...',
    monthShort: 'mese',
    spendingTrend: 'Trend spese',
    recentActivity: 'Attività recente',
    sync: 'Sincronizza',
    viewAll: 'Vedi tutto',
    transaction: 'Transazione',
    category: 'Categoria',
    amount: 'Importo',
    noSynchronizedActivity: 'Nessuna attività sincronizzata ancora.',
    nameFallback: 'tu',
    chartLabels: {
      week: {
        mon: 'Lun',
        tue: 'Mar',
        wed: 'Mer',
        thu: 'Gio',
        fri: 'Ven',
        sat: 'Sab',
        sun: 'Dom'
      },
      month: {
        w1: 'S1',
        w2: 'S2',
        w3: 'S3',
        w4: 'S4'
      },
      year: {
        q1: 'T1',
        q2: 'T2',
        q3: 'T3',
        q4: 'T4'
      }
    }
  },
  filters: {
    week: 'Settimana',
    month: 'Mese',
    year: 'Anno'
  },
  recurring: {
    title: 'Ricorrenti',
    comingSoon: 'Prossimamente',
    inDevelopment: 'In sviluppo',
    income: 'Entrate',
    expenses: 'Uscite',
    next: 'Prossima'
  },
  breakdown: {
    incomeTitle: 'Entrate',
    expensesTitle: 'Uscite',
    incomeBreakdown: 'Dettaglio entrate',
    expenseBreakdown: 'Dettaglio uscite',
    subtitleWeekIncome: 'Riepilogo delle attività della settimana corrente',
    subtitleMonthIncome: 'Analisi finanziaria degli ultimi 30 giorni',
    subtitleYearIncome: "Dettaglio dei ricavi dell'intero anno",
    subtitleWeekExpenses: 'Riepilogo delle spese della settimana corrente',
    subtitleMonthExpenses: 'Analisi delle spese degli ultimi 30 giorni',
    subtitleYearExpenses: "Dettaglio delle spese dell'intero anno",
    analysisFallback: 'Analisi',
    incomeSources: 'Fonti di entrata',
    expenseCategories: 'Categorie di spesa',
    fullAnalytics: 'Analisi complete',
    activeRate: 'Tasso attivo',
    activityHistory: 'Storico attività',
    downloadCsv: 'Scarica CSV',
    loadMoreTransactions: 'Carica altre transazioni'
  },
  transactions: {
    allActivity: "Tutta l'attività",
    historyTitle: 'Storico transazioni',
    historyDescription: 'Elenco completo di tutti i tuoi movimenti fiscali.',
    all: 'Tutte',
    in: 'Entrate',
    out: 'Uscite',
    filters: 'Filtri',
    noTransactions: 'Nessuna transazione trovata per questo filtro.',
    transactionFallback: 'Transazione',
    incomeFallback: 'Entrata',
    expenseFallback: 'Uscita'
  },
  insights: {
    title: 'Insight finanziari',
    hubTitle: 'Hub di intelligence',
    hubDescription: 'Analisi approfondita del tuo ecosistema finanziario attuale',
    overallScore: 'Punteggio complessivo',
    previous: 'Precedente',
    peerAverage: 'Media peer',
    excellent: 'Eccellente',
    smartAlertsTitle: 'Smart alerts',
    smartAlertsDescription: 'La nostra AI sta imparando i tuoi pattern. Le notifiche push in tempo reale per anomalie di spesa e picchi di cashflow sono in sviluppo.',
    joinWaitlist: 'Unisciti alla waitlist',
    tags: {
      risk: 'Rischio',
      growth: 'Crescita'
    },
    items: {
      concentrationAlert: {
        title: 'Alert concentrazione',
        description: 'Il tuo fatturato dipende molto da Nebula Corp (45% del totale). Ti consigliamo di diversificare la base clienti per ridurre il rischio e la dipendenza da una sola fonte.',
        cta: 'Analizza il mix clienti'
      },
      trendSignal: {
        title: 'Segnale di trend',
        description: 'Individuato un trend di crescita mensile costante del 12% nei ricavi da subscription. Proiezione di ulteriori €5.400 entro la fine del Q4 se la traiettoria resta stabile.',
        cta: 'Vedi proiezioni'
      }
    }
  },
  addTransaction: {
    addIncome: 'Aggiungi entrata',
    addExpense: 'Aggiungi uscita',
    amount: 'Importo transazione',
    localAccount: 'Account locale',
    localAccountLabel: 'Account locale',
    noLocalAccount: 'Nessun account locale disponibile.',
    noLocalAccountDescription: 'Crea un account manuale prima di aggiungere entrate o uscite.',
    selectCategory: 'Seleziona categoria',
    details: 'Dettagli transazione',
    notePlaceholder: 'Aggiungi una nota o descrizione...',
    saving: 'Salvataggio...',
    confirm: 'Conferma transazione',
    amountError: 'Inserisci un importo valido maggiore di 0.',
    accountError: 'Seleziona un account bancario prima di salvare.',
    submitError: 'Impossibile creare la transazione.',
    categories: {
      salary: 'Stipendio',
      freelance: 'Freelance',
      gift: 'Regalo',
      investment: 'Investimento',
      other: 'Altro',
      groceries: 'Spesa',
      food: 'Cibo',
      transport: 'Trasporti',
      home: 'Casa',
      shopping: 'Shopping',
      software: 'Software',
      taxes: 'Tasse',
      general: 'Generale'
    }
  }
} as const;
