import React, { useEffect, useRef } from 'react';
import {
  LayoutGrid,
  Settings,
  Wallet,
  Calculator,
  Loader2
} from 'lucide-react';

import { Sidebar, TopBar } from './views/components';
import { TaxesPage, InsightsDetail, BreakdownLayout, TransactionsPage, AddTransactionPage, AddInvoicePage, BankRedirectionPage, AccountSetupPage, InvoicingPage, DashboardPage, BudgetPage, EditProfilePage, RenewConsentPage, ChangePasswordPage, CategoriesPage, NotificationDetailsPage, SupportPage, RecurringPage, SettingsPage, OnboardingPage, PostBankConnectionGdprPage } from './views/pages';
import { LegalDocumentPage, resolveLegalDocumentSlug } from './views/legal';
import { DEFAULT_LEGAL_PUBLIC_INFO } from './legal/defaultLegalContent';



import { useAppController } from './controllers/useAppController';
import { useKeycloakAuth } from './services/keycloakAuth';

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
  const [postSaltEdgeGdprPending, setPostSaltEdgeGdprPending] = React.useState(false);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 max-w-md w-full text-center shadow-sm space-y-4">
          <h1 className="text-xl font-black text-gray-900">Autenticazione Keycloak</h1>
          {authErrorMessage ? (
            <>
              <p className="text-sm text-red-600">{authErrorMessage}</p>
              <button
                onClick={() => void login()}
                className="px-5 py-2.5 rounded-xl bg-opex-dark text-white text-sm font-bold"
              >
                Riprova login
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              {isAuthLoading
                ? 'Verifica sessione in corso...'
                : 'Reindirizzamento a Keycloak in corso...'}
            </p>
          )}
        </div>
      </div>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 max-w-md w-full text-center shadow-sm space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-opex-teal/10 text-opex-teal flex items-center justify-center">
            <Loader2 size={28} className="animate-spin" />
          </div>
          <h1 className="text-xl font-black text-gray-900">Synchronizing Bank Data</h1>
          <p className="text-sm text-gray-500">
            {isBankSyncInProgress || bankSyncStage === 'syncing_success'
              ? 'Sync in progress, please wait...'
              : 'Preparing synchronization...'}
          </p>
          {appErrorMessage && (
            <div className="space-y-3">
              <p className="text-sm text-red-600">{appErrorMessage}</p>
              <button
                onClick={() => {
                  successSyncRequestedRef.current = false;
                  void syncAfterSuccessRedirect();
                }}
                className="px-5 py-2.5 rounded-xl bg-opex-dark text-white text-sm font-bold"
              >
                Retry sync
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isInitialSyncLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 max-w-md w-full text-center shadow-sm space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-opex-teal/10 text-opex-teal flex items-center justify-center">
            <Loader2 size={28} className="animate-spin" />
          </div>
          <h1 className="text-xl font-black text-gray-900">Preparing your workspace</h1>
          <p className="text-sm text-gray-500">We are syncing your profile and loading the latest data.</p>
        </div>
      </div>
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
        return (
          <SettingsPage
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            bankAccounts={bankAccounts}
            taxBufferProviders={taxBufferProviders}
            legalPublicInfo={activeLegalPublicInfo}
            onBankSelect={startBankFlow}
            onConnectionSelect={startConnectionSetup}
            onCreateOpenBankConnection={syncExternalBankAndNavigate}
            onRemoveOpenBankConnection={deleteExternalBankConnection}
            onUpdateBankAccount={updateBankAccountSettings}
            isConnectingOpenBank={isBankSyncInProgress}
            openBankErrorMessage={appErrorMessage}
            onDownloadDataExport={downloadDataExport}
            onDeleteAccount={async () => {
              await deleteAccount();
              logout();
            }}
            initialSection="PROFILE"
            onNavigate={(v) => {
              // If it's a global quick action, don't prefix with SETTINGS_
              if (v.startsWith('QUICK_') || v === 'ADD_BANK' || v === 'OPEN_BANKING' || v === 'SETTINGS_OPEN_BANKING') {
                handleNavigate(v);
              } else {
                handleNavigate('SETTINGS_' + v);
              }
            }}
          />
        );
      
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
        return (
          <SettingsPage
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            bankAccounts={bankAccounts}
            taxBufferProviders={taxBufferProviders}
            legalPublicInfo={activeLegalPublicInfo}
            onBankSelect={startBankFlow}
            onConnectionSelect={startConnectionSetup}
            onCreateOpenBankConnection={syncExternalBankAndNavigate}
            onRemoveOpenBankConnection={deleteExternalBankConnection}
            onUpdateBankAccount={updateBankAccountSettings}
            isConnectingOpenBank={isBankSyncInProgress}
            openBankErrorMessage={appErrorMessage}
            onDownloadDataExport={downloadDataExport}
            onDeleteAccount={async () => {
              await deleteAccount();
              logout();
            }}
            initialSection="BANKING"
            onNavigate={(v) => {
              if (v.startsWith('QUICK_') || v === 'ADD_BANK' || v === 'OPEN_BANKING' || v === 'SETTINGS_OPEN_BANKING') {
                handleNavigate(v);
              } else {
                handleNavigate('SETTINGS_' + v);
              }
            }}
          />
        );
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
        return (
          <SettingsPage
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            bankAccounts={bankAccounts}
            taxBufferProviders={taxBufferProviders}
            legalPublicInfo={activeLegalPublicInfo}
            onBankSelect={startBankFlow}
            onConnectionSelect={startConnectionSetup}
            onCreateOpenBankConnection={syncExternalBankAndNavigate}
            onRemoveOpenBankConnection={deleteExternalBankConnection}
            onUpdateBankAccount={updateBankAccountSettings}
            isConnectingOpenBank={isBankSyncInProgress}
            openBankErrorMessage={appErrorMessage}
            onDownloadDataExport={downloadDataExport}
            onDeleteAccount={async () => {
              await deleteAccount();
              logout();
            }}
            initialSection="BANKING"
            onNavigate={(v) => {
              if (v.startsWith('QUICK_') || v === 'ADD_BANK' || v === 'OPEN_BANKING' || v === 'SETTINGS_OPEN_BANKING') {
                handleNavigate(v);
              } else {
                handleNavigate('SETTINGS_' + v);
              }
            }}
          />
        );

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

  const getPageTitle = () => {
    if (activeTab.startsWith('SETTINGS_')) return 'Settings';
    if (activeTab.startsWith('QUICK_')) return 'New Transaction';
    switch (activeTab) {
      case 'DASHBOARD': return 'Overview';
      case 'BUDGET': return 'Budget';
      case 'TAXES': return 'Tax Buffer';
      case 'INVOICING': return 'Revenue';
      case 'INCOME': return 'Income Breakdown';
      case 'EXPENSES': return 'Expense Breakdown';
      case 'TRANSACTIONS_IN': return 'Income Transactions';
      case 'TRANSACTIONS_OUT': return 'Expense Transactions';
      case 'INSIGHTS': return 'Financial Insights';
      case '[]': return 'All Activity';
      case 'SETTINGS': return 'Settings';
      default: return 'Opex';
    }
  };

  const isSubpage = ['INCOME', 'EXPENSES', 'TRANSACTIONS_IN', 'TRANSACTIONS_OUT', 'INSIGHTS', '[]', 'QUICK_INCOME', 'QUICK_EXPENSE', 'QUICK_INVOICE', 'SETTINGS_BANK_SETUP'].includes(activeTab)
    || (activeTab.startsWith('SETTINGS_') && !['SETTINGS_OPEN_BANKING', 'SETTINGS_ADD_BANK'].includes(activeTab));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans flex text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Sidebar activeTab={activeTab} setActiveTab={handleNavigate} onLogout={logout} userProfile={userProfile} />
      <main className="flex-1 md:ml-64 min-w-0 relative dark:bg-slate-900">
         {!isSubpage && <TopBar title={getPageTitle()} />}
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
            <button onClick={() => handleNavigate('DASHBOARD')} className={`p-2 rounded-xl transition-colors ${activeTab === 'DASHBOARD' || ['INCOME', 'EXPENSES', '[]'].includes(activeTab) ? 'text-opex-teal' : 'text-gray-400'}`}>
               <LayoutGrid size={24} />
            </button>
            <button onClick={() => handleNavigate('BUDGET')} className={`p-2 rounded-xl transition-colors ${activeTab === 'BUDGET' || ['INSIGHTS'].includes(activeTab) ? 'text-opex-teal' : 'text-gray-400'}`}>
               <Wallet size={24} />
            </button>
            <button onClick={() => handleNavigate('TAXES')} className={`p-2 rounded-xl transition-colors ${activeTab === 'TAXES' ? 'text-opex-teal' : 'text-gray-400'}`}>
               <Calculator size={24} />
            </button>
            <button onClick={() => handleNavigate('SETTINGS')} className={`p-2 rounded-xl transition-colors ${activeTab === 'SETTINGS' || activeTab.startsWith('SETTINGS_') ? 'text-opex-teal' : 'text-gray-400'}`}>
               <Settings size={24} />
            </button>
         </div>
      </main>
    </div>
  );
};
