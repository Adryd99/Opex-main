import {
  Calculator,
  LayoutGrid,
  Loader2,
  Settings,
  Wallet
} from 'lucide-react';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
import { LegalCenterPage, resolveLegalCenterSlug } from '../features/legal';
import {
  PostBankConnectionGdprPage,
  PostBankConnectionSuccessOverlay
} from '../features/onboarding';
import {
  clearPendingSettingsReturnSection,
  readPendingSettingsReturnSection,
  writePendingSettingsReturnSection
} from '../features/settings/support/securityNavigation';
import { DEFAULT_LEGAL_PUBLIC_INFO } from '../shared/legal';
import { useAppController } from './useAppController';
import { useKeycloakAuth } from '../services/auth/useKeycloakAuth';

const DashboardPage = lazy(() =>
  import('../features/dashboard/pages/DashboardPage').then((module) => ({
    default: module.DashboardPage
  }))
);
const BudgetPage = lazy(() =>
  import('../features/budget/pages/BudgetPage').then((module) => ({
    default: module.BudgetPage
  }))
);
const TaxesPage = lazy(() =>
  import('../features/taxes/pages/TaxesPage').then((module) => ({
    default: module.TaxesPage
  }))
);
const AddTransactionPage = lazy(() =>
  import('../features/dashboard/pages/AddTransactionPage').then((module) => ({
    default: module.AddTransactionPage
  }))
);
const BreakdownLayout = lazy(() =>
  import('../features/dashboard/pages/BreakdownLayout').then((module) => ({
    default: module.BreakdownLayout
  }))
);
const InsightsDetail = lazy(() =>
  import('../features/dashboard/pages/InsightsDetail').then((module) => ({
    default: module.InsightsDetail
  }))
);
const TransactionsPage = lazy(() =>
  import('../features/dashboard/pages/TransactionsPage').then((module) => ({
    default: module.TransactionsPage
  }))
);
const InvoicingPage = lazy(() =>
  import('../features/invoicing').then((module) => ({
    default: module.InvoicingPage
  }))
);
const AddInvoicePage = lazy(() =>
  import('../features/invoicing').then((module) => ({
    default: module.AddInvoicePage
  }))
);
const SettingsPage = lazy(() =>
  import('../features/settings/pages/SettingsPage').then((module) => ({
    default: module.SettingsPage
  }))
);
const RecurringPage = lazy(() =>
  import('../features/settings/pages/RecurringPage').then((module) => ({
    default: module.RecurringPage
  }))
);
const RenewConsentPage = lazy(() =>
  import('../features/settings/pages/RenewConsentPage').then((module) => ({
    default: module.RenewConsentPage
  }))
);

export const App = () => {
  const { t } = useTranslation(['app', 'settings']);
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
    userProfile,
    setUserProfile,
    pendingConnectionReviewById,
    bankConnections,
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
    isTransactionSaving,
    errorMessage: appErrorMessage,
    clearError,
    handleNavigate,
    refreshDashboardData,
    syncExternalBankAndNavigate,
    createManualBankConnection,
    updateManualBankConnection,
    deleteManualBankConnection,
    createManualBankAccount,
    deleteExternalBankConnection,
    syncAfterSuccessRedirect,
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
  const [postSyncImportedAccountsSummary, setPostSyncImportedAccountsSummary] = useState<{
    providerName: string;
    importedAccountCount: number;
    connectionId: string | null;
  } | null>(null);
  const [initialBankConnectionId, setInitialBankConnectionId] = useState<string | null>(null);
  const isSuccessRoute = window.location.pathname === '/success';
  const isEmbeddedWindow = window.self !== window.top;
  const activeLegalPublicInfo = legalPublicInfo ?? DEFAULT_LEGAL_PUBLIC_INFO;
  const shouldShowWorkspacePreparation =
    !authErrorMessage && (!isAuthenticated || isInitialSyncLoading);
  const shouldKeepBootSplash = !legalDocumentSlug && shouldShowWorkspacePreparation;
  const displayedTab = isSuccessRoute ? APP_TABS.SETTINGS_BANKING : activeTab;

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
    if (!isAuthenticated || !isSuccessRoute) {
      return;
    }

    setActiveTab(APP_TABS.SETTINGS_BANKING);
  }, [isAuthenticated, isSuccessRoute, setActiveTab]);

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
        title={t('app:status.authTitle')}
        description={authErrorMessage}
        actions={authErrorMessage ? (
          <Button onClick={() => void login()}>
            {t('app:status.retryLogin')}
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
    bankConnections,
    bankAccounts,
    taxBufferProviders,
    legalPublicInfo: activeLegalPublicInfo,
    onCreateManualBankConnection: createManualBankConnection,
    onUpdateManualBankConnection: updateManualBankConnection,
    onRemoveManualBankConnection: deleteManualBankConnection,
    onCreateManualBankAccount: createManualBankAccount,
    onCreateOpenBankConnection: syncExternalBankAndNavigate,
    onRemoveOpenBankConnection: deleteExternalBankConnection,
    onUpdateBankAccount: updateBankAccountSettings,
    pendingConnectionReviewById,
    initialBankConnectionId,
    onInitialBankConnectionHandled: () => setInitialBankConnectionId(null),
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

  const renderSettingsPage = (initialSection: 'PROFILE' | 'BANKING' | 'SECURITY' | 'TAXES') => (
    <SettingsPage
      {...settingsPageProps}
      initialSection={initialSection}
    />
  );

  const pageTitle = getAppPageTitle(displayedTab, t);
  const isSubpage = isSubpageAppTab(displayedTab);
  const pageLoadingFallback = (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="flex items-center justify-center rounded-2xl border border-app-border bg-app-surface px-4 py-4 shadow-soft">
        <Loader2 size={22} className="animate-spin text-opex-teal" />
      </div>
    </div>
  );

  const mobileNavItems = [
    {
      id: APP_TABS.DASHBOARD,
      icon: LayoutGrid,
      isActive: isDashboardMobileTab(displayedTab)
    },
    {
      id: APP_TABS.BUDGET,
      icon: Wallet,
      isActive: isBudgetMobileTab(displayedTab)
    },
    {
      id: APP_TABS.TAXES,
      icon: Calculator,
      isActive: displayedTab === APP_TABS.TAXES
    },
    {
      id: APP_TABS.SETTINGS,
      icon: Settings,
      isActive: displayedTab === APP_TABS.SETTINGS || isSettingsTab(displayedTab)
    }
  ] as const;

  const renderContent = () => {
    switch (displayedTab) {
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
      case APP_TABS.SETTINGS_TAXES:
        return renderSettingsPage('TAXES');

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
      case APP_TABS.SETTINGS_BANKING:
        return renderSettingsPage('BANKING');
      case APP_TABS.SETTINGS_RENEW_CONSENT:
        return <RenewConsentPage onBack={() => setActiveTab(APP_TABS.SETTINGS)} />;

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

  const successOverlay = (() => {
    if (postSyncImportedAccountsSummary) {
      return (
        <PostBankConnectionSuccessOverlay
          bankName={postSyncImportedAccountsSummary.providerName}
          importedAccountCount={postSyncImportedAccountsSummary.importedAccountCount}
          onReviewAccounts={() => {
            setInitialBankConnectionId(postSyncImportedAccountsSummary.connectionId);
            setPostSyncImportedAccountsSummary(null);
            setActiveTab(APP_TABS.SETTINGS_BANKING);
          }}
          onDoLater={() => {
            setPostSyncImportedAccountsSummary(null);
            setInitialBankConnectionId(null);
            setActiveTab(APP_TABS.SETTINGS_BANKING);
          }}
        />
      );
    }

    if (!isSuccessRoute) {
      return null;
    }

    if (postSaltEdgeGdprPending && !isBankSyncInProgress) {
      return (
        <PostBankConnectionGdprPage
          legalPublicInfo={activeLegalPublicInfo}
          isSyncing={isBankSyncInProgress}
          onConfirm={() => {
            setPostSaltEdgeGdprPending(false);
            void syncAfterSuccessRedirect()
              .then((summary) => {
                if (summary) {
                  setPostSyncImportedAccountsSummary(summary);
                }
              })
              .catch(() => {
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
      <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-[6px] dark:bg-slate-950/55">
        <div className="w-full max-w-md rounded-[2.25rem] border border-white/70 bg-white/95 p-6 text-center shadow-[0_32px_80px_-32px_rgba(15,23,42,0.45)] md:p-8 dark:border-app-border dark:bg-app-surface/95">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-opex-teal/10 text-opex-teal flex items-center justify-center">
            <Loader2 size={28} className={`${isBankSyncInProgress || bankSyncStage === 'syncing_success' ? 'animate-spin' : ''}`} />
          </div>
          <h1 className="mt-5 text-2xl font-black text-app-primary">
            {t('app:status.syncTitle')}
          </h1>
          <div className="mt-3 text-sm text-app-secondary space-y-3">
            {appErrorMessage ? (
              <>
                <p className="font-medium text-red-600 dark:text-red-200">{appErrorMessage}</p>
                <p>
                  {isBankSyncInProgress || bankSyncStage === 'syncing_success'
                    ? t('app:status.syncInProgress')
                    : t('app:status.preparingSync')}
                </p>
              </>
            ) : (
              <p>
                {isBankSyncInProgress || bankSyncStage === 'syncing_success'
                  ? t('app:status.syncInProgress')
                  : t('app:status.preparingSync')}
              </p>
            )}
          </div>
          {appErrorMessage ? (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => {
                  successSyncRequestedRef.current = false;
                  void syncAfterSuccessRedirect();
                }}
              >
                {t('app:status.retrySync')}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    );
  })();

  return (
    <div className="min-h-screen bg-app-base font-sans flex text-app-primary transition-colors duration-200">
      <Sidebar activeTab={activeTab} setActiveTab={handleNavigate} onLogout={logout} userProfile={userProfile} />
      <main className="flex-1 md:ml-64 min-w-0 relative bg-app-base transition-colors duration-200">
        {!isSubpage && <TopBar title={pageTitle} />}
        {appErrorMessage && (
          <div className="px-4 md:px-6 pt-4 max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between gap-4 text-sm">
              <span>{appErrorMessage}</span>
              <button onClick={clearError} className="font-bold text-xs uppercase tracking-wider">{t('app:status.dismiss')}</button>
            </div>
          </div>
        )}
        <div className={`${isSubpage ? 'p-0' : 'p-4 md:p-6'} max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300`}>
          <Suspense fallback={pageLoadingFallback}>
            {renderContent()}
          </Suspense>
        </div>

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-app-surface border-t border-app-border flex justify-around p-4 z-50 shadow-up transition-colors duration-200">
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`p-2 rounded-xl transition-colors ${item.isActive ? 'text-opex-teal' : 'text-app-tertiary'}`}
            >
              <item.icon size={24} />
            </button>
          ))}
        </div>
      </main>
      {successOverlay}
    </div>
  );
};
