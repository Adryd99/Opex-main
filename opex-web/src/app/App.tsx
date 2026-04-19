import {
  Calculator,
  LayoutGrid,
  Loader2,
  Settings,
  Wallet
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  APP_TABS,
  getAppPageTitle,
  isBudgetMobileTab,
  isDashboardMobileTab,
  isSettingsTab,
  isSubpageAppTab,
  resolveSettingsNavigationTarget
} from './navigation';
import { CenteredStatusCard, Sidebar, TopBar, WorkspacePreparationScreen } from './layout';
import { Button } from '../shared/ui';
import { AccountSetupPage, BankRedirectionPage } from '../features/banking';
import { BudgetPage } from '../features/budget';
import {
  AddTransactionPage,
  BreakdownLayout,
  DashboardPage,
  InsightsDetail,
  TransactionsPage
} from '../features/dashboard';
import { AddInvoicePage, InvoicingPage } from '../features/invoicing';
import { LegalCenterPage, resolveLegalCenterSlug } from '../features/legal';
import { PostBankConnectionGdprPage } from '../features/onboarding';
import {
  CategoriesPage,
  NotificationDetailsPage,
  RecurringPage,
  RenewConsentPage,
  SettingsPage,
  SupportPage
} from '../features/settings';
import {
  clearPendingSettingsReturnSection,
  readPendingSettingsReturnSection,
  writePendingSettingsReturnSection
} from '../features/settings/support/securityNavigation';
import { TaxesPage } from '../features/taxes';
import { DEFAULT_LEGAL_PUBLIC_INFO } from '../shared/legal';
import { useAppController } from './useAppController';
import { useKeycloakAuth } from '../services/auth/useKeycloakAuth';

export const App = () => {
  const legalDocumentSlug = resolveLegalCenterSlug(window.location.pathname);
  const normalizedPathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const pendingSettingsReturnSection = readPendingSettingsReturnSection();
  const shouldResumeSettingsSecurity = pendingSettingsReturnSection === 'SECURITY';
  const [settingsResumeSection, setSettingsResumeSection] = useState<'SECURITY' | null>(
    shouldResumeSettingsSecurity ? 'SECURITY' : null
  );
  const [settingsResumeApplied, setSettingsResumeApplied] = useState(false);

  const {
    isAuthenticated,
    errorMessage: authErrorMessage,
    login,
    logout
  } = useKeycloakAuth({ suspend: legalDocumentSlug !== null });

  const {
    activeTab,
    setActiveTab,
    lastMainTab,
    selectedBank,
    selectedBankAccount,
    selectedBankAccountId,
    userProfile,
    setUserProfile,
    bankAccounts,
    transactions,
    selectedProviderName,
    legalPublicInfo,
    aggregatedSummary,
    timeAggregatedSummary,
    taxBufferProviders,
    taxBufferDashboard,
    isTaxBufferLoading,
    isInitialSyncLoading,
    isDataRefreshing,
    isBankSyncInProgress,
    bankSyncStage,
    isManualBankSaving,
    isTransactionSaving,
    errorMessage: appErrorMessage,
    clearError,
    handleNavigate,
    startBankFlow,
    startConnectionSetup,
    refreshDashboardData,
    syncExternalBankAndNavigate,
    deleteExternalBankConnection,
    syncAfterSuccessRedirect,
    completeManualBankSetup,
    completeConnectionSetup,
    createLocalTransaction,
    saveUserProfile,
    requestEmailVerification,
    downloadDataExport,
    deleteAccount,
    updateBankAccountSettings,
    forecastData
  } = useAppController(isAuthenticated);

  const successSyncRequestedRef = useRef(false);
  const [postSaltEdgeGdprPending, setPostSaltEdgeGdprPending] = useState(false);
  const isSuccessRoute = window.location.pathname === '/success';
  const isEmbeddedWindow = window.self !== window.top;
  const activeLegalPublicInfo = legalPublicInfo ?? DEFAULT_LEGAL_PUBLIC_INFO;
  const shouldShowWorkspacePreparation =
    !authErrorMessage && (!isAuthenticated || isInitialSyncLoading);
  const shouldKeepBootSplash = !legalDocumentSlug && shouldShowWorkspacePreparation;

  useEffect(() => {
    const bootSplash = document.getElementById('boot-splash');
    if (!bootSplash) {
      return;
    }

    if (shouldKeepBootSplash) {
      bootSplash.classList.remove('boot-splash-hidden');
      bootSplash.setAttribute('aria-hidden', 'false');
      return;
    }

    bootSplash.classList.add('boot-splash-hidden');
    bootSplash.setAttribute('aria-hidden', 'true');

    const removalTimeout = window.setTimeout(() => {
      bootSplash.remove();
    }, 240);

    return () => window.clearTimeout(removalTimeout);
  }, [shouldKeepBootSplash]);

  useEffect(() => {
    if (normalizedPathname === '/security') {
      setSettingsResumeSection('SECURITY');
      setSettingsResumeApplied(false);
      writePendingSettingsReturnSection('SECURITY');
      window.history.replaceState({}, document.title, '/');
    }
  }, [normalizedPathname]);

  useEffect(() => {
    if (settingsResumeSection === 'SECURITY' && !settingsResumeApplied && activeTab !== APP_TABS.SETTINGS) {
      setActiveTab(APP_TABS.SETTINGS);
    }
  }, [activeTab, setActiveTab, settingsResumeApplied, settingsResumeSection]);

  useEffect(() => {
    if (settingsResumeSection !== 'SECURITY' || settingsResumeApplied || activeTab !== APP_TABS.SETTINGS) {
      return;
    }

    clearPendingSettingsReturnSection();
    setSettingsResumeApplied(true);
  }, [activeTab, settingsResumeApplied, settingsResumeSection]);

  useEffect(() => {
    if (settingsResumeSection === null || !settingsResumeApplied || activeTab === APP_TABS.SETTINGS) {
      return;
    }

    setSettingsResumeSection(null);
    setSettingsResumeApplied(false);
  }, [activeTab, settingsResumeApplied, settingsResumeSection]);

  useEffect(() => {
    if (!isAuthenticated || !isSuccessRoute || successSyncRequestedRef.current || isEmbeddedWindow) {
      return;
    }

    successSyncRequestedRef.current = true;
    setPostSaltEdgeGdprPending(true);
  }, [isAuthenticated, isSuccessRoute, isEmbeddedWindow]);

  if (legalDocumentSlug) {
    return <LegalCenterPage initialSlug={legalDocumentSlug} />;
  }

  if (shouldShowWorkspacePreparation) {
    return <WorkspacePreparationScreen />;
  }

  if (!isAuthenticated) {
    return (
      <CenteredStatusCard
        title="Autenticazione Keycloak"
        description={authErrorMessage}
        actions={authErrorMessage ? (
          <Button onClick={() => void login()}>
            Riprova login
          </Button>
        ) : undefined}
      />
    );
  }

  if (isSuccessRoute) {
    if (postSaltEdgeGdprPending && !isBankSyncInProgress) {
      return (
        <PostBankConnectionGdprPage
          legalPublicInfo={activeLegalPublicInfo}
          isSyncing={isBankSyncInProgress}
          onConfirm={() => {
            setPostSaltEdgeGdprPending(false);
            void syncAfterSuccessRedirect().catch(() => {
              successSyncRequestedRef.current = false;
            });
          }}
          onCancel={() => {
            window.history.replaceState({}, document.title, '/');
            setPostSaltEdgeGdprPending(false);
            successSyncRequestedRef.current = false;
          }}
        />
      );
    }

    return (
      <CenteredStatusCard
        title="Synchronizing Bank Data"
        icon={(
          <div className="w-14 h-14 mx-auto rounded-2xl bg-opex-teal/10 text-opex-teal flex items-center justify-center">
            <Loader2 size={28} className="animate-spin" />
          </div>
        )}
        description={
          appErrorMessage ? (
            <div className="space-y-3">
              <p className="text-red-600">{appErrorMessage}</p>
              <p>
                {isBankSyncInProgress || bankSyncStage === 'syncing_success'
                  ? 'Sync in progress, please wait...'
                  : 'Preparing synchronization...'}
              </p>
            </div>
          ) : (
            isBankSyncInProgress || bankSyncStage === 'syncing_success'
              ? 'Sync in progress, please wait...'
              : 'Preparing synchronization...'
          )
        }
        actions={appErrorMessage ? (
          <Button
            onClick={() => {
              successSyncRequestedRef.current = false;
              void syncAfterSuccessRedirect();
            }}
          >
            Retry sync
          </Button>
        ) : undefined}
      />
    );
  }

  const handleSettingsNavigate = (value: string) => {
    handleNavigate(resolveSettingsNavigationTarget(value));
  };

  const settingsPageProps = {
    userProfile,
    setUserProfile,
    bankAccounts,
    taxBufferProviders,
    legalPublicInfo: activeLegalPublicInfo,
    onBankSelect: startBankFlow,
    onConnectionSelect: startConnectionSetup,
    onCreateOpenBankConnection: syncExternalBankAndNavigate,
    onRemoveOpenBankConnection: deleteExternalBankConnection,
    onUpdateBankAccount: updateBankAccountSettings,
    isConnectingOpenBank: isBankSyncInProgress,
    openBankErrorMessage: appErrorMessage,
    onDownloadDataExport: downloadDataExport,
    onDeleteAccount: async () => {
      await deleteAccount();
      logout();
    },
    onSaveProfile: saveUserProfile,
    onRequestEmailVerification: requestEmailVerification,
    onNavigate: handleSettingsNavigate
  };

  const renderSettingsPage = (initialSection: 'PROFILE' | 'BANKING' | 'SECURITY') => (
    <SettingsPage
      {...settingsPageProps}
      initialSection={initialSection}
    />
  );

  const pageTitle = getAppPageTitle(activeTab);
  const isSubpage = isSubpageAppTab(activeTab);

  const mobileNavItems = [
    {
      id: APP_TABS.DASHBOARD,
      icon: LayoutGrid,
      isActive: isDashboardMobileTab(activeTab)
    },
    {
      id: APP_TABS.BUDGET,
      icon: Wallet,
      isActive: isBudgetMobileTab(activeTab)
    },
    {
      id: APP_TABS.TAXES,
      icon: Calculator,
      isActive: activeTab === APP_TABS.TAXES
    },
    {
      id: APP_TABS.SETTINGS,
      icon: Settings,
      isActive: activeTab === APP_TABS.SETTINGS || isSettingsTab(activeTab)
    }
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case APP_TABS.DASHBOARD:
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            userName={userProfile.name}
            transactions={transactions}
            selectedProviderName={selectedProviderName}
            aggregatedSummary={aggregatedSummary}
            isLoading={isInitialSyncLoading || isDataRefreshing}
            onRefresh={refreshDashboardData}
          />
        );
      case APP_TABS.BUDGET:
        return (
          <BudgetPage
            onNavigate={handleNavigate}
            selectedProviderName={selectedProviderName}
            aggregatedSummary={aggregatedSummary}
            timeAggregatedSummary={timeAggregatedSummary}
            forecastData={forecastData}
          />
        );
      case APP_TABS.TAXES:
        return (
          <TaxesPage
            onNavigate={handleNavigate}
            selectedProviderName={selectedProviderName}
            userProfile={userProfile}
            taxBufferDashboard={taxBufferDashboard}
            isLoading={isTaxBufferLoading}
            onSaveTaxSetup={saveUserProfile}
          />
        );
      case APP_TABS.INVOICING:
        return <InvoicingPage userProfile={userProfile} />;
      case APP_TABS.RECURRING:
        return <RecurringPage onBack={() => setActiveTab(lastMainTab)} />;
      case APP_TABS.INCOME:
        return <BreakdownLayout type="INCOME" onBack={() => setActiveTab(lastMainTab)} />;
      case APP_TABS.EXPENSES:
        return <BreakdownLayout type="EXPENSES" onBack={() => setActiveTab(lastMainTab)} />;
      case APP_TABS.TRANSACTIONS_IN:
        return <TransactionsPage onBack={() => setActiveTab(lastMainTab)} transactions={transactions} initialFilter="In" />;
      case APP_TABS.TRANSACTIONS_OUT:
        return <TransactionsPage onBack={() => setActiveTab(lastMainTab)} transactions={transactions} initialFilter="Out" />;
      case APP_TABS.INSIGHTS:
        return <InsightsDetail onBack={() => setActiveTab(lastMainTab)} />;
      case APP_TABS.ALL_ACTIVITY:
        return <TransactionsPage onBack={() => setActiveTab(lastMainTab)} transactions={transactions} />;
      case APP_TABS.SETTINGS:
        return renderSettingsPage(settingsResumeSection === 'SECURITY' ? 'SECURITY' : 'PROFILE');

      // Quick Action Pages
      case APP_TABS.QUICK_INCOME:
        return (
          <AddTransactionPage
            type="INCOME"
            onBack={() => setActiveTab(lastMainTab)}
            bankAccounts={bankAccounts}
            onSubmit={createLocalTransaction}
            isSaving={isTransactionSaving}
          />
        );
      case APP_TABS.QUICK_EXPENSE:
        return (
          <AddTransactionPage
            type="EXPENSE"
            onBack={() => setActiveTab(lastMainTab)}
            bankAccounts={bankAccounts}
            onSubmit={createLocalTransaction}
            isSaving={isTransactionSaving}
          />
        );
      case APP_TABS.QUICK_INVOICE:
        return <AddInvoicePage onBack={() => setActiveTab(lastMainTab)} userProfile={userProfile} bankAccounts={bankAccounts} />;

      // Settings Subpages
      case APP_TABS.SETTINGS_OPEN_BANKING:
        return renderSettingsPage('BANKING');
      case APP_TABS.SETTINGS_BANK_REDIRECT:
        return selectedBank ? (
          <BankRedirectionPage
            bank={selectedBank}
            onComplete={syncExternalBankAndNavigate}
            onBack={() => setActiveTab(APP_TABS.SETTINGS_OPEN_BANKING)}
            isSyncing={isBankSyncInProgress}
            syncStage={bankSyncStage}
            errorMessage={appErrorMessage}
          />
        ) : null;
      case APP_TABS.SETTINGS_BANK_SETUP:
        return selectedBank ? (
          <AccountSetupPage
            bank={selectedBank}
            onBack={() => setActiveTab(APP_TABS.SETTINGS_OPEN_BANKING)}
            onComplete={(payload) => {
              if (selectedBankAccount) {
                if (!selectedBankAccountId) {
                  return Promise.reject(new Error('Missing accountId for selected connection.'));
                }
                return completeConnectionSetup(selectedBankAccountId, payload);
              }
              return completeManualBankSetup(payload);
            }}
            isSaving={isManualBankSaving}
            isManual={Boolean(selectedBank.isManual)}
            presetAccount={selectedBankAccount}
          />
        ) : null;
      case APP_TABS.SETTINGS_RENEW_CONSENT:
        return <RenewConsentPage onBack={() => setActiveTab(APP_TABS.SETTINGS)} />;
      case APP_TABS.SETTINGS_CATEGORIES:
        return <CategoriesPage onBack={() => setActiveTab(APP_TABS.SETTINGS)} />;
      case APP_TABS.SETTINGS_NOTIFICATIONS:
        return <NotificationDetailsPage onBack={() => setActiveTab(APP_TABS.SETTINGS)} />;
      case APP_TABS.SETTINGS_SUPPORT:
        return <SupportPage onBack={() => setActiveTab(APP_TABS.SETTINGS)} />;

      default:
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            userName={userProfile.name}
            transactions={transactions}
            selectedProviderName={selectedProviderName}
            aggregatedSummary={aggregatedSummary}
            isLoading={isInitialSyncLoading || isDataRefreshing}
            onRefresh={refreshDashboardData}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans flex text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Sidebar activeTab={activeTab} setActiveTab={handleNavigate} onLogout={logout} userProfile={userProfile} />
      <main className="flex-1 md:ml-64 min-w-0 relative dark:bg-slate-900">
        {!isSubpage && <TopBar title={pageTitle} />}
        {appErrorMessage && (
          <div className="px-4 md:px-6 pt-4 max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between gap-4 text-sm">
              <span>{appErrorMessage}</span>
              <button onClick={clearError} className="font-bold text-xs uppercase tracking-wider">Dismiss</button>
            </div>
          </div>
        )}
        <div className={`${isSubpage ? 'p-0' : 'p-4 md:p-6'} max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300`}>
          {renderContent()}
        </div>

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around p-4 z-50 shadow-up">
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`p-2 rounded-xl transition-colors ${item.isActive ? 'text-opex-teal' : 'text-gray-400'}`}
            >
              <item.icon size={24} />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};
