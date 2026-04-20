export const settingsEn = {
  sections: {
    profile: 'Profile',
    security: 'Security',
    taxes: 'Taxes',
    banking: 'Banks & accounts',
    preferences: 'Preferences',
    privacy: 'Data & Privacy',
    help: 'Help & Legal'
  },
  header: {
    title: 'Settings',
    description: 'Manage your account, preferences, and personal data.'
  },
  notices: {
    profile: {
      finishSetupTitle: 'Finish your profile setup',
      completeDetailsTitle: 'Complete your profile details',
      verifyEmailTitle: 'Verify your email',
      finishSetupDescription: 'Add the missing personal details and verify your email to complete this section.',
      completeDetailsDescription: 'Some personal details are still missing and should be completed here.',
      verifyEmailDescription: 'Check your inbox and follow the verification link to complete this section.',
      completeDetailsAction: 'Complete details'
    },
    security: {
      title: 'Finish account protection',
      noSecondFactor: 'Add a second factor first, then keep a backup path with recovery codes.',
      noFallback: 'Your account still needs a backup sign-in path in case the main method becomes unavailable.',
      noRecovery: 'Recovery codes are still missing. Generate them to complete this section.'
    },
    taxes: {
      title: 'Finish your tax profile',
      description: 'Fiscal residence, tax regime and activity type are still required before the Taxes workspace can be considered complete.'
    },
    banking: {
      title: 'Connect your first account',
      description: 'Use Open Banking to connect live banks, or create a manual bank to organize local accounts inside Opex.'
    }
  },
  preferences: {
    quickManagement: 'Quick Management',
    support: 'Support',
    fastSettings: 'Fast Settings',
    notificationDetails: 'Notification Details',
    appPreferences: 'App Preferences',
    display: 'Display',
    appTheme: 'App Theme',
    appThemeDescription: 'Choose the appearance used across the Opex interface.',
    languageLabel: 'Language',
    languageDescription: 'Choose the language used across the Opex interface.',
    lightTheme: 'Light theme',
    darkTheme: 'Dark theme',
    lightThemeShort: 'Light',
    darkThemeShort: 'Dark',
    businessMode: 'Business mode',
    comingSoon: 'Coming Soon',
    notifications: {
      expand: 'Open',
      collapse: 'Close',
      summaryTitle: 'Notification summary',
      summaryDescription: 'Open this section to manage balance threshold, banking alerts and tax reminders.',
      summaryThreshold: 'Threshold {{amount}} EUR',
      summaryActiveCount_one: '{{count}} notification enabled',
      summaryActiveCount_other: '{{count}} notifications enabled',
      thresholdTitle: 'Balance threshold',
      thresholdDescription: 'Set the level below which Opex should warn you when your combined balance gets too low.',
      thresholdHelper: 'You will receive a push and in-app notification when the total of your accounts drops below this threshold.',
      invalidThreshold: 'Enter a valid balance threshold.',
      saveError: 'Unable to save notification preferences.',
      saving: 'Saving...',
      save: 'Save notification preferences',
      sections: {
        transactions: 'Transactions & balance',
        banking: 'Open Banking',
        tax: 'Taxes & deadlines'
      },
      items: {
        criticalBalance: {
          label: 'Critical balance',
          description: 'Send an alert when your total balance drops below the configured threshold.'
        },
        significantIncome: {
          label: 'Significant income',
          description: 'Notify you when an important incoming transfer reaches one of your accounts.'
        },
        abnormalOutflow: {
          label: 'Abnormal outflow',
          description: 'Flag suspicious, unusual or potentially duplicated outgoing movements.'
        },
        consentExpiration: {
          label: 'Consent expiration',
          description: 'Remind you ahead of time when a connected bank requires consent renewal.'
        },
        syncErrors: {
          label: 'Sync errors',
          description: 'Alert you immediately when a connected bank stops syncing correctly.'
        },
        quarterlyVat: {
          label: 'Quarterly VAT',
          description: 'Send a reminder before the quarterly VAT payment deadline.'
        },
        monthlyAnalysis: {
          label: 'Monthly analysis',
          description: 'Send a summary of the month that has just ended.'
        }
      }
    }
  },
  profile: {
    title: 'Profile',
    cancel: 'Cancel',
    edit: 'Edit',
    personalProfile: 'Personal Profile',
    managedByGoogleDescription: 'Your Google identity manages email, first name and last name. The rest of your workspace details stay editable in Opex.',
    managedByOpexDescription: 'This section groups the personal details that drive your Opex workspace.',
    accountVerified: 'Account verified',
    verificationPending: 'Verification pending',
    googleManagedIdentity: 'Google-managed identity',
    managedInOpex: 'Managed in Opex',
    profileOwner: 'Profile owner',
    syncedFromGoogle: 'Synced from Google',
    localWorkspaceIdentity: 'Local workspace identity',
    emailStatus: 'Email status',
    verified: 'Verified',
    pending: 'Pending',
    occupation: 'Occupation',
    birthDateMissing: 'Birth date missing',
    missing: 'Missing',
    identity: 'Identity',
    identityDescription: 'Core profile fields used across the application.',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    notProvidedYet: 'Not provided yet',
    managedIdentityNotice: 'Email, first name and last name are managed by Google and cannot be changed here.',
    personalDetails: 'Personal Details',
    personalDetailsDescription: 'Personal details used across your workspace and onboarding state.',
    displayName: 'Display Name',
    birthDate: 'Birth Date',
    timeZone: 'Time Zone',
    accountStatus: 'Account Status',
    accountStatusDescription: 'High-level account and profile state.',
    verification: 'Verification',
    completed: 'Completed',
    identitySource: 'Identity source',
    registration: 'Registration',
    notAvailable: 'Not available',
    verifyEmail: 'Verify',
    retryIn: 'Retry in {{cooldown}}',
    verifyEmailCooldown: 'Check your inbox. Retry in {{cooldown}}.',
    sendVerificationLink: 'Send a verification link.'
  },
  profileEditor: {
    saveChanges: 'Save Changes',
    savingChanges: 'Saving...',
    removePhoto: 'Remove photo',
    imageProcessingError: 'Could not process the image. Try a different file.',
    adultBirthDateError: 'Birth date must belong to an adult user (18+).',
    saveError: 'Unable to save profile changes.',
    editProfileDetails: 'Edit your profile details',
    editProfileDescription: 'Keep your workspace information aligned with your Keycloak identity and your local Opex profile.',
    inlineEditingEnabled: 'Inline editing enabled',
    googleManagedIdentity: 'Google-managed identity',
    profilePhoto: 'Profile photo',
    profilePhotoDescription: 'Upload a new image or remove the current one directly from this card.',
    identity: 'Identity',
    identityDescription: 'These are the core details shown across your Opex workspace.',
    emailManagedByGoogle: 'Email, first name and last name are managed by your Google account and cannot be changed here.',
    personalDetails: 'Personal details',
    personalDetailsDescription: 'Keep the profile details here and manage your tax profile from Settings > Taxes.',
    displayName: 'Display Name',
    birthDate: 'Birth Date',
    occupation: 'Occupation',
    cancel: 'Cancel'
  },
  securitySection: {
    password: 'Password',
    changePasswordTitle: 'Change your password',
    changePasswordDescription: 'Update the password you use to sign in to your account.',
    changePassword: 'Change Password',
    passwordFlowError: 'Unable to start the password update flow.'
  },
  securityWorkspace: {
    descriptionDefault: 'Review your second-factor status, recovery readiness and available actions in one place.',
    status: 'Status',
    preparing: 'Preparing...',
    saving: 'Saving...',
    loadingRetry: 'Retry',
    loadingTitle: 'Security status unavailable',
    refresh: 'Refresh',
    security: 'Security',
    accountProtection: 'Account protection',
    recommendedNextStep: 'Recommended next step: {{action}}.',
    backupReady: 'Backup ready',
    backupMissing: 'Backup missing',
    setupPending: 'Setup pending',
    configured: 'Configured',
    notSet: 'Not set',
    primary: 'Primary',
    available: 'Available',
    exhausted: 'Exhausted',
    actionError: 'Unable to start the requested action.',
    setPrimaryTotpSuccess: 'Authenticator app set as the primary sign-in method.',
    setPrimaryWebauthnSuccess: 'Passkey or security key set as the primary sign-in method.',
    setPrimaryError: 'Unable to update the primary sign-in method.',
    actionCard: {
      totpTitle: 'Add authenticator app',
      totpDescription: 'Use one-time codes from an authenticator app on your phone.',
      totpStatusReady: 'Ready to use for sign-in.',
      totpStatusMissing: 'Not set yet.',
      totpButtonSetUp: 'Set up authenticator app',
      totpButtonReconfigure: 'Reconfigure authenticator app',
      totpHelper: 'Best if you want a portable second factor that works across devices when you keep backup access.',
      webauthnTitle: 'Add passkey or security key',
      webauthnDescription: 'Add a synced passkey or a hardware key for fast and secure sign-in.',
      webauthnStatusMissing: 'Not set yet.',
      webauthnCredentialsSaved_one: '{{count}} credential saved.',
      webauthnCredentialsSaved_other: '{{count}} credentials saved.',
      webauthnButtonSetUp: 'Set up passkey or key',
      webauthnButtonAddAnother: 'Add another credential',
      webauthnHelper: 'Ideal if you want a hardware key or synced passkey as a stronger day-to-day sign-in option.',
      recoveryTitle: 'Generate recovery codes',
      recoveryDescription: 'Keep emergency codes ready in case your phone or key is unavailable.',
      recoveryButtonGenerate: 'Generate recovery codes',
      recoveryButtonRegenerate: 'Regenerate recovery codes',
      recoveryHelper: 'Store these offline or in a password manager so you can still sign in if a device is lost.',
      setAsPrimary: 'Set as primary'
    },
    overview: {
      missingAllTitle: 'Your account is not fully protected yet.',
      missingAllDescription: 'Set up a second sign-in method and then add recovery codes so you do not lose access.',
      missingFallbackTitle: 'Your sign-in is protected, but backup access is still missing.',
      missingFallbackDescription: 'Add another method or recovery codes so a lost phone or key does not block your sign-in.',
      missingRecoveryTitle: 'Your main sign-in is set, but recovery is still incomplete.',
      missingRecoveryDescription: 'Generate recovery codes so you keep an emergency way back in.',
      successTitle: 'Your account is protected and backup access is ready.',
      successDescription: 'You can still get back in if one device becomes unavailable.'
    },
    actionStatus: {
      success: '{{label}} completed. The page was refreshed with the latest security status.',
      cancelled: '{{label}} was cancelled before completion.',
      error: '{{label}} did not complete successfully. Please try again.'
    },
    actionLabels: {
      totp: 'Authenticator app setup',
      webauthn: 'Passkey or security key setup',
      recovery: 'Recovery codes setup',
      password: 'Password update',
      requestedAction: 'Requested action'
    },
    methods: {
      totp: 'Authenticator app',
      webauthn: 'Passkey or security key',
      recovery: 'Recovery codes',
      notConfigured: 'Not configured'
    },
    recommendations: {
      totp: 'Add an authenticator app',
      webauthn: 'Add a passkey or security key',
      recovery: 'Generate recovery codes',
      review: 'Review your security setup'
    },
    recoverySummary: {
      pending: 'Setup started but not completed yet.',
      none: 'No recovery codes generated yet.',
      exhausted: 'Generated, but all codes are exhausted.',
      one: '1 code remaining.',
      many: '{{count}} codes remaining.'
    }
  },
  taxesSection: {
    title: 'Taxes',
    badge: 'Tax Profile',
    heroTitle: 'Configure the details behind your tax workspace',
    heroDescription: 'These values are used to unlock the Taxes area and drive tax estimates, filing cadence and compliance guidance.',
    formTitle: 'Tax profile',
    formDescription: 'Choose your fiscal residence, regime and activity type. You can update these values here whenever your situation changes.',
    saveLabel: 'Save tax profile',
    footerNote: 'These settings are used by the Taxes section and can be updated any time.'
  },
  taxForm: {
    defaultTitle: 'Set up your tax profile',
    defaultDescription: 'We need a few details to estimate taxes correctly.',
    defaultSaveLabel: 'Save and continue',
    defaultFooterNote: 'You can update this later from Settings.',
    taxRegime: 'Tax Regime',
    fiscalResidence: 'Fiscal Residence',
    vatFiling: 'VAT Filing',
    vatFilingDescription: 'Used to estimate VAT deadlines and recurring tax obligations.',
    activityType: 'Activity Type',
    selectBusinessArea: 'Select your business area',
    selectRegimeFirst: 'Select a tax regime first.',
    validationError: 'Select tax regime, activity type, and fiscal residence to continue.',
    saveError: 'Unexpected error while saving tax setup.',
    saving: 'Saving...',
    savedButton: 'Tax profile saved',
    savedMessage: 'Saved. Your Taxes workspace is now up to date.',
    saveHint: 'Save changes here to update the Taxes workspace.',
    vatFrequency: {
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly'
    },
    regime: {
      forfettarioLabel: 'Forfettario',
      ordinarioLabel: 'Ordinario',
      forfettarioDescription: 'Flat 5% or 15% tax rate',
      ordinarioDescription: 'Standard IRPEF brackets'
    },
    activity: {
      professionalLabel: 'Professional / Consultant',
      professionalDescription: 'Freelancers, digital services',
      retailLabel: 'Retail & E-commerce',
      retailDescription: 'Online shops, reselling',
      foodLabel: 'Food & Hospitality',
      foodDescription: 'Restaurants, bars',
      constructionLabel: 'Construction & Real Estate',
      constructionDescription: 'Renovation, property',
      otherLabel: 'Other Activities',
      otherDescription: 'Other or unsure'
    },
    residence: {
      italy: 'Italy',
      netherlands: 'Netherlands',
      belgium: 'Belgium',
      germany: 'Germany',
      other: 'Other country'
    }
  },
  bankingSection: {
    title: 'Banks & accounts',
    badge: 'Banks & accounts',
    heroTitleConnected: 'Keep your banking workspace in sync',
    heroTitleEmpty: 'Connect your first bank or create a manual bank',
    heroDescriptionConnected: 'Banks connected through Salt Edge and manual banks now live in the same workspace, with their accounts grouped under each bank.',
    heroDescriptionEmpty: 'Use Open Banking to import balances and transactions securely through Salt Edge, or create a manual bank and add its accounts directly in Opex.',
    statusReady: 'Ready to connect',
    statusLiveConnection_one: '{{count}} live connection',
    statusLiveConnection_other: '{{count}} live connections',
    statusManualBanks_one: '{{count}} manual bank',
    statusManualBanks_other: '{{count}} manual banks',
    summary: {
      connectedBanks: 'Connected banks',
      accountsTracked: 'Accounts tracked',
      taxBufferAccounts: 'Tax buffer accounts',
      totalSourcesZero: 'No sources connected yet',
      totalSources_one: '{{count}} total source in workspace',
      totalSources_other: '{{count}} total sources in workspace',
      manualAccounts_one: '{{count}} manual account',
      manualAccounts_other: '{{count}} manual accounts',
      importedAccounts: 'Imported through Open Banking',
      accountsPlaceholder: 'Manual and imported accounts will appear here',
      taxBufferEnabled: 'Included in tax buffer calculations',
      taxBufferMissing: 'Mark one or more accounts for tax reserve tracking'
    },
    secureFlowTitle: 'Secure connection flow',
    secureFlowDescription: 'Salt Edge handles the bank authorization step. Opex stores the connection result and still lets you mix live feeds with manual accounts.'
  },
  bankingList: {
    connectionActions: 'Connect or create',
    connectWithOpenBanking: 'Connect with Open Banking',
    preparingConsent: 'Preparing the Salt Edge consent flow...',
    addAnotherBank: 'Link another bank and keep balances or transactions synced automatically.',
    connectFirstBank: 'Securely connect your first bank through the Salt Edge authorization flow.',
    createManualBank: 'Create manual bank',
    createManualDescription: 'Create a local bank inside Opex and then use that bank to add one or more manual accounts.',
    currentConnections: 'Banks and accounts in the workspace',
    connectedBanks: 'Connected banks',
    manualBanks: 'Manual banks',
    sources_one: '{{count}} source',
    sources_other: '{{count}} sources',
    noSourcesTitle: 'No banking sources yet',
    noSourcesDescription: 'Start with Open Banking for live imports or create a manual bank to organize local accounts.',
    liveSource: 'Bank connected with Open Banking',
    manualSource: 'Manual bank',
    account_one: '{{count}} account',
    account_other: '{{count}} accounts',
    requiresReview: 'Needs review',
    reviewPendingCount_one: '{{count}} account still needs review',
    reviewPendingCount_other: '{{count}} accounts still need review'
  },
  bankingDetail: {
    fallbackTitle: 'Connected bank',
    backToConnections: 'Back to banks and accounts',
    liveSource: 'Bank connected with Open Banking',
    localSource: 'Manual bank',
    connectionActions: 'Connection actions',
    manualBankActions: 'Manual bank actions',
    connectedBankTitle: 'Connected bank',
    connectedBankDescription: 'This view represents the linked bank as a live connection. From here you can review every imported and synced account under the same bank.',
    manualBankTitle: 'Manual bank',
    manualBankDescription: 'This view represents a local manual bank. From here you can review every manual account grouped under the same bank.',
    manualBankSettings: 'Manual bank settings',
    renameManualBank: 'Rename bank',
    renameManualBankDescription:
      'Update the manual bank name without leaving this view. Accounts that still use the inherited bank label will be aligned automatically.',
    manualBankNameLabel: 'Bank name',
    manualBankNamePlaceholder: 'e.g. Family bank',
    manualBankNameRequired: 'Enter a name for the manual bank.',
    renameManualBankError: 'Unable to rename the manual bank.',
    savingManualBank: 'Saving...',
    saveManualBank: 'Save bank name',
    requiresReview: 'Needs review',
    pendingStatus: 'Needs review',
    configuredStatus: 'Configured',
    reviewNoticeTitle: 'This bank still has accounts to review',
    reviewNoticeDescription_one:
      'There is still {{count}} account to configure. Open it to finish account type and tax reserve.',
    reviewNoticeDescription_other:
      'There are still {{count}} accounts to configure. Open them to finish account type and tax reserve.',
    accountsInConnection: 'Accounts under this bank',
    accountsInConnectionDescription: 'Open an account to tell Opex how it should be used. Account type and tax reserve stay separate settings for both imported and manual accounts.',
    addManualAccount: 'Add account',
    noAccountsFound: 'No accounts found.',
    noManualAccountsTitle: 'No manual accounts yet',
    noManualAccountsDescription: 'This manual bank is ready, but it does not contain any accounts yet. Add the first account to start tracking it in Opex.',
    addFirstManualAccount: 'Add first account',
    taxBuffer: 'Tax reserve',
    secondaryConnectionActionDescription:
      'If you need to stop this link, you can disconnect the bank here. It is a secondary action and removes only the data imported through this connection.',
    secondaryManualBankActionDescription:
      'If you no longer need this manual bank, you can remove it here. Removal deletes the bank, its child manual accounts and their local transactions.',
    removeConnection: 'Disconnect this bank',
    removeConnectionDescription: 'All accounts and transactions imported from this bank through Salt Edge will be permanently deleted.',
    removeManualBank: 'Remove this manual bank',
    remove: 'Disconnect',
    removeManualBankCta: 'Remove',
    areYouSure: 'Are you sure?',
    removeWarning: 'This permanently deletes all accounts and transactions from {{provider}}. This cannot be undone.',
    removeWarningCopy: 'This permanently deletes all imported accounts and transactions from {{provider}}. This cannot be undone.',
    manualRemoveWarningCopy:
      'This permanently deletes the manual bank {{provider}}, the manual accounts under it and their local transactions. This cannot be undone.',
    cancel: 'Cancel',
    removing: 'Removing...',
    removingManualBank: 'Removing bank...',
    deleteConnection: 'Disconnect bank',
    deleteManualBank: 'Remove manual bank'
  },
  manualBankCreate: {
    shellTitle: 'Create manual bank',
    backToSources: 'Back to banks and accounts',
    badge: 'Manual bank',
    title: 'Create a manual bank',
    description: 'First create the local bank you want to track in Opex. You will then be able to add one or more accounts under the same bank, still inside Settings.',
    nameLabel: 'Bank name',
    namePlaceholder: 'e.g. Manual Fineco',
    helperTitle: 'Why create a manual bank',
    helperDescription: 'The manual bank becomes the container for your local accounts. This keeps manual accounts grouped correctly under the same bank.',
    cancel: 'Cancel',
    creating: 'Creating...',
    create: 'Create manual bank',
    nameRequired: 'Enter a name for the manual bank.',
    createError: 'Unable to create the manual bank.'
  },
  bankingEdit: {
    fallbackTitle: 'Account',
    backToConnection: 'Back to imported accounts',
    backToBank: 'Back to bank',
    editAccount: 'Configure account',
    editAccountDescription: 'You are configuring a single account here, not the connected bank as a whole.',
    liveSource: 'Account imported with Open Banking',
    localSource: 'Local account',
    manualSource: 'Manual account',
    accountName: 'Account Name',
    accountNamePlaceholder: 'e.g. ING current account',
    initialBalance: 'Initial balance',
    currency: 'Currency',
    accountCategory: 'Account type',
    categoryLabel: {
      personal: 'Personal',
      business: 'Business',
      savings: 'Savings'
    },
    categoryDescription: {
      personal: 'Personal banking, everyday spending and income.',
      business: 'Business operations, professional income and expenses.',
      savings: 'Savings goals, deposits and long-term reserves.'
    },
    categoryHelperCopy: 'Account type describes how you use this account day to day. It is separate from the tax reserve.',
    fiscalSettings: 'Tax reserve',
    taxBufferTitle: 'Use for tax reserve',
    taxBufferDescription: 'When enabled, Opex includes this account balance in how much to set aside for taxes.',
    taxBufferHelper: 'This does not change the account type. It only tells Opex whether this balance counts as tax money set aside.',
    savingsSuggestionTitle: 'This account might be a good fit',
    savingsSuggestionDescription: 'Savings accounts are often used to set money aside for taxes. If that matches your setup, you can include it in the tax reserve.',
    savingsSuggestionAction: 'Use for tax reserve',
    taxBufferEnabled: 'Tax reserve enabled',
    taxBufferEnabledDescriptionCopy: 'This account balance is included in fiscal calculations.',
    taxBufferEnabledDescription: 'This account’s balance is included in fiscal calculations.',
    savingChanges: 'Saving Changes...',
    saveChanges: 'Save Changes'
  },
  manualAccountCreate: {
    shellTitle: 'Add manual account',
    backToBank: 'Back to manual bank',
    badge: 'Manual account',
    title: 'Add a manual account',
    description: 'This account will be added under {{bank}} and will stay grouped under the same manual bank.',
    accountNameLabel: 'Account name',
    accountNamePlaceholder: 'e.g. Main account',
    initialBalanceLabel: 'Initial balance',
    currencyLabel: 'Currency',
    helperTitle: 'How this account will be used',
    helperDescription: 'Set the account role and tax reserve here from the start. You can still edit it later from the same manual bank.',
    cancel: 'Cancel',
    creating: 'Creating...',
    create: 'Add account',
    missingConnection: 'Open a valid manual bank first.',
    nameRequired: 'Enter a name for the manual account.',
    invalidBalance: 'Enter a valid numeric balance.',
    createError: 'Unable to create the manual account.'
  },
  bankingConsent: {
    badge: 'Open Banking Notice',
    title: 'Review the banking data notice',
    description: 'Before Opex redirects you to Salt Edge, confirm that you understand what banking data will be imported and why.',
    dataImported: 'Data imported',
    dataImportedDescription: 'Opex may import account identifiers, provider metadata, balances and transactions for the connected bank.',
    thirdPartyProcessing: 'Third-party processing',
    thirdPartyProcessingDescription: 'Salt Edge handles the authorization redirect and connection workflow with your bank.',
    acceptNotice: 'I accept the Open Banking Notice v{{version}}.',
    acceptNoticeDescription: 'I understand how Opex will use connected banking data inside the product.',
    readNotice: 'Open Banking Notice',
    saltEdgeRedirect: 'I understand that Opex will redirect me to Salt Edge to complete the bank connection setup.',
    saltEdgeRedirectDescription: 'Open Banking is optional overall. You can keep using manual accounts if you prefer not to connect a bank.',
    legalAlreadyAccepted: 'Privacy Notice and Terms of Service were already accepted during onboarding and do not need to be accepted again here.',
    cancel: 'Cancel',
    opening: 'Opening...',
    continueToSaltEdge: 'Continue to Salt Edge'
  },
  privacy: {
    title: 'GDPR & Data',
    consentStatus: 'Consent Status',
    consentCurrent: 'Current privacy notice and service terms are accepted for this account.',
    consentMissing: 'One or more required legal documents still need acceptance or renewal.',
    current: 'Current',
    updateRequired: 'Update Required',
    privacyNotice: 'Privacy Notice',
    privacyNoticeDescription: 'v{{version}} - Open the current notice in a new tab.',
    termsOfService: 'Terms Of Service',
    termsDescription: 'v{{version}} - Review the contractual rules for the app.',
    cookieNotice: 'Cookie Notice',
    cookieDescription: 'v{{version}} - See which browser storage keys are used.',
    openBankingNotice: 'Open Banking Notice',
    openBankingDescription: 'v{{version}} - Review banking-specific processing terms.',
    consentAudit: 'Consent Audit',
    consentAuditDescription: 'Recorded versions and timestamps currently stored for your account.',
    entries_one: '{{count}} Entry',
    entries_other: '{{count}} Entries',
    notRecorded: 'Not recorded',
    dataRights: 'Data Rights',
    dataRightsDescription: 'Export your data, review the processor setup or close the account from here.',
    preparingExport: 'Preparing Export...',
    downloadMyData: 'Download My Data',
    contactPrivacyTeam: 'Contact Privacy Team',
    deleteAccountConfirm: 'Delete your Opex account now? This will disable your local profile and log you out.',
    closingAccount: 'Closing Account...',
    deleteAccount: 'Delete Account',
    openBankingScopes: 'Open Banking Scopes',
    noScopes: 'No open-banking scope accepted yet.'
  },
  help: {
    title: 'Opex Support',
    summaryTitle: 'Help and legal references, without leaving settings',
    summaryDescription:
      'This section keeps FAQs, direct support contact and a shortcut to the legal documents already used across the product.',
    faq: {
      title: 'Frequently asked questions',
      description:
        'The final answers will arrive later. For now we keep a clear placeholder structure that can be filled in during future iterations.',
      placeholderAnswer: 'Answer in preparation. It will appear here in a future update.',
      items: {
        foreignBank: {
          question: 'How do I connect a foreign bank?'
        },
        excelExport: {
          question: 'Can I export my data to Excel?'
        },
        taxBuffer: {
          question: 'How is the tax reserve calculated?'
        },
        dataSafety: {
          question: 'Are my data safe?'
        }
      }
    },
    support: {
      title: 'Contact support',
      description:
        'For now product support is handled by email. The address comes from the real legal public info, not from a hardcoded placeholder.',
      emailLabel: 'Support email',
      emailUnavailable: 'Support email unavailable',
      cta: 'Email support'
    }
  }
} as const;
