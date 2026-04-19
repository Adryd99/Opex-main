export const taxesIt = {
  page: {
    title: 'Tax Buffer',
    providerAll: 'Provider: Tutti',
    providerSelected: 'Provider: {{provider}}',
    profileRequiredTitle: 'Completa prima il profilo fiscale',
    profileRequiredDescription: 'Completa prima il tuo profilo fiscale per sbloccare stime fiscali e suggerimenti di compliance.',
    setupRequiredBadge: 'Setup fiscale richiesto',
    setupRequiredHeading: 'Configura il tuo profilo fiscale in Settings prima di usare Taxes',
    setupRequiredBody: 'Ci servono residenza fiscale, regime fiscale e tipo di attività prima di poter stimare correttamente passività, scadenze e dashboard Tax Buffer.',
    openTaxSettings: 'Apri impostazioni fiscali',
    settingsHint: 'Troverai lo stesso setup fiscale dentro Settings > Taxes.',
    loading: 'Caricamento dashboard fiscale...'
  },
  summary: {
    shouldSetAside: 'Da accantonare',
    alreadySaved: 'Già accantonato',
    missing: 'Mancante',
    savePerWeek: 'Accantona {{amount}}/settimana - obiettivo {{date}}',
    complete: '{{value}}% completato'
  },
  breakdown: {
    title: 'Dettaglio imposte',
    incomeSocial: 'Reddito & contributi',
    taxableIncome: 'Reddito imponibile',
    incomeTax: 'Imposta sul reddito',
    socialContributions: 'Contributi previdenziali',
    subtotal: 'Subtotale',
    vat: 'IVA',
    vatRegime: 'Regime IVA',
    contributionRate: 'Aliquota contributiva',
    vatLiability: 'Debito IVA',
    notAvailable: 'N/D'
  },
  liabilities: {
    title: 'Ripartizione passività'
  },
  calendar: {
    title: 'Calendario scadenze 2026',
    noDeadlines: 'Nessuna scadenza fiscale configurata.',
    system: 'Sistema',
    customDeadline: 'Scadenza personalizzata',
    duePrefix: 'Scade {{date}}'
  },
  sidebar: {
    setupTitle: 'Setup fiscale',
    fiscalResidence: 'Residenza fiscale',
    taxRegime: 'Regime fiscale',
    activityType: 'Tipo di attività',
    vatFiling: 'Periodicità IVA',
    notConfigured: 'Non configurato',
    setupDescription: 'Questi valori guidano stime fiscali, suggerimenti di compliance e indicazioni specifiche per paese.',
    updateSetup: 'Aggiorna setup fiscale',
    completeSetup: 'Completa setup fiscale',
    deadlinesTitle: 'Scadenze fiscali',
    noUpcomingDeadlines: 'Nessuna scadenza imminente.',
    activityTitle: 'Attività buffer',
    noRecentActivity: 'Nessuna attività recente.'
  },
  support: {
    incomeTax: 'Imposta sul reddito',
    socialContributions: 'Contributi previdenziali',
    vat: 'IVA'
  }
} as const;
