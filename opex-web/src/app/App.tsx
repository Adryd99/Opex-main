import {
  Calculator,
  LayoutGrid,
  Loader2,
  Settings,
  Wallet
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { CenteredStatusCard, Sidebar, TopBar } from './layout';
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
import { LegalDocumentPage, resolveLegalDocumentSlug } from '../features/legal';
import { OnboardingPage, PostBankConnectionGdprPage } from '../features/onboarding';
import {
  CategoriesPage,
  ChangePasswordPage,
  EditProfilePage,
  NotificationDetailsPage,
  RecurringPage,
  RenewConsentPage,
  SettingsPage,
  SupportPage
} from '../features/settings';
import { TaxesPage } from '../features/taxes';
import { DEFAULT_LEGAL_PUBLIC_INFO } from '../services/api/legalFallbacks';



import { useAppController } from './useAppController';
import { useKeycloakAuth } from '../services/auth/useKeycloakAuth';

const PAGE_TITLES: Record<string, string> = {
  DASHBOARD: 'Overview',
  BUDGET: 'Budget',
  TAXES: 'Tax Buffer',
  INVOICING: 'Invoicing',
  INCOME: 'Income Breakdown',
  EXPENSES: 'Expense Breakdown',
  TRANSACTIONS_IN: 'Income Transactions',
  TRANSACTIONS_OUT: 'Expense Transactions',
  INSIGHTS: 'Financial Insights',
  '[]': 'All Activity',
  SETTINGS: 'Settings'
};

const SETTINGS_ROOT_TABS = new Set(['SETTINGS_OPEN_BANKING', 'SETTINGS_ADD_BANK']);
const SUBPAGE_TABS = new Set([
  'INCOME',
  'EXPENSES',
  'TRANSACTIONS_IN',
  'TRANSACTIONS_OUT',
  'INSIGHTS',
  '[]',
  'QUICK_INCOME',
  'QUICK_EXPENSE',
  'QUICK_INVOICE',
  'SETTINGS_BANK_SETUP'
]);
const DASHBOARD_MOBILE_TABS = new Set(['INCOME', 'EXPENSES', '[]']);
const BUDGET_MOBILE_TABS = new Set(['INSIGHTS']);

const isGlobalSettingsShortcut = (value: string) =>
  value.startsWith('QUICK_') || value === 'ADD_BANK' || value === 'OPEN_BANKING' || value === 'SETTINGS_OPEN_BANKING';

export const App = () => {
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    errorMessage: authErrorMessage,
    login,
    logout
  } = useKeycloakAuth();

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
    completeOnboarding,
    downloadDataExport,
    deleteAccount,
    updateBankAccountSettings,
    forecastData
  } = useAppController(isAuthenticated);

  const successSyncRequestedRef = useRef(false);
  const [postSaltEdgeGdprPending, setPostSaltEdgeGdprPending] = useState(false);
  const isSuccessRoute = window.location.pathname === '/success';
  const legalDocumentSlug = resolveLegalDocumentSlug(window.location.pathname);
  const isEmbeddedWindow = window.self !== window.top;
  const activeLegalPublicInfo = legalPublicInfo ?? DEFAULT_LEGAL_PUBLIC_INFO;
  const needsMandatoryLegalAcceptance = Boolean(
    activeLegalPublicInfo && (
      !userProfile.gdprAccepted ||
      userProfile.privacyPolicyVersion !== activeLegalPublicInfo.privacyPolicy.version ||
      userProfile.termsOfServiceVersion !== activeLegalPublicInfo.termsOfService.version
    )
  );

  useEffect(() => {
    if (!isAuthenticated || !isSuccessRoute || successSyncRequestedRef.current || isEmbeddedWindow) {
      return;
    }

    successSyncRequestedRef.current = true;
    setPostSaltEdgeGdprPending(true);
  }, [isAuthenticated, isSuccessRoute, isEmbeddedWindow]);

  if (legalDocumentSlug) {
    return <LegalDocumentPage slug={legalDocumentSlug} />;
  }

  if (!isAuthenticated) {
    return (
      <CenteredStatusCard
        title="Autenticazione Keycloak"
        description={authErrorMessage ?? (
          isAuthLoading
            ? 'Verifica sessione in corso...'
            : 'Reindirizzamento a Keycloak in corso...'
        )}
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

  if (isInitialSyncLoading) {
    return (
      <CenteredStatusCard
        title="Preparing your workspace"
        icon={(
          <div className="w-14 h-14 mx-auto rounded-2xl bg-opex-teal/10 text-opex-teal flex items-center justify-center">
            <Loader2 size={28} className="animate-spin" />
          </div>
        )}
        description="We are syncing your profile and loading the latest data."
      />
    );
  }

  if (needsMandatoryLegalAcceptance) {
    return (
      <OnboardingPage
        userProfile={userProfile}
        legalPublicInfo={activeLegalPublicInfo}
        onComplete={completeOnboarding}
      />
    );
  }

  const handleSettingsNavigate = (value: string) => {
    if (isGlobalSettingsShortcut(value)) {
      handleNavigate(value);
      return;
    }

    handleNavigate(`SETTINGS_${value}`);
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
    onNavigate: handleSettingsNavigate
  };

  const renderSettingsPage = (initialSection: 'PROFILE' | 'BANKING') => (
    <SettingsPage
      {...settingsPageProps}
      initialSection={initialSection}
    />
  );

  const pageTitle = activeTab === 'QUICK_INVOICE'
    ? 'Invoicing'
    : activeTab.startsWith('SETTINGS_')
    ? 'Settings'
    : activeTab.startsWith('QUICK_')
      ? 'New Transaction'
      : PAGE_TITLES[activeTab] ?? 'Opex';

  const isSubpage = SUBPAGE_TABS.has(activeTab)
    || (activeTab.startsWith('SETTINGS_') && !SETTINGS_ROOT_TABS.has(activeTab));

  const mobileNavItems = [
    {
      id: 'DASHBOARD',
      icon: LayoutGrid,
      isActive: activeTab === 'DASHBOARD' || DASHBOARD_MOBILE_TABS.has(activeTab)
    },
    {
      id: 'BUDGET',
      icon: Wallet,
      isActive: activeTab === 'BUDGET' || BUDGET_MOBILE_TABS.has(activeTab)
    },
    {
      id: 'TAXES',
      icon: Calculator,
      isActive: activeTab === 'TAXES'
    },
    {
      id: 'SETTINGS',
      icon: Settings,
      isActive: activeTab === 'SETTINGS' || activeTab.startsWith('SETTINGS_')
    }
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case 'DASHBOARD':
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
      case 'BUDGET':
        return (
          <BudgetPage
            onNavigate={handleNavigate}
            selectedProviderName={selectedProviderName}
            aggregatedSummary={aggregatedSummary}
            timeAggregatedSummary={timeAggregatedSummary}
            forecastData={forecastData}
          />
        );
      case 'TAXES':
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
      case 'INVOICING':
        return <InvoicingPage userProfile={userProfile} />;
      case 'RECURRING':
        return <RecurringPage onBack={() => setActiveTab(lastMainTab)} />;
      case 'INCOME':
        return <BreakdownLayout type="INCOME" onBack={() => setActiveTab(lastMainTab)} />;
      case 'EXPENSES':
        return <BreakdownLayout type="EXPENSES" onBack={() => setActiveTab(lastMainTab)} />;
      case 'TRANSACTIONS_IN':
        return <TransactionsPage onBack={() => setActiveTab(lastMainTab)} transactions={transactions} initialFilter="In" />;
      case 'TRANSACTIONS_OUT':
        return <TransactionsPage onBack={() => setActiveTab(lastMainTab)} transactions={transactions} initialFilter="Out" />;
      case 'INSIGHTS':
        return <InsightsDetail onBack={() => setActiveTab(lastMainTab)} />;
      case '[]':
        return <TransactionsPage onBack={() => setActiveTab(lastMainTab)} transactions={transactions} />;
      case 'SETTINGS':
        return renderSettingsPage('PROFILE');

      // Quick Action Pages
      case 'QUICK_INCOME':
        return (
          <AddTransactionPage
            type="INCOME"
            onBack={() => setActiveTab(lastMainTab)}
            bankAccounts={bankAccounts}
            onSubmit={createLocalTransaction}
            isSaving={isTransactionSaving}
          />
        );
      case 'QUICK_EXPENSE':
        return (
          <AddTransactionPage
            type="EXPENSE"
            onBack={() => setActiveTab(lastMainTab)}
            bankAccounts={bankAccounts}
            onSubmit={createLocalTransaction}
            isSaving={isTransactionSaving}
          />
        );
      case 'QUICK_INVOICE':
        return <AddInvoicePage onBack={() => setActiveTab(lastMainTab)} userProfile={userProfile} bankAccounts={bankAccounts} />;

      // Settings Subpages
      case 'SETTINGS_EDIT_PROFILE':
        return (
          <EditProfilePage
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            onSaveProfile={saveUserProfile}
            onBack={() => setActiveTab('SETTINGS')}
          />
        );
      case 'SETTINGS_OPEN_BANKING':
      case 'SETTINGS_ADD_BANK': // Legacy alias
        return renderSettingsPage('BANKING');
      case 'SETTINGS_BANK_REDIRECT':
        return selectedBank ? (
          <BankRedirectionPage
            bank={selectedBank}
            onComplete={syncExternalBankAndNavigate}
            onBack={() => setActiveTab('SETTINGS_OPEN_BANKING')}
            isSyncing={isBankSyncInProgress}
            syncStage={bankSyncStage}
            errorMessage={appErrorMessage}
          />
        ) : null;
      case 'SETTINGS_BANK_SETUP':
        return selectedBank ? (
          <AccountSetupPage
            bank={selectedBank}
            onBack={() => setActiveTab('SETTINGS_OPEN_BANKING')}
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
      case 'SETTINGS_RENEW_CONSENT':
        return <RenewConsentPage onBack={() => setActiveTab('SETTINGS')} />;
      case 'SETTINGS_CHANGE_PASSWORD':
        return <ChangePasswordPage onBack={() => setActiveTab('SETTINGS')} />;
      case 'SETTINGS_CATEGORIES':
        return <CategoriesPage onBack={() => setActiveTab('SETTINGS')} />;
      case 'SETTINGS_NOTIFICATIONS':
        return <NotificationDetailsPage onBack={() => setActiveTab('SETTINGS')} />;
      case 'SETTINGS_SUPPORT':
        return <SupportPage onBack={() => setActiveTab('SETTINGS')} />;

      case 'ADD_BANK': // Global shortcut
      case 'OPEN_BANKING': // Global shortcut alias
        return renderSettingsPage('BANKING');

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
