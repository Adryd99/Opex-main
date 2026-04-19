export const bankingIt = {
  accountSetup: {
    editConnection: 'Modifica connessione',
    configureAccount: 'Configura account',
    successfullyAuthorized: 'Autorizzazione completata',
    connectionDetails: 'Dettagli connessione',
    manualAccountDetails: 'Dettagli account manuale',
    accountName: 'Nome account',
    institutionName: 'Nome istituto',
    placeholders: {
      accountName: 'Account principale',
      institutionName: 'Cassa contanti'
    },
    initialBalance: 'Saldo iniziale',
    currency: 'Valuta',
    accountCategory: 'Categoria account',
    categories: {
      personal: 'Personale',
      business: 'Business',
      savings: 'Risparmio'
    },
    fiscalSettings: 'Impostazioni fiscali',
    taxBufferTitle: 'Account tax buffer',
    taxBufferDescription: 'Usa questo account per accantonare le passività fiscali.',
    saving: 'Salvataggio...',
    saveChanges: 'Salva modifiche',
    completeSetup: 'Completa configurazione',
    invalidBalance: 'Inserisci un saldo numerico valido.',
    saveError: 'Impossibile completare la configurazione.'
  },
  redirection: {
    openingWidget: 'Stiamo generando l’URL di connessione Salt Edge...',
    waitingRedirect: 'È stata aperta una nuova scheda del browser. Completa lì il flusso e verrai reindirizzato a /success.',
    syncingSuccess: 'Sincronizzazione in corso.',
    waiting: 'Attendi...',
    waitingNextStep: 'In attesa del prossimo passaggio...',
    title: 'Connessione a {{bank}}',
    back: 'Indietro',
    retry: 'Riprova'
  },
  errors: {
    missingAccountId: 'Impossibile identificare l’account selezionato.',
    saveChanges: 'Impossibile salvare le modifiche.',
    removeConnection: 'Impossibile rimuovere la connessione.',
    missingNoticeVersion: 'La versione dell’Open Banking Notice non è ancora disponibile. Ricarica e riprova.',
    consentRequired: 'Devi confermare entrambe le informative prima di collegare una banca.',
    startConnection: 'Impossibile avviare la connessione open banking.'
  }
} as const;
