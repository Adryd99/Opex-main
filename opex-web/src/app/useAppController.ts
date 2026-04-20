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
    setActiveTab: navigation.setActiveTab,
    bankConnections: appData.bankConnections,
    bankAccounts: appData.bankAccounts,
    legalPublicInfo: appData.legalPublicInfo,
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
    pendingConnectionReviewById: bankingFlow.pendingConnectionReviewById,
    userProfile: appData.userProfile,
    setUserProfile: appData.setUserProfile,
    bankConnections: appData.bankConnections,
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
    isTransactionSaving: profileActions.isTransactionSaving,
    errorMessage,
    clearError: () => setErrorMessage(null),
    handleNavigate: navigation.handleNavigate,
    refreshDashboardData: appData.refreshDashboardData,
    syncExternalBankAndNavigate: bankingFlow.syncExternalBankAndNavigate,
    createManualBankConnection: bankingFlow.createManualBankConnection,
    updateManualBankConnection: bankingFlow.updateManualBankConnection,
    deleteManualBankConnection: bankingFlow.deleteManualBankConnection,
    createManualBankAccount: bankingFlow.createManualBankAccount,
    refreshExternalBankConnection: bankingFlow.refreshExternalBankConnection,
    deleteExternalBankConnection: bankingFlow.deleteExternalBankConnection,
    syncAfterSuccessRedirect: bankingFlow.syncAfterSuccessRedirect,
    createLocalTransaction: profileActions.createLocalTransaction,
    saveUserProfile: profileActions.saveUserProfile,
    requestEmailVerification: profileActions.requestEmailVerification,
    downloadDataExport: profileActions.downloadDataExport,
    deleteAccount: profileActions.deleteAccount,
    updateBankAccountSettings: bankingFlow.updateBankAccountSettings
  };
};
