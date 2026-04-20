export const bankingIt = {
  accountSetup: {
    editConnection: 'Configura banca collegata',
    configureAccount: 'Configura conto',
    configureImportedAccount: 'Configura conto importato',
    successfullyAuthorized: 'Autorizzazione completata',
    connectedBank: 'Banca collegata',
    manualAccount: 'Conto manuale',
    heroDescriptionImported:
      'Prima scegli come questo conto deve essere classificato in Opex, poi decidi se usarlo anche per la riserva fiscale.',
    heroDescriptionManual:
      'Configura prima il ruolo del conto in Opex. I dettagli del conto restano disponibili più sotto, in una sezione separata.',
    connectionDetails: 'Dettagli banca collegata',
    importedAccountDetails: 'Dettagli conto importato',
    manualAccountDetails: 'Dettagli conto manuale',
    importedAccountTitle: 'Conto importato',
    importedAccountDescription:
      'Stai configurando come Opex deve usare questo conto importato. La banca collegata resta una cosa distinta dal singolo conto.',
    accountName: 'Nome conto',
    institutionName: 'Nome istituto',
    placeholders: {
      accountName: 'Conto principale',
      institutionName: 'Cassa contanti'
    },
    initialBalance: 'Saldo iniziale',
    currency: 'Valuta',
    accountCategory: 'Tipo di conto',
    accountCategoryFocus:
      'Questa è la scelta principale: dice a Opex come interpretare il conto nel workspace.',
    accountCategoryHelper:
      'Il tipo di conto descrive come usi questo conto. La riserva fiscale è una scelta separata.',
    selectionSummaryCategory: 'Tipo scelto',
    selectionSummaryReserve: 'Riserva fiscale',
    selectionSummaryReserveEnabled: 'Attiva',
    selectionSummaryReserveDisabled: 'Non attiva',
    selectionSummaryReserveEnabledDescription:
      'Il saldo di questo conto viene contato come denaro accantonato per le tasse.',
    selectionSummaryReserveDisabledDescription:
      'Il saldo non viene ancora usato nei calcoli della riserva fiscale.',
    categories: {
      personal: 'Personale',
      business: 'Business',
      savings: 'Risparmio'
    },
    categorySummary: {
      personal: 'Per spese quotidiane, entrate personali e uso operativo personale.',
      business: 'Per operazioni professionali, incassi e spese della tua attività.',
      savings: 'Per accantonamenti, liquidità ferma e riserve di medio-lungo periodo.'
    },
    fiscalSettings: 'Riserva fiscale',
    taxReserveFocus:
      'Decidi qui se questo saldo deve contare come denaro messo da parte per le tasse.',
    taxBufferTitle: 'Usa per la riserva fiscale',
    taxBufferDescription:
      'Se attivo, Opex include il saldo di questo conto nei calcoli di quanto mettere da parte per le tasse.',
    taxBufferHelper: 'Questa scelta \u00e8 indipendente dal tipo di conto.',
    savingsSuggestionTitle: 'Questo conto potrebbe fare al caso tuo',
    savingsSuggestionDescription:
      'I conti di risparmio vengono spesso usati per accantonare tasse. Se questo \u00e8 il tuo caso, puoi includerlo nella riserva fiscale.',
    savingsSuggestionAction: 'Usa per la riserva fiscale',
    secondaryDetailsTitle: 'Dettagli conto',
    secondaryDetailsDescriptionImported:
      'Qui puoi solo rinominare il conto importato, così sarà più riconoscibile nelle viste Opex.',
    secondaryDetailsDescriptionManual:
      'Qui puoi sistemare i dettagli operativi del conto senza cambiare le due scelte principali.',
    saving: 'Salvataggio...',
    saveChanges: 'Salva modifiche',
    completeSetup: 'Completa configurazione',
    invalidBalance: 'Inserisci un saldo numerico valido.',
    saveError: 'Impossibile completare la configurazione.'
  },
  postSync: {
    badge: 'Open Banking',
    title: 'Banca collegata con successo',
    description: 'Abbiamo importato {{count}} conto da {{bank}}. Puoi rivederlo ora oppure farlo più tardi da Impostazioni > Banche e conti.',
    description_other: 'Abbiamo importato {{count}} conti da {{bank}}. Puoi rivederli ora oppure farlo più tardi da Impostazioni > Banche e conti.',
    importedAccountsSummary: '{{count}} conto importato',
    importedAccountsSummary_other: '{{count}} conti importati',
    summaryHelper:
      'Qui puoi aprire direttamente la banca collegata in Impostazioni > Banche e conti e rivedere i singoli conti importati.',
    primaryAction: 'Rivedi i conti',
    secondaryAction: 'Lo farò dopo'
  },
  redirection: {
    openingWidget: "Stiamo generando l'URL di connessione Salt Edge...",
    waitingRedirect:
      'Reindirizzamento a Salt Edge in corso. Se non succede nulla, riprova.',
    syncingSuccess: 'Sincronizzazione in corso.',
    waiting: 'Attendi...',
    waitingNextStep: 'In attesa del prossimo passaggio...',
    title: 'Connessione a {{bank}}',
    back: 'Indietro',
    retry: 'Riprova'
  },
  errors: {
    missingAccountId: "Impossibile identificare il conto selezionato.",
    invalidBalance: 'Inserisci un saldo numerico valido.',
    saveChanges: 'Impossibile salvare le modifiche.',
    removeConnection: 'Impossibile rimuovere la connessione.',
    missingNoticeVersion:
      "La versione dell'Open Banking Notice non è ancora disponibile. Ricarica e riprova.",
    consentRequired: 'Devi confermare entrambe le informative prima di collegare una banca.',
    startConnection: 'Impossibile avviare la connessione open banking.'
  }
} as const;


