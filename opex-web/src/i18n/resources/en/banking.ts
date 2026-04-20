export const bankingEn = {
  accountSetup: {
    editConnection: 'Configure connected bank',
    configureAccount: 'Configure account',
    configureImportedAccount: 'Configure imported account',
    successfullyAuthorized: 'Successfully authorized',
    connectedBank: 'Connected bank',
    manualAccount: 'Manual account',
    heroDescriptionImported:
      'First choose how this account should be classified in Opex, then decide whether it should also be used for the tax reserve.',
    heroDescriptionManual:
      'Start by deciding the role of this account in Opex. The operational account details remain available below in a separate section.',
    connectionDetails: 'Connection details',
    importedAccountDetails: 'Imported account details',
    manualAccountDetails: 'Manual account details',
    importedAccountTitle: 'Imported account',
    importedAccountDescription:
      'You are configuring how Opex should use this imported account. The connected bank remains distinct from the individual account.',
    accountName: 'Account name',
    institutionName: 'Institution name',
    placeholders: {
      accountName: 'Primary account',
      institutionName: 'Cash drawer'
    },
    initialBalance: 'Initial balance',
    currency: 'Currency',
    accountCategory: 'Account type',
    accountCategoryFocus:
      'This is the main decision: it tells Opex how this account should be interpreted across the workspace.',
    accountCategoryHelper:
      'Account type describes how you use this account. The tax reserve is a separate choice.',
    selectionSummaryCategory: 'Current account type',
    selectionSummaryReserve: 'Tax reserve',
    selectionSummaryReserveEnabled: 'Enabled',
    selectionSummaryReserveDisabled: 'Not enabled',
    selectionSummaryReserveEnabledDescription:
      'This balance is counted as money already set aside for taxes.',
    selectionSummaryReserveDisabledDescription:
      'This balance is not yet included in tax reserve calculations.',
    categories: {
      personal: 'Personal',
      business: 'Business',
      savings: 'Savings'
    },
    categorySummary: {
      personal: 'For daily spending, personal income and personal operational use.',
      business: 'For business operations, professional income and company expenses.',
      savings: 'For savings goals, parked cash and medium or long-term reserves.'
    },
    fiscalSettings: 'Tax reserve',
    taxReserveFocus:
      'Decide here whether this balance should count as money already set aside for taxes.',
    taxBufferTitle: 'Use for tax reserve',
    taxBufferDescription:
      'When enabled, Opex includes this account balance in how much to set aside for taxes.',
    taxBufferHelper: 'This choice is independent from account type.',
    savingsSuggestionTitle: 'This account might be a good fit',
    savingsSuggestionDescription:
      'Savings accounts are often used to set money aside for taxes. If that matches your setup, you can include it in the tax reserve.',
    savingsSuggestionAction: 'Use for tax reserve',
    secondaryDetailsTitle: 'Account details',
    secondaryDetailsDescriptionImported:
      'Here you can only rename the imported account, so it stays easier to recognize across Opex views.',
    secondaryDetailsDescriptionManual:
      'Here you can adjust the operational account details without changing the two main decisions.',
    saving: 'Saving...',
    saveChanges: 'Save changes',
    completeSetup: 'Complete setup',
    invalidBalance: 'Please provide a valid numeric balance.',
    saveError: 'Unable to complete setup.'
  },
  postSync: {
    badge: 'Open Banking',
    title: 'Bank connected successfully',
    description: 'We imported {{count}} account from {{bank}}. You can review it now or do it later from Settings > Banks & accounts.',
    description_other: 'We imported {{count}} accounts from {{bank}}. You can review them now or do it later from Settings > Banks & accounts.',
    importedAccountsSummary: '{{count}} imported account',
    importedAccountsSummary_other: '{{count}} imported accounts',
    summaryHelper:
      'From here you can open the connected bank directly in Settings > Banks & accounts and review each imported account there.',
    primaryAction: 'Review accounts',
    secondaryAction: 'I will do it later'
  },
  redirection: {
    openingWidget: 'Generating Salt Edge connection URL...',
    waitingRedirect: 'A new browser tab has been opened. Complete the flow there and you will be redirected to /success.',
    syncingSuccess: 'Synchronization in progress.',
    waiting: 'Please wait...',
    waitingNextStep: 'Waiting for next step...',
    title: 'Connecting to {{bank}}',
    back: 'Back',
    retry: 'Retry'
  },
  errors: {
    missingAccountId: 'Unable to identify the selected account.',
    invalidBalance: 'Please provide a valid numeric balance.',
    saveChanges: 'Unable to save changes.',
    removeConnection: 'Unable to remove connection.',
    missingNoticeVersion: 'Open banking notice version is not available yet. Reload and retry.',
    consentRequired: 'You must confirm both notices before connecting a bank.',
    startConnection: 'Unable to start open banking connection.'
  }
} as const;
