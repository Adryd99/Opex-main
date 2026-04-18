import { useState } from 'react';

import { useAppData } from './controller/useAppData';
import { useAppNavigation } from './controller/useAppNavigation';
import { useBankingFlow } from './controller/useBankingFlow';
import { useProfileActions } from './controller/useProfileActions';

export const useAppController = (isAuthenticated: boolean) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigation = useAppNavigation();
  const appData = useAppData({
    isAuthenticated,
    setErrorMessage
  });
  const bankingFlow = useBankingFlow({
    activeTab: navigation.activeTab,
    setActiveTab: navigation.setActiveTab,
    bankAccounts: appData.bankAccounts,
    legalPublicInfo: appData.legalPublicInfo,
    providerByConnectionId: appData.providerByConnectionId,
    refreshDashboardData: appData.refreshDashboardData,
    setErrorMessage,
    setUserProfile: appData.setUserProfile
  });
  const profileActions = useProfileActions({
    bankAccounts: appData.bankAccounts,
    legalPublicInfo: appData.legalPublicInfo,
    refreshDashboardData: appData.refreshDashboardData,
    setActiveTab: navigation.setActiveTab,
    setErrorMessage,
    setUserProfile: appData.setUserProfile,
    userProfile: appData.userProfile,
    transactions: appData.allTransactions,
    taxes: appData.taxes,
    taxBufferProviders: appData.taxBufferProviders,
    taxBufferDashboard: appData.taxBufferDashboard
  });

  return {
    activeTab: navigation.activeTab,
    setActiveTab: navigation.setActiveTab,
    lastMainTab: navigation.lastMainTab,
    setLastMainTab: navigation.setLastMainTab,
    selectedBank: bankingFlow.selectedBank,
    selectedBankAccount: bankingFlow.selectedBankAccount,
    selectedBankAccountId: bankingFlow.selectedBankAccountId,
    connectionSetupAccounts: bankingFlow.connectionSetupAccounts,
    setSelectedBank: bankingFlow.setSelectedBank,
    setSelectedBankAccount: bankingFlow.setSelectedBankAccount,
    userProfile: appData.userProfile,
    setUserProfile: appData.setUserProfile,
    bankAccounts: appData.bankAccounts,
    transactions: appData.transactions,
    taxes: appData.taxes,
    legalPublicInfo: appData.legalPublicInfo,
    selectedProviderName: appData.selectedProviderName,
    aggregatedSummary: appData.aggregatedSummary,
    timeAggregatedSummary: appData.timeAggregatedSummary,
    taxBufferProviders: appData.taxBufferProviders,
    taxBufferDashboard: appData.taxBufferDashboard,
    forecastData: appData.forecastData,
    isTaxBufferLoading: appData.isTaxBufferLoading,
    isInitialSyncLoading: appData.isInitialSyncLoading,
    isDataRefreshing: appData.isDataRefreshing,
    isBankSyncInProgress: bankingFlow.isBankSyncInProgress,
    bankSyncStage: bankingFlow.bankSyncStage,
    bankPopupUrl: bankingFlow.bankPopupUrl,
    isManualBankSaving: bankingFlow.isManualBankSaving,
    isTransactionSaving: profileActions.isTransactionSaving,
    errorMessage,
    clearError: () => setErrorMessage(null),
    handleNavigate: navigation.handleNavigate,
    startBankFlow: bankingFlow.startBankFlow,
    startConnectionSetup: bankingFlow.startConnectionSetup,
    selectConnectionAccountForSetup: bankingFlow.selectConnectionAccountForSetup,
    refreshDashboardData: appData.refreshDashboardData,
    syncExternalBankAndNavigate: bankingFlow.syncExternalBankAndNavigate,
    refreshExternalBankConnection: bankingFlow.refreshExternalBankConnection,
    deleteExternalBankConnection: bankingFlow.deleteExternalBankConnection,
    syncAfterSuccessRedirect: bankingFlow.syncAfterSuccessRedirect,
    completeManualBankSetup: bankingFlow.completeManualBankSetup,
    completeConnectionSetup: bankingFlow.completeConnectionSetup,
    createLocalTransaction: profileActions.createLocalTransaction,
    saveUserProfile: profileActions.saveUserProfile,
    requestEmailVerification: profileActions.requestEmailVerification,
    downloadDataExport: profileActions.downloadDataExport,
    deleteAccount: profileActions.deleteAccount,
    updateBankAccountSettings: bankingFlow.updateBankAccountSettings
  };
};
