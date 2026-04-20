export const settingsIt = {
  sections: {
    profile: 'Profilo',
    security: 'Sicurezza',
    taxes: 'Tasse',
    banking: 'Banche e conti',
    preferences: 'Preferenze',
    privacy: 'Privacy & Dati',
    help: 'Aiuto & Legale'
  },
  header: {
    title: 'Impostazioni',
    description: 'Gestisci account, preferenze e dati personali.'
  },
  notices: {
    profile: {
      finishSetupTitle: 'Completa il setup del profilo',
      completeDetailsTitle: 'Completa i dati del profilo',
      verifyEmailTitle: 'Verifica la tua email',
      finishSetupDescription: 'Aggiungi i dati personali mancanti e verifica la tua email per completare questa sezione.',
      completeDetailsDescription: 'Mancano ancora alcuni dati personali e dovrebbero essere completati qui.',
      verifyEmailDescription: 'Controlla la tua inbox e segui il link di verifica per completare questa sezione.',
      completeDetailsAction: 'Completa dati'
    },
    security: {
      title: 'Completa la protezione dell’account',
      noSecondFactor: 'Aggiungi prima un secondo fattore, poi mantieni un percorso di backup con i recovery code.',
      noFallback: 'Il tuo account ha ancora bisogno di un percorso di accesso di backup se il metodo principale diventa indisponibile.',
      noRecovery: 'I recovery code mancano ancora. Generali per completare questa sezione.'
    },
    taxes: {
      title: 'Completa il tuo profilo fiscale',
      description:
        'Residenza fiscale, regime fiscale e tipo di attività sono ancora richiesti prima che l’area Taxes possa considerarsi completa.'
    },
    banking: {
      title: 'Collega la tua prima banca',
      description: 'Usa Open Banking per collegare banche live, oppure crea una banca manuale per organizzare conti locali dentro Opex.'
    }
  },
  preferences: {
    quickManagement: 'Gestione rapida',
    support: 'Supporto',
    fastSettings: 'Impostazioni veloci',
    notificationDetails: 'Dettagli notifiche',
    appPreferences: 'Preferenze app',
    display: 'Aspetto',
    appTheme: "Tema dell'app",
    appThemeDescription: "Scegli l'aspetto dell'interfaccia di Opex.",
    languageLabel: 'Lingua',
    languageDescription: "Scegli la lingua dell'interfaccia di Opex.",
    lightTheme: 'Tema chiaro',
    darkTheme: 'Tema scuro',
    lightThemeShort: 'Chiaro',
    darkThemeShort: 'Scuro',
    businessMode: 'Modalità business',
    comingSoon: 'Prossimamente',
    notifications: {
      expand: 'Apri',
      collapse: 'Chiudi',
      summaryTitle: 'Riepilogo notifiche',
      summaryDescription: 'Apri questa sezione per gestire soglia saldo, avvisi banking e promemoria fiscali.',
      summaryThreshold: 'Soglia {{amount}} EUR',
      summaryActiveCount_one: '{{count}} notifica attiva',
      summaryActiveCount_other: '{{count}} notifiche attive',
      thresholdTitle: 'Soglia saldo',
      thresholdDescription: 'Imposta il livello sotto cui Opex deve avvisarti quando il saldo complessivo si abbassa troppo.',
      thresholdHelper: 'Riceverai una notifica push e in-app quando il totale dei tuoi conti scende sotto questa soglia.',
      invalidThreshold: 'Inserisci una soglia saldo valida.',
      saveError: 'Impossibile salvare le preferenze notifiche.',
      saving: 'Salvataggio...',
      save: 'Salva preferenze notifiche',
      sections: {
        transactions: 'Movimenti e saldo',
        banking: 'Open Banking',
        tax: 'Tasse e scadenze'
      },
      items: {
        criticalBalance: {
          label: 'Saldo critico',
          description: 'Invia un avviso quando il saldo totale scende sotto la soglia impostata.'
        },
        significantIncome: {
          label: 'Entrata rilevante',
          description: 'Avvisa quando ricevi un accredito importante sui tuoi conti.'
        },
        abnormalOutflow: {
          label: 'Uscita anomala',
          description: 'Segnala movimenti sospetti, fuori scala o potenzialmente duplicati.'
        },
        consentExpiration: {
          label: 'Scadenza consenso',
          description: 'Ricorda in anticipo quando una banca collegata richiede il rinnovo del consenso.'
        },
        syncErrors: {
          label: 'Errori di sincronizzazione',
          description: 'Avvisa subito se una banca collegata smette di sincronizzarsi correttamente.'
        },
        quarterlyVat: {
          label: 'IVA trimestrale',
          description: 'Invia un promemoria prima della scadenza del versamento IVA trimestrale.'
        },
        monthlyAnalysis: {
          label: 'Analisi mensile',
          description: 'Invia un riepilogo dell’andamento del mese appena concluso.'
        }
      }
    }
  },
  profile: {
    title: 'Profilo',
    cancel: 'Annulla',
    edit: 'Modifica',
    personalProfile: 'Profilo personale',
    managedByGoogleDescription:
      'La tua identità Google gestisce email, nome e cognome. Tutti gli altri dettagli del workspace restano modificabili in Opex.',
    managedByOpexDescription: 'Questa sezione raccoglie i dati personali che guidano il tuo workspace Opex.',
    accountVerified: 'Account verificato',
    verificationPending: 'Verifica in attesa',
    googleManagedIdentity: 'Identità gestita da Google',
    managedInOpex: 'Gestito in Opex',
    profileOwner: 'Titolare profilo',
    syncedFromGoogle: 'Sincronizzato da Google',
    localWorkspaceIdentity: 'Identità locale del workspace',
    emailStatus: 'Stato email',
    verified: 'Verificata',
    pending: 'In attesa',
    occupation: 'Occupazione',
    birthDateMissing: 'Data di nascita mancante',
    missing: 'Mancante',
    identity: 'Identità',
    identityDescription: 'Campi principali del profilo usati in tutta l’applicazione.',
    firstName: 'Nome',
    lastName: 'Cognome',
    email: 'Email',
    notProvidedYet: 'Non ancora fornito',
    managedIdentityNotice: 'Email, nome e cognome sono gestiti da Google e non possono essere modificati qui.',
    personalDetails: 'Dati personali',
    personalDetailsDescription: 'Dati personali usati nel workspace e nello stato di onboarding.',
    displayName: 'Display name',
    birthDate: 'Data di nascita',
    timeZone: 'Fuso orario',
    accountStatus: 'Stato account',
    accountStatusDescription: 'Stato sintetico dell’account e del profilo.',
    verification: 'Verifica',
    completed: 'Completata',
    identitySource: 'Origine identità',
    registration: 'Registrazione',
    notAvailable: 'Non disponibile',
    verifyEmail: 'Verifica',
    retryIn: 'Riprova tra {{cooldown}}',
    verifyEmailCooldown: 'Controlla la tua inbox. Riprova tra {{cooldown}}.',
    sendVerificationLink: 'Invia un link di verifica.'
  },
  profileEditor: {
    saveChanges: 'Salva modifiche',
    savingChanges: 'Salvataggio...',
    removePhoto: 'Rimuovi foto',
    imageProcessingError: 'Impossibile elaborare l’immagine. Prova con un file diverso.',
    adultBirthDateError: 'La data di nascita deve appartenere a un utente adulto (18+).',
    saveError: 'Impossibile salvare le modifiche al profilo.',
    editProfileDetails: 'Modifica i dettagli del profilo',
    editProfileDescription:
      'Mantieni allineate le informazioni del workspace con la tua identità Keycloak e il tuo profilo locale Opex.',
    inlineEditingEnabled: 'Modifica inline attiva',
    googleManagedIdentity: 'Identità gestita da Google',
    profilePhoto: 'Foto profilo',
    profilePhotoDescription: 'Carica una nuova immagine o rimuovi quella attuale direttamente da questa card.',
    identity: 'Identità',
    identityDescription: 'Questi sono i dati principali mostrati in tutto il workspace Opex.',
    emailManagedByGoogle: 'Email, nome e cognome sono gestiti dal tuo account Google e non possono essere modificati qui.',
    personalDetails: 'Dati personali',
    personalDetailsDescription: 'Mantieni qui i dati del profilo e gestisci il profilo fiscale da Settings > Taxes.',
    displayName: 'Nome visualizzato',
    birthDate: 'Data di nascita',
    occupation: 'Occupazione',
    cancel: 'Annulla'
  },
  securitySection: {
    password: 'Password',
    changePasswordTitle: 'Cambia la tua password',
    changePasswordDescription: 'Aggiorna la password che usi per accedere al tuo account.',
    changePassword: 'Cambia password',
    passwordFlowError: 'Impossibile avviare il flusso di aggiornamento password.'
  },
  securityWorkspace: {
    descriptionDefault:
      'Controlla lo stato del secondo fattore, la disponibilità del recovery e le azioni disponibili in un unico posto.',
    status: 'Stato',
    preparing: 'Preparazione...',
    saving: 'Salvataggio...',
    loadingRetry: 'Riprova',
    loadingTitle: 'Stato sicurezza non disponibile',
    refresh: 'Aggiorna',
    security: 'Sicurezza',
    accountProtection: 'Protezione account',
    recommendedNextStep: 'Prossimo passo consigliato: {{action}}.',
    backupReady: 'Backup pronto',
    backupMissing: 'Backup mancante',
    setupPending: 'Setup in sospeso',
    configured: 'Configurato',
    notSet: 'Non configurato',
    primary: 'Primario',
    available: 'Disponibile',
    exhausted: 'Esauriti',
    actionError: 'Impossibile avviare l’azione richiesta.',
    setPrimaryTotpSuccess: 'Authenticator app impostata come metodo principale di accesso.',
    setPrimaryWebauthnSuccess: 'Passkey o security key impostata come metodo principale di accesso.',
    setPrimaryError: 'Impossibile aggiornare il metodo principale di accesso.',
    actionCard: {
      totpTitle: 'Aggiungi authenticator app',
      totpDescription: 'Usa codici monouso da un’app di autenticazione sul telefono.',
      totpStatusReady: 'Pronta all’uso per l’accesso.',
      totpStatusMissing: 'Non ancora configurata.',
      totpButtonSetUp: 'Configura authenticator app',
      totpButtonReconfigure: 'Riconfigura authenticator app',
      totpHelper:
        'Ideale se vuoi un secondo fattore portabile che funzioni su più dispositivi, purché tu mantenga un accesso di backup.',
      webauthnTitle: 'Aggiungi passkey o security key',
      webauthnDescription: 'Aggiungi una passkey sincronizzata o una chiave hardware per un accesso rapido e sicuro.',
      webauthnStatusMissing: 'Non ancora configurata.',
      webauthnCredentialsSaved: '{{count}} credenziale salvata.',
      webauthnCredentialsSaved_other: '{{count}} credenziali salvate.',
      webauthnButtonSetUp: 'Configura passkey o chiave',
      webauthnButtonAddAnother: 'Aggiungi un’altra credenziale',
      webauthnHelper:
        'Ideale se vuoi una chiave hardware o una passkey sincronizzata come opzione di accesso quotidiano più forte.',
      recoveryTitle: 'Genera recovery code',
      recoveryDescription: 'Tieni pronti dei codici di emergenza se il telefono o la chiave non sono disponibili.',
      recoveryButtonGenerate: 'Genera recovery code',
      recoveryButtonRegenerate: 'Rigenera recovery code',
      recoveryHelper:
        'Conservali offline o in un password manager così potrai ancora entrare se perdi un dispositivo.',
      setAsPrimary: 'Imposta come primario'
    },
    overview: {
      missingAllTitle: 'Il tuo account non è ancora completamente protetto.',
      missingAllDescription:
        'Configura un secondo metodo di accesso e poi aggiungi i recovery code così non perderai l’accesso.',
      missingFallbackTitle: 'Il tuo accesso è protetto, ma manca ancora un backup.',
      missingFallbackDescription:
        'Aggiungi un altro metodo o i recovery code così la perdita di telefono o chiave non bloccherà l’accesso.',
      missingRecoveryTitle: 'Il metodo principale è configurato, ma il recovery è ancora incompleto.',
      missingRecoveryDescription:
        'Genera i recovery code così manterrai una via di emergenza per rientrare.',
      successTitle: 'Il tuo account è protetto e il backup è pronto.',
      successDescription: 'Potrai comunque rientrare se un dispositivo diventa indisponibile.'
    },
    actionStatus: {
      success:
        '{{label}} completata. La pagina è stata aggiornata con lo stato di sicurezza più recente.',
      cancelled: '{{label}} annullata prima del completamento.',
      error: '{{label}} non è stata completata con successo. Riprova.'
    },
    actionLabels: {
      totp: 'Setup authenticator app',
      webauthn: 'Setup passkey o security key',
      recovery: 'Setup recovery code',
      password: 'Aggiornamento password',
      requestedAction: 'Azione richiesta'
    },
    methods: {
      totp: 'Authenticator app',
      webauthn: 'Passkey o security key',
      recovery: 'Recovery code',
      notConfigured: 'Non configurato'
    },
    recommendations: {
      totp: 'Aggiungi una authenticator app',
      webauthn: 'Aggiungi una passkey o security key',
      recovery: 'Genera recovery code',
      review: 'Rivedi la tua configurazione di sicurezza'
    },
    recoverySummary: {
      pending: 'Il setup è iniziato ma non ancora completato.',
      none: 'Nessun recovery code generato.',
      exhausted: 'Generati, ma tutti i codici sono esauriti.',
      one: '1 codice rimanente.',
      many: '{{count}} codici rimanenti.'
    }
  },
  taxesSection: {
    title: 'Taxes',
    badge: 'Profilo fiscale',
    heroTitle: 'Configura i dati che alimentano il tuo workspace fiscale',
    heroDescription:
      'Questi valori servono per sbloccare l’area Taxes e guidare stime fiscali, frequenza di filing e suggerimenti di compliance.',
    formTitle: 'Profilo fiscale',
    formDescription:
      'Scegli residenza fiscale, regime e tipo di attività. Puoi aggiornare questi valori qui ogni volta che la tua situazione cambia.',
    saveLabel: 'Salva profilo fiscale',
    footerNote: 'Queste impostazioni vengono usate dalla sezione Taxes e possono essere aggiornate in qualsiasi momento.'
  },
  taxForm: {
    defaultTitle: 'Configura il tuo profilo fiscale',
    defaultDescription: 'Ci servono alcuni dati per stimare correttamente le imposte.',
    defaultSaveLabel: 'Salva e continua',
    defaultFooterNote: 'Potrai aggiornarli più avanti da Settings.',
    taxRegime: 'Regime fiscale',
    fiscalResidence: 'Residenza fiscale',
    vatFiling: 'Periodicità IVA',
    vatFilingDescription: 'Usata per stimare scadenze IVA e obblighi fiscali ricorrenti.',
    activityType: 'Tipo di attività',
    selectBusinessArea: 'Seleziona il tuo ambito di attività',
    selectRegimeFirst: 'Seleziona prima un regime fiscale.',
    validationError:
      'Seleziona regime fiscale, tipo di attività e residenza fiscale per continuare.',
    saveError: 'Errore inatteso durante il salvataggio del setup fiscale.',
    saving: 'Salvataggio...',
    savedButton: 'Profilo fiscale salvato',
    savedMessage: 'Salvato. Il workspace Taxes è ora aggiornato.',
    saveHint: 'Salva qui le modifiche per aggiornare il workspace Taxes.',
    vatFrequency: {
      monthly: 'Mensile',
      quarterly: 'Trimestrale',
      yearly: 'Annuale'
    },
    regime: {
      forfettarioLabel: 'Forfettario',
      ordinarioLabel: 'Ordinario',
      forfettarioDescription: 'Aliquota piatta al 5% o 15%',
      ordinarioDescription: 'Scaglioni IRPEF standard'
    },
    activity: {
      professionalLabel: 'Professionista / Consulente',
      professionalDescription: 'Freelance, servizi digitali',
      retailLabel: 'Retail & E-commerce',
      retailDescription: 'Shop online, rivendita',
      foodLabel: 'Food & Hospitality',
      foodDescription: 'Ristoranti, bar',
      constructionLabel: 'Construction & Real Estate',
      constructionDescription: 'Ristrutturazioni, immobiliare',
      otherLabel: 'Altre attività',
      otherDescription: 'Altro o non sicuro'
    },
    residence: {
      italy: 'Italia',
      netherlands: 'Paesi Bassi',
      belgium: 'Belgio',
      germany: 'Germania',
      other: 'Altro paese'
    }
  },
  bankingSection: {
    title: 'Banche e conti',
    badge: 'Banche e conti',
    heroTitleConnected: 'Mantieni il tuo workspace banking sincronizzato',
    heroTitleEmpty: 'Collega la tua prima banca o crea una banca manuale',
    heroDescriptionConnected:
      'Le banche collegate via Salt Edge e le banche manuali convivono nello stesso workspace, con i rispettivi conti organizzati sotto ogni banca.',
    heroDescriptionEmpty:
      'Usa Open Banking per importare in sicurezza saldi e transazioni tramite Salt Edge, oppure crea una banca manuale e aggiungi i suoi conti direttamente in Opex.',
    statusReady: 'Pronto a collegare',
    statusLiveConnection_one: '{{count}} connessione live',
    statusLiveConnection_other: '{{count}} connessioni live',
    statusManualBanks_one: '{{count}} banca manuale',
    statusManualBanks_other: '{{count}} banche manuali',
    summary: {
      connectedBanks: 'Banche collegate',
      accountsTracked: 'Conti tracciati',
      taxBufferAccounts: 'Conti in riserva fiscale',
      totalSourcesZero: 'Nessuna sorgente collegata',
      totalSources_one: '{{count}} sorgente totale nel workspace',
      totalSources_other: '{{count}} sorgenti totali nel workspace',
      manualAccounts_one: '{{count}} conto manuale',
      manualAccounts_other: '{{count}} conti manuali',
      importedAccounts: 'Importati con Open Banking',
      accountsPlaceholder: 'I conti manuali e importati appariranno qui',
      taxBufferEnabled: 'Inclusi nei calcoli della riserva fiscale',
      taxBufferMissing: 'Seleziona uno o più conti per la riserva fiscale'
    },
    secureFlowTitle: 'Flusso di connessione sicuro',
    secureFlowDescription:
      'Salt Edge gestisce il passaggio di autorizzazione bancaria. Opex salva il risultato della connessione e ti permette comunque di mescolare feed live e conti manuali.'
  },
  bankingList: {
    connectionActions: 'Collega o crea',
    connectWithOpenBanking: 'Collega con Open Banking',
    preparingConsent: 'Preparazione del flusso di consenso Salt Edge...',
    addAnotherBank:
      "Collega un'altra banca e mantieni saldi o transazioni sincronizzati automaticamente.",
    connectFirstBank: 'Collega in sicurezza la tua prima banca tramite il flusso di autorizzazione Salt Edge.',
    createManualBank: 'Crea banca manuale',
    createManualDescription:
      'Crea una banca locale in Opex e usa poi quella banca per aggiungere uno o più conti manuali.',
    currentConnections: 'Banche e conti nel workspace',
    connectedBanks: 'Banche collegate',
    manualBanks: 'Banche manuali',
    sources_one: '{{count}} sorgente',
    sources_other: '{{count}} sorgenti',
    noSourcesTitle: 'Nessuna sorgente bancaria ancora',
    noSourcesDescription:
      'Inizia con Open Banking per import live oppure crea una banca manuale per organizzare i conti locali.',
    liveSource: 'Banca collegata con Open Banking',
    manualSource: 'Banca manuale',
    account_one: '{{count}} conto',
    account_other: '{{count}} conti',
    requiresReview: 'Richiede revisione',
    reviewPendingCount_one: '{{count}} conto ancora da rivedere',
    reviewPendingCount_other: '{{count}} conti ancora da rivedere'
  },
  bankingDetail: {
    fallbackTitle: 'Banca collegata',
    backToConnections: 'Torna a banche e conti',
    liveSource: 'Banca collegata con Open Banking',
    localSource: 'Banca manuale',
    connectionActions: 'Azioni connessione',
    manualBankActions: 'Azioni banca manuale',
    connectedBankTitle: 'Banca collegata',
    connectedBankDescription: 'Questa vista rappresenta la banca collegata come connessione live. Da qui puoi vedere tutti i conti importati e sincronizzati sotto la stessa banca.',
    manualBankTitle: 'Banca manuale',
    manualBankDescription: 'Questa vista rappresenta una banca manuale locale. Da qui puoi vedere tutti i conti manuali organizzati sotto la stessa banca.',
    manualBankSettings: 'Impostazioni banca manuale',
    renameManualBank: 'Rinomina banca',
    renameManualBankDescription:
      'Aggiorna il nome della banca manuale senza uscire da questa vista. I conti che usano ancora il nome ereditato verranno riallineati automaticamente.',
    manualBankNameLabel: 'Nome banca',
    manualBankNamePlaceholder: 'es. Banca famiglia',
    manualBankNameRequired: 'Inserisci un nome per la banca manuale.',
    renameManualBankError: 'Impossibile rinominare la banca manuale.',
    savingManualBank: 'Salvataggio...',
    saveManualBank: 'Salva nome banca',
    requiresReview: 'Richiede revisione',
    pendingStatus: 'Da rivedere',
    configuredStatus: 'Configurato',
    reviewNoticeTitle: 'Questa banca ha ancora conti da rivedere',
    reviewNoticeDescription_one:
      'C’è ancora {{count}} conto da configurare. Aprilo per completare tipo di conto e riserva fiscale.',
    reviewNoticeDescription_other:
      'Ci sono ancora {{count}} conti da configurare. Aprili per completare tipo di conto e riserva fiscale.',
    accountsInConnection: 'Conti di questa banca',
    accountsInConnectionDescription: 'Apri un conto per dirci come deve essere usato in Opex. Il tipo di conto e la riserva fiscale sono impostazioni separate, sia per i conti importati sia per quelli manuali.',
    addManualAccount: 'Aggiungi conto',
    noAccountsFound: 'Nessun conto trovato.',
    noManualAccountsTitle: 'Nessun conto manuale ancora',
    noManualAccountsDescription: 'Questa banca manuale è pronta, ma non contiene ancora conti. Aggiungi il primo conto per iniziare a tracciarlo in Opex.',
    addFirstManualAccount: 'Aggiungi il primo conto',
    taxBuffer: 'Riserva fiscale',
    secondaryConnectionActionDescription:
      'Se vuoi interrompere questo collegamento, puoi scollegare la banca da qui. È un’azione secondaria e rimuove solo i dati importati da questa connessione.',
    secondaryManualBankActionDescription:
      'Se vuoi chiudere questa banca manuale, puoi rimuoverla da qui. La rimozione elimina la banca, i conti manuali figli e le relative transazioni locali.',
    removeConnection: 'Scollega questa banca',
    removeConnectionDescription:
      'Tutti i conti e le transazioni importati da questa banca tramite Salt Edge verranno eliminati definitivamente.',
    removeManualBank: 'Rimuovi questa banca manuale',
    remove: 'Scollega',
    removeManualBankCta: 'Rimuovi',
    areYouSure: 'Sei sicuro?',
    removeWarningCopy:
      'Questo elimina definitivamente tutti i conti e le transazioni importati da {{provider}}. L’azione non può essere annullata.',
    removeWarning:
      'Questo elimina definitivamente tutti i conti e le transazioni importati da {{provider}}. L’azione non può essere annullata.',
    manualRemoveWarningCopy:
      'Questo elimina definitivamente la banca manuale {{provider}}, i conti manuali sotto di essa e le relative transazioni locali. L’azione non può essere annullata.',
    cancel: 'Annulla',
    removing: 'Rimozione...',
    removingManualBank: 'Rimozione banca...',
    deleteConnection: 'Scollega banca',
    deleteManualBank: 'Rimuovi banca manuale'
  },
  manualBankCreate: {
    shellTitle: 'Crea banca manuale',
    backToSources: 'Torna a banche e conti',
    badge: 'Banca manuale',
    title: 'Crea una banca manuale',
    description: 'Prima crea la banca locale che vuoi tracciare in Opex. In seguito potrai aggiungere uno o più conti sotto la stessa banca, sempre dentro Settings.',
    nameLabel: 'Nome banca',
    namePlaceholder: 'es. Fineco manuale',
    helperTitle: 'Perché creare una banca manuale',
    helperDescription: 'La banca manuale diventa il contenitore dei tuoi conti locali. In questo modo i conti manuali restano raggruppati correttamente sotto la stessa banca.',
    cancel: 'Annulla',
    creating: 'Creazione...',
    create: 'Crea banca manuale',
    nameRequired: 'Inserisci un nome per la banca manuale.',
    createError: 'Impossibile creare la banca manuale.'
  },
  bankingEdit: {
    fallbackTitle: 'Conto',
    backToConnection: 'Torna ai conti importati',
    backToBank: 'Torna alla banca',
    editAccount: 'Configura conto',
    editAccountDescription:
      'Qui stai configurando un singolo conto, non la banca collegata nel suo insieme.',
    liveSource: 'Conto importato con Open Banking',
    localSource: 'Conto locale',
    manualSource: 'Conto manuale',
    accountName: 'Nome conto',
    accountNamePlaceholder: 'es. Conto Corrente ING',
    initialBalance: 'Saldo iniziale',
    currency: 'Valuta',
    accountCategory: 'Tipo di conto',
    categoryHelperCopy:
      'Il tipo di conto descrive come usi questo conto nel quotidiano. È separato dalla riserva fiscale.',
    categoryLabel: {
      personal: 'Personale',
      business: 'Business',
      savings: 'Risparmio'
    },
    categoryDescription: {
      personal: 'Banking personale, spese quotidiane ed entrate.',
      business: 'Operatività business, entrate e uscite professionali.',
      savings: 'Obiettivi di risparmio, depositi e riserve di lungo periodo.'
    },
    categoryHelper:
      'Il tipo di conto descrive come usi questo conto nel quotidiano. È separato dalla riserva fiscale.',
    fiscalSettings: 'Riserva fiscale',
    taxBufferTitle: 'Usa per la riserva fiscale',
    taxBufferDescription: 'Se attivo, Opex include il saldo di questo conto nei calcoli di quanto mettere da parte per le tasse.',
    taxBufferHelper:
      'Questa scelta non cambia il tipo di conto. Serve solo a dire a Opex se il saldo va contato come accantonamento fiscale.',
    savingsSuggestionTitle: 'Questo conto potrebbe essere adatto',
    savingsSuggestionDescription: 'I conti di risparmio vengono spesso usati per accantonare tasse. Se questo \u00e8 il tuo caso, puoi includerlo nella riserva fiscale.',
    savingsSuggestionAction: 'Usa per la riserva fiscale',
    taxBufferEnabled: 'Riserva fiscale attiva',
    taxBufferEnabledDescriptionCopy: 'Il saldo di questo conto è incluso nei calcoli fiscali.',
    taxBufferEnabledDescription: 'Il saldo di questo conto è incluso nei calcoli fiscali.',
    savingChanges: 'Salvataggio...',
    saveChanges: 'Salva modifiche'
  },
  manualAccountCreate: {
    shellTitle: 'Aggiungi conto manuale',
    backToBank: 'Torna alla banca manuale',
    badge: 'Conto manuale',
    title: 'Aggiungi un conto manuale',
    description: 'Questo conto verrà aggiunto sotto {{bank}} e resterà organizzato dentro la stessa banca manuale.',
    accountNameLabel: 'Nome conto',
    accountNamePlaceholder: 'es. Conto principale',
    initialBalanceLabel: 'Saldo iniziale',
    currencyLabel: 'Valuta',
    helperTitle: 'Come usare questo conto',
    helperDescription: 'Configura il ruolo del conto e la riserva fiscale già in questa schermata. Potrai sempre modificarlo più tardi dalla stessa banca manuale.',
    cancel: 'Annulla',
    creating: 'Creazione...',
    create: 'Aggiungi conto',
    missingConnection: 'Apri prima una banca manuale valida.',
    nameRequired: 'Inserisci un nome per il conto manuale.',
    invalidBalance: 'Inserisci un saldo numerico valido.',
    createError: 'Impossibile creare il conto manuale.'
  },
  bankingConsent: {
    badge: 'Open Banking Notice',
    title: "Rivedi l'informativa sui dati bancari",
    description:
      'Prima che Opex ti reindirizzi a Salt Edge, conferma di aver capito quali dati bancari verranno importati e perché.',
    dataImported: 'Dati importati',
    dataImportedDescription:
      'Opex può importare identificativi del conto, metadati del provider, saldi e transazioni della banca collegata.',
    thirdPartyProcessing: 'Trattamento di terze parti',
    thirdPartyProcessingDescription: 'Salt Edge gestisce il redirect di autorizzazione e il workflow di connessione con la tua banca.',
    acceptNotice: "Accetto l'Open Banking Notice v{{version}}.",
    acceptNoticeDescription:
      "Capisco come Opex userà i dati bancari collegati all'interno del prodotto.",
    readNotice: 'Apri Open Banking Notice',
    saltEdgeRedirect:
      'Capisco che Opex mi reindirizzerà a Salt Edge per completare il setup della connessione bancaria.',
    saltEdgeRedirectDescription:
      'Open Banking è opzionale nel complesso. Puoi continuare a usare conti manuali se preferisci non collegare una banca.',
    legalAlreadyAccepted:
      "Privacy Notice e Terms of Service sono già stati accettati durante l'onboarding e non devono essere accettati di nuovo qui.",
    cancel: 'Annulla',
    opening: 'Apertura...',
    continueToSaltEdge: 'Continua verso Salt Edge'
  },
  privacy: {
    title: 'GDPR & Data',
    consentStatus: 'Stato consensi',
    consentCurrent: 'Le versioni correnti di privacy notice e terms of service sono accettate per questo account.',
    consentMissing:
      'Uno o più documenti legali richiesti hanno ancora bisogno di accettazione o rinnovo.',
    current: 'Corrente',
    updateRequired: 'Aggiornamento richiesto',
    privacyNotice: 'Privacy Notice',
    privacyNoticeDescription:
      'v{{version}} - Apri l’informativa corrente in una nuova tab.',
    termsOfService: 'Terms of Service',
    termsDescription: 'v{{version}} - Rivedi le regole contrattuali dell’app.',
    cookieNotice: 'Cookie Notice',
    cookieDescription: 'v{{version}} - Vedi quali chiavi di storage browser vengono usate.',
    openBankingNotice: 'Open Banking Notice',
    openBankingDescription: 'v{{version}} - Rivedi i termini relativi ai dati bancari.',
    consentAudit: 'Audit consensi',
    consentAuditDescription: 'Versioni e timestamp registrati e attualmente salvati per il tuo account.',
    entries_one: '{{count}} voce',
    entries_other: '{{count}} voci',
    notRecorded: 'Non registrato',
    dataRights: 'Diritti sui dati',
    dataRightsDescription:
      'Esporta i tuoi dati, rivedi il setup dei processor o chiudi l’account da qui.',
    preparingExport: 'Preparazione export...',
    downloadMyData: 'Scarica i miei dati',
    contactPrivacyTeam: 'Contatta il team privacy',
    deleteAccountConfirm:
      'Eliminare subito il tuo account Opex? Questo disattiverà il profilo locale e ti disconnetterà.',
    closingAccount: 'Chiusura account...',
    deleteAccount: 'Elimina account',
    openBankingScopes: 'Scope Open Banking',
    noScopes: 'Nessuno scope open banking ancora accettato.'
  },
  help: {
    title: 'Supporto Opex',
    summaryTitle: 'Aiuto e riferimenti legali',
    summaryDescription:
      'Qui trovi domande frequenti, un contatto diretto per il supporto e una scorciatoia verso i documenti legali già usati nel resto del prodotto.',
    faq: {
      title: 'Domande frequenti',
      description:
        'Le risposte definitive arriveranno più avanti. Per ora lasciamo un segnaposto chiaro da completare nelle prossime iterazioni.',
      placeholderAnswer: 'Risposta in preparazione. Tornerà qui in una prossima versione.',
      items: {
        foreignBank: {
          question: 'Come collego una banca estera?'
        },
        excelExport: {
          question: 'Posso esportare i dati in Excel?'
        },
        taxBuffer: {
          question: 'Come viene calcolata la riserva fiscale?'
        },
        dataSafety: {
          question: 'I miei dati sono al sicuro?'
        }
      }
    },
    support: {
      title: 'Contatta il supporto',
      description:
        'Per ora il supporto prodotto passa via email. Useremo il contatto reale configurato nel catalogo legale pubblico, senza indirizzi hardcoded.',
      emailLabel: 'Email di supporto',
      emailUnavailable: 'Email supporto non disponibile',
      cta: 'Scrivi al supporto'
    }
  }
} as const;


