import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AggregatedBalanceRecord,
  BankAccountRecord,
  BankOption,
  CreateLocalTransactionInput,
  ManualBankSetupInput,
  TaxRecord,
  TaxBufferDashboardResponse,
  TaxBufferProviderItem,
  TimeAggregatedRecord,
  TransactionRecord,
  UserProfile
} from '../models/types';
import { extractBankPopupUrl, opexApi, toUserProfilePatchPayload } from '../services/opexApi';

const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Post Malone',
  email: 'malone@opex.com',
  residence: 'Italy (IT)',
  logo: null
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unexpected error while processing the request.';
type BankSyncStage = 'idle' | 'opening_widget' | 'waiting_success_redirect' | 'syncing_success';
const BANK_SYNC_COMPLETED_EVENT_KEY = 'opex_bank_sync_completed_at';
const BANK_PROVIDERS_KEY = 'opex_bank_providers';
const BANK_PROVIDERS_UPDATED_EVENT = 'opex:bank-providers-updated';
const SELECTED_PROVIDER_KEY = 'opex_selected_provider_name';
const PROVIDER_SELECTION_UPDATED_EVENT = 'opex:provider-selection-updated';

const getSelectedProviderFromStorage = (): string | null => {
  const value = window.localStorage.getItem(SELECTED_PROVIDER_KEY);
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const resolveSelectedConnectionId = (
  providerName: string | null,
  accounts: BankAccountRecord[],
  providers: TaxBufferProviderItem[]
): string | undefined => {
  if (!providerName) {
    return undefined;
  }

  const accountConnectionId = accounts
    .find((account) => (account.institutionName ?? '').trim() === providerName && (account.connectionId ?? '').trim().length > 0)
    ?.connectionId;

  if (accountConnectionId && accountConnectionId.trim().length > 0) {
    return accountConnectionId;
  }

  const providerConnectionId = providers
    .find((provider) => (provider.providerName ?? '').trim() === providerName && (provider.connectionId ?? '').trim().length > 0)
    ?.connectionId;

  return providerConnectionId && providerConnectionId.trim().length > 0 ? providerConnectionId : undefined;
};

export const useAppController = (isAuthenticated: boolean) => {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [lastMainTab, setLastMainTab] = useState('DASHBOARD');
  const [selectedBank, setSelectedBank] = useState<BankOption | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [taxes, setTaxes] = useState<TaxRecord[]>([]);
  const [aggregatedBalances, setAggregatedBalances] = useState<AggregatedBalanceRecord[]>([]);
  const [timeAggregatedBalances, setTimeAggregatedBalances] = useState<TimeAggregatedRecord>({
    byMonth: [],
    byQuarter: [],
    byYear: []
  });
  const [selectedProviderName, setSelectedProviderName] = useState<string | null>(
    typeof window === 'undefined' ? null : getSelectedProviderFromStorage()
  );
  const [taxBufferProviders, setTaxBufferProviders] = useState<TaxBufferProviderItem[]>([]);
  const [taxBufferDashboard, setTaxBufferDashboard] = useState<TaxBufferDashboardResponse | null>(null);
  const [isTaxBufferLoading, setIsTaxBufferLoading] = useState(false);

  const [isInitialSyncLoading, setIsInitialSyncLoading] = useState(true);
  const [isDataRefreshing, setIsDataRefreshing] = useState(false);
  const [isBankSyncInProgress, setIsBankSyncInProgress] = useState(false);
  const [bankSyncStage, setBankSyncStage] = useState<BankSyncStage>('idle');
  const [bankPopupUrl, setBankPopupUrl] = useState<string | null>(null);
  const [isManualBankSaving, setIsManualBankSaving] = useState(false);
  const [isTransactionSaving, setIsTransactionSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshDashboardData = useCallback(async () => {
    setIsDataRefreshing(true);
    setIsTaxBufferLoading(true);
    setErrorMessage(null);

    try {
      const [accountsResult, transactionsResult, taxesResult] = await Promise.all([
        opexApi.getMyBankAccounts(0, 50),
        opexApi.getMyTransactions(0, 100),
        opexApi.getMyTaxes(0, 50)
      ]);
      const [aggregatedResult, timeAggregatedResult] = await Promise.all([
        opexApi.getAggregatedBalances(),
        opexApi.getTimeAggregatedBalances()
      ]);
      const activeProviderName = typeof window === 'undefined' ? null : getSelectedProviderFromStorage();
      const taxProvidersResult = await opexApi.getTaxBufferProviders();
      const dashboardConnectionId = resolveSelectedConnectionId(
        activeProviderName,
        accountsResult.content,
        taxProvidersResult
      );
      const taxDashboardResult = await opexApi.getTaxBufferDashboard({ connectionId: dashboardConnectionId });

      setBankAccounts(accountsResult.content);
      setTransactions(transactionsResult.content);
      setTaxes(taxesResult.content);
      setAggregatedBalances(aggregatedResult);
      setTimeAggregatedBalances(timeAggregatedResult);
      setTaxBufferProviders(taxProvidersResult);
      setTaxBufferDashboard(taxDashboardResult);
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    } finally {
      setIsDataRefreshing(false);
      setIsTaxBufferLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsInitialSyncLoading(false);
      return;
    }

    const bootstrap = async () => {
      setIsInitialSyncLoading(true);
      try {
        await opexApi.syncUser();
        await refreshDashboardData();
      } catch (error) {
        setErrorMessage(toErrorMessage(error));
      } finally {
        setIsInitialSyncLoading(false);
      }
    };

    void bootstrap();
  }, [isAuthenticated, refreshDashboardData]);

  useEffect(() => {
    const updateSelectedProvider = () => {
      setSelectedProviderName(getSelectedProviderFromStorage());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SELECTED_PROVIDER_KEY) {
        updateSelectedProvider();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(PROVIDER_SELECTION_UPDATED_EVENT, updateSelectedProvider);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(PROVIDER_SELECTION_UPDATED_EVENT, updateSelectedProvider);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== BANK_SYNC_COMPLETED_EVENT_KEY || !event.newValue) {
        return;
      }

      void refreshDashboardData().catch(() => undefined);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isAuthenticated, refreshDashboardData]);

  useEffect(() => {
    const providerNames = Array.from(
      new Set(
        bankAccounts
          .map((account) => (account.institutionName ?? '').trim())
          .filter((name) => name.length > 0)
      )
    );

    window.localStorage.setItem(BANK_PROVIDERS_KEY, JSON.stringify(providerNames));
    window.dispatchEvent(new Event(BANK_PROVIDERS_UPDATED_EVENT));
  }, [bankAccounts]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (bankAccounts.length === 0 && taxBufferProviders.length === 0) {
      return;
    }

    const connectionId = resolveSelectedConnectionId(selectedProviderName, bankAccounts, taxBufferProviders);
    setIsTaxBufferLoading(true);
    setErrorMessage(null);

    void opexApi
      .getTaxBufferDashboard({ connectionId })
      .then((dashboard) => {
        setTaxBufferDashboard(dashboard);
      })
      .catch((error) => {
        setErrorMessage(toErrorMessage(error));
      })
      .finally(() => {
        setIsTaxBufferLoading(false);
      });
  }, [bankAccounts, isAuthenticated, selectedProviderName, taxBufferProviders]);

  const aggregatedSummary = (() => {
    if (aggregatedBalances.length === 0) {
      return {
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0
      };
    }

    let allowedConnectionIds: Set<string> | null = null;
    if (selectedProviderName) {
      allowedConnectionIds = new Set(
        bankAccounts
          .filter((account) => (account.institutionName ?? '').trim() === selectedProviderName)
          .map((account) => account.connectionId ?? '')
          .filter((connectionId) => connectionId.length > 0)
      );
    }

    return aggregatedBalances.reduce(
      (accumulator, item) => {
        if (allowedConnectionIds && !allowedConnectionIds.has(item.connectionId)) {
          return accumulator;
        }

        accumulator.totalBalance += Number(item.totalBalance || 0);
        accumulator.totalIncome += Number(item.totalIncome || 0);
        accumulator.totalExpenses += Number(item.totalExpenses || 0);
        return accumulator;
      },
      {
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0
      }
    );
  })();

  const allowedConnectionIdsForSelectedProvider = useMemo(() => {
    if (!selectedProviderName) {
      return null;
    }

    return new Set(
      bankAccounts
        .filter((account) => (account.institutionName ?? '').trim() === selectedProviderName)
        .map((account) => account.connectionId ?? '')
        .filter((connectionId) => connectionId.length > 0)
    );
  }, [bankAccounts, selectedProviderName]);

  const visibleTransactions = useMemo(() => {
    if (!selectedProviderName) {
      return transactions;
    }

    const accountsById = new Map(bankAccounts.map((account) => [account.id, account]));
    const allowedConnections = allowedConnectionIdsForSelectedProvider ?? new Set<string>();

    return transactions.filter((transaction) => {
      const txConnectionId = (transaction.connectionId ?? '').trim();
      if (txConnectionId.length > 0) {
        return allowedConnections.has(txConnectionId);
      }

      const relatedAccount = transaction.bankAccountId ? accountsById.get(transaction.bankAccountId) : undefined;
      if (!relatedAccount) {
        return false;
      }

      return (relatedAccount.institutionName ?? '').trim() === selectedProviderName;
    });
  }, [allowedConnectionIdsForSelectedProvider, bankAccounts, selectedProviderName, transactions]);

  const timeAggregatedSummary = useMemo(() => {
    const aggregateByPeriod = (items: TimeAggregatedRecord['byMonth']) => {
      const grouped = new Map<string, TimeAggregatedRecord['byMonth'][number]>();

      items.forEach((item) => {
        const connectionId = (item.connectionId ?? '').trim();
        if (allowedConnectionIdsForSelectedProvider && connectionId.length > 0 && !allowedConnectionIdsForSelectedProvider.has(connectionId)) {
          return;
        }
        if (allowedConnectionIdsForSelectedProvider && connectionId.length === 0) {
          return;
        }

        const bucketKey = item.key || item.label;
        const existing = grouped.get(bucketKey);
        if (existing) {
          existing.income += Number(item.income || 0);
          existing.expenses += Number(item.expenses || 0);
          return;
        }

        grouped.set(bucketKey, {
          key: item.key,
          label: item.label,
          income: Number(item.income || 0),
          expenses: Number(item.expenses || 0),
          connectionId: null
        });
      });

      return Array.from(grouped.values());
    };

    return {
      byMonth: aggregateByPeriod(timeAggregatedBalances.byMonth),
      byQuarter: aggregateByPeriod(timeAggregatedBalances.byQuarter),
      byYear: aggregateByPeriod(timeAggregatedBalances.byYear)
    };
  }, [allowedConnectionIdsForSelectedProvider, timeAggregatedBalances]);

  const handleNavigate = (tab: string) => {
    if (['DASHBOARD', 'BUDGET', 'TAXES', 'SETTINGS'].includes(tab)) {
      setLastMainTab(tab);
    }
    setActiveTab(tab);
  };

  const startBankFlow = (bank: BankOption) => {
    setSelectedBank(bank);
    if (bank.isManual) {
      setBankPopupUrl(null);
      setBankSyncStage('idle');
      setActiveTab('SETTINGS_BANK_SETUP');
      return;
    }
    setBankPopupUrl(null);
    setBankSyncStage('idle');
    setActiveTab('SETTINGS_BANK_REDIRECT');
  };

  const syncExternalBankAndNavigate = useCallback(async () => {
    setIsBankSyncInProgress(true);
    setErrorMessage(null);
    setBankSyncStage('opening_widget');
    setBankPopupUrl(null);

    try {
      const connectPayload = await opexApi.bankIntegrationConnect();
      const connectUrl = extractBankPopupUrl(connectPayload);

      if (!connectUrl) {
        throw new Error('Bank integration connect did not return a valid Salt Edge URL.');
      }

      setBankPopupUrl(connectUrl);
      const popup = window.open(connectUrl, '_blank', 'noopener,noreferrer');
      if (!popup) {
        throw new Error('Unable to open bank connection page. Please allow popups and retry.');
      }

      popup.focus();
      setBankSyncStage('waiting_success_redirect');
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      setBankSyncStage('idle');
      throw error;
    } finally {
      setIsBankSyncInProgress(false);
    }
  }, []);

  const syncAfterSuccessRedirect = useCallback(async () => {
    setIsBankSyncInProgress(true);
    setBankSyncStage('syncing_success');
    setErrorMessage(null);

    try {
      await opexApi.bankIntegrationSync();
      await refreshDashboardData();
      window.localStorage.setItem(BANK_SYNC_COMPLETED_EVENT_KEY, String(Date.now()));
      if (window.location.pathname === '/success') {
        window.history.replaceState({}, document.title, '/');
      }
      setBankPopupUrl(null);
      setActiveTab('DASHBOARD');
      setBankSyncStage('idle');
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    } finally {
      setIsBankSyncInProgress(false);
    }
  }, [refreshDashboardData]);

  const completeManualBankSetup = useCallback(
    async (payload: ManualBankSetupInput) => {
      setIsManualBankSaving(true);
      setErrorMessage(null);

      try {
        await opexApi.createLocalBankAccount(payload);
        await refreshDashboardData();
        setActiveTab('DASHBOARD');
      } catch (error) {
        setErrorMessage(toErrorMessage(error));
        throw error;
      } finally {
        setIsManualBankSaving(false);
      }
    },
    [refreshDashboardData]
  );

  const createLocalTransaction = useCallback(
    async (input: CreateLocalTransactionInput) => {
      setIsTransactionSaving(true);
      setErrorMessage(null);

      try {
        const signedAmount = input.type === 'EXPENSE' ? -Math.abs(input.amount) : Math.abs(input.amount);
        await opexApi.createLocalTransaction({
          bankAccountId: input.bankAccountId,
          amount: signedAmount,
          bookingDate: new Date().toISOString().slice(0, 10),
          category: input.category,
          description: input.description,
          merchantName: input.description || input.category,
          status: 'COMPLETED',
          type: input.type === 'EXPENSE' ? 'DEBIT' : 'CREDIT'
        });
        await refreshDashboardData();
        setActiveTab('DASHBOARD');
      } catch (error) {
        setErrorMessage(toErrorMessage(error));
        throw error;
      } finally {
        setIsTransactionSaving(false);
      }
    },
    [refreshDashboardData]
  );

  const saveUserProfile = useCallback(async (profile: UserProfile) => {
    setErrorMessage(null);
    setUserProfile(profile);
    await opexApi.patchUserProfile(toUserProfilePatchPayload(profile));
  }, []);

  const clearError = () => setErrorMessage(null);

  return {
    activeTab,
    setActiveTab,
    lastMainTab,
    setLastMainTab,
    selectedBank,
    setSelectedBank,
    userProfile,
    setUserProfile,
    bankAccounts,
    transactions: visibleTransactions,
    taxes,
    selectedProviderName,
    aggregatedSummary,
    timeAggregatedSummary,
    taxBufferProviders,
    taxBufferDashboard,
    isTaxBufferLoading,
    isInitialSyncLoading,
    isDataRefreshing,
    isBankSyncInProgress,
    bankSyncStage,
    bankPopupUrl,
    isManualBankSaving,
    isTransactionSaving,
    errorMessage,
    clearError,
    handleNavigate,
    startBankFlow,
    refreshDashboardData,
    syncExternalBankAndNavigate,
    syncAfterSuccessRedirect,
    completeManualBankSetup,
    createLocalTransaction,
    saveUserProfile
  };
};
