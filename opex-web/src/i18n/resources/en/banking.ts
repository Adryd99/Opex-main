export const bankingEn = {
  accountSetup: {
    editConnection: 'Edit connection',
    configureAccount: 'Configure account',
    successfullyAuthorized: 'Successfully authorized',
    connectionDetails: 'Connection details',
    manualAccountDetails: 'Manual account details',
    accountName: 'Account name',
    institutionName: 'Institution name',
    placeholders: {
      accountName: 'Primary account',
      institutionName: 'Cash drawer'
    },
    initialBalance: 'Initial balance',
    currency: 'Currency',
    accountCategory: 'Account category',
    categories: {
      personal: 'Personal',
      business: 'Business',
      savings: 'Savings'
    },
    fiscalSettings: 'Fiscal settings',
    taxBufferTitle: 'Tax buffer account',
    taxBufferDescription: 'Use this account to set aside tax liabilities.',
    saving: 'Saving...',
    saveChanges: 'Save changes',
    completeSetup: 'Complete setup',
    invalidBalance: 'Please provide a valid numeric balance.',
    saveError: 'Unable to complete setup.'
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
    saveChanges: 'Unable to save changes.',
    removeConnection: 'Unable to remove connection.',
    missingNoticeVersion: 'Open banking notice version is not available yet. Reload and retry.',
    consentRequired: 'You must confirm both notices before connecting a bank.',
    startConnection: 'Unable to start open banking connection.'
  }
} as const;
