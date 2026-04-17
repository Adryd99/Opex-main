import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  BankAccountRecord,
  ForecastResponse,
  LegalPublicInfoRecord,
  TaxRecord,
  TaxBufferDashboardResponse,
  TaxBufferProviderItem,
  TimeAggregatedRecord,
  TransactionRecord,
  UserProfile
} from '../../shared/types';
import {
  DEFAULT_LEGAL_PUBLIC_INFO,
  syncStoredLegalConsents
} from '../../services/api/legalFallbacks';
import { opexApi } from '../../services/api/opexApi';
import {
  BANK_PROVIDERS_KEY,
  BANK_PROVIDERS_UPDATED_EVENT,
  BANK_SYNC_COMPLETED_EVENT_KEY,
  buildPeriodKey,
  buildProviderMap,
  DEFAULT_USER_PROFILE,
  formatPeriodLabel,
  getSelectedProviderFromStorage,
  normalizeText,
  PROVIDER_SELECTION_UPDATED_EVENT,
  resolveAccountProviderName,
  resolveBankAccountId,
  resolveSelectedConnectionId,
  SELECTED_PROVIDER_KEY,
  toErrorMessage
} from './controllerSupport';
import { DashboardRefreshResult } from './types';

type UseAppDataArgs = {
  isAuthenticated: boolean;
  setErrorMessage: (message: string | null) => void;
};

export const useAppData = ({ isAuthenticated, setErrorMessage }: UseAppDataArgs) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [taxes, setTaxes] = useState<TaxRecord[]>([]);
  const [selectedProviderName, setSelectedProviderName] = useState<string | null>(
    typeof window === 'undefined' ? null : getSelectedProviderFromStorage()
  );
  const [taxBufferProviders, setTaxBufferProviders] = useState<TaxBufferProviderItem[]>([]);
  const [taxBufferDashboard, setTaxBufferDashboard] = useState<TaxBufferDashboardResponse | null>(null);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [legalPublicInfo, setLegalPublicInfo] = useState<LegalPublicInfoRecord | null>(null);
  const [isTaxBufferLoading, setIsTaxBufferLoading] = useState(false);
  const [isInitialSyncLoading, setIsInitialSyncLoading] = useState(true);
  const [isDataRefreshing, setIsDataRefreshing] = useState(false);

  const refreshDashboardData = useCallback(async (): Promise<DashboardRefreshResult> => {
    setIsDataRefreshing(true);
    setIsTaxBufferLoading(true);
    setErrorMessage(null);

    try {
      const [accountsResult, transactionsResult, taxesResult, forecastResult, taxProvidersResult] =
        await Promise.all([
          opexApi.getMyBankAccounts(0, 50),
          opexApi.getAllMyTransactions(),
          opexApi.getMyTaxes(0, 50),
          opexApi.getForecast(3),
          opexApi.getTaxBufferProviders()
        ]);

      const activeProviderName = typeof window === 'undefined' ? null : getSelectedProviderFromStorage();
      const dashboardConnectionId = resolveSelectedConnectionId(
        activeProviderName,
        accountsResult.content,
        taxProvidersResult
      );
      const taxDashboardResult = await opexApi.getTaxBufferDashboard({
        connectionId: dashboardConnectionId,
        deadlinesLimit: 20,
        activityLimit: 8
      });

      setBankAccounts(accountsResult.content);
      setTransactions(transactionsResult);
      setTaxes(taxesResult.content);
      setTaxBufferProviders(taxProvidersResult);
      setTaxBufferDashboard(taxDashboardResult);
      setForecastData(forecastResult);

      return {
        accountsResult,
        transactionsResult,
        taxesResult,
        forecastResult,
        taxProvidersResult,
        taxDashboardResult
      };
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    } finally {
      setIsDataRefreshing(false);
      setIsTaxBufferLoading(false);
    }
  }, [setErrorMessage]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLegalPublicInfo(DEFAULT_LEGAL_PUBLIC_INFO);
      setIsInitialSyncLoading(false);
      return;
    }

    const bootstrap = async () => {
      setIsInitialSyncLoading(true);
      try {
        const [syncedProfile, nextLegalPublicInfo] = await Promise.all([
          opexApi.syncUser(DEFAULT_USER_PROFILE),
          opexApi.getLegalPublicInfo()
        ]);
        setLegalPublicInfo(nextLegalPublicInfo);
        setUserProfile((current) =>
          syncStoredLegalConsents(
            {
              ...current,
              ...syncedProfile,
              logo: syncedProfile.logo ?? current.logo
            },
            nextLegalPublicInfo
          )
        );
        await refreshDashboardData();
      } catch (error) {
        setErrorMessage(toErrorMessage(error));
        setLegalPublicInfo(DEFAULT_LEGAL_PUBLIC_INFO);
      } finally {
        setIsInitialSyncLoading(false);
      }
    };

    void bootstrap();
  }, [isAuthenticated, refreshDashboardData, setErrorMessage]);

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
    const providerByConnectionId = buildProviderMap(taxBufferProviders);
    const providerNames = Array.from(
      new Set([
        ...taxBufferProviders
          .map((provider) => normalizeText(provider.providerName))
          .filter((name) => name.length > 0),
        ...bankAccounts
          .map((account) => resolveAccountProviderName(account, providerByConnectionId))
          .filter((name) => name.length > 0)
      ])
    );

    window.localStorage.setItem(BANK_PROVIDERS_KEY, JSON.stringify(providerNames));
    window.dispatchEvent(new Event(BANK_PROVIDERS_UPDATED_EVENT));
  }, [bankAccounts, taxBufferProviders]);

  const providerByConnectionId = useMemo(() => buildProviderMap(taxBufferProviders), [taxBufferProviders]);

  const doesAccountMatchSelectedProvider = useCallback(
    (account: (typeof bankAccounts)[number], providerName: string) =>
      resolveAccountProviderName(account, providerByConnectionId) === providerName,
    [providerByConnectionId]
  );

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
      .getTaxBufferDashboard({
        connectionId,
        deadlinesLimit: 20,
        activityLimit: 8
      })
      .then((dashboard) => {
        setTaxBufferDashboard(dashboard);
      })
      .catch((error) => {
        setErrorMessage(toErrorMessage(error));
      })
      .finally(() => {
        setIsTaxBufferLoading(false);
      });
  }, [bankAccounts, isAuthenticated, selectedProviderName, setErrorMessage, taxBufferProviders]);

  const allowedConnectionIdsForSelectedProvider = useMemo(() => {
    if (!selectedProviderName) {
      return null;
    }

    return new Set(
      bankAccounts
        .filter((account) => doesAccountMatchSelectedProvider(account, selectedProviderName))
        .map((account) => account.connectionId ?? '')
        .filter((connectionId) => connectionId.length > 0)
    );
  }, [bankAccounts, doesAccountMatchSelectedProvider, selectedProviderName]);

  const visibleTransactions = useMemo(() => {
    if (!selectedProviderName) {
      return transactions;
    }

    const accountsById = new Map(
      bankAccounts.flatMap((account) => {
        const resolvedId = resolveBankAccountId(account);
        if (!resolvedId) {
          return [];
        }
        return [[resolvedId, account] as const];
      })
    );
    const allowedConnections = allowedConnectionIdsForSelectedProvider ?? new Set<string>();

    return transactions.filter((transaction) => {
      const txConnectionId = (transaction.connectionId ?? '').trim();
      if (txConnectionId.length > 0) {
        return allowedConnections.has(txConnectionId);
      }

      const relatedAccount = transaction.bankAccountId
        ? accountsById.get(transaction.bankAccountId)
        : undefined;
      if (!relatedAccount) {
        return false;
      }

      return doesAccountMatchSelectedProvider(relatedAccount, selectedProviderName);
    });
  }, [
    allowedConnectionIdsForSelectedProvider,
    bankAccounts,
    doesAccountMatchSelectedProvider,
    selectedProviderName,
    transactions
  ]);

  const aggregatedSummary = useMemo(() => {
    const visibleBankAccounts = selectedProviderName
      ? bankAccounts.filter((account) => doesAccountMatchSelectedProvider(account, selectedProviderName))
      : bankAccounts;

    return {
      totalBalance: visibleBankAccounts.reduce((sum, account) => sum + Number(account.balance || 0), 0),
      totalIncome: visibleTransactions.reduce((sum, transaction) => {
        const amount = Number(transaction.amount || 0);
        return amount > 0 ? sum + amount : sum;
      }, 0),
      totalExpenses: visibleTransactions.reduce((sum, transaction) => {
        const amount = Number(transaction.amount || 0);
        return amount < 0 ? sum + amount : sum;
      }, 0)
    };
  }, [bankAccounts, doesAccountMatchSelectedProvider, selectedProviderName, visibleTransactions]);

  const timeAggregatedSummary = useMemo<TimeAggregatedRecord>(() => {
    const aggregateByPeriod = (period: 'month' | 'quarter' | 'year') => {
      const grouped = new Map<string, TimeAggregatedRecord['byMonth'][number]>();

      visibleTransactions.forEach((transaction) => {
        const date = new Date(transaction.bookingDate);
        if (Number.isNaN(date.getTime())) {
          return;
        }

        const amount = Number(transaction.amount || 0);
        const key = buildPeriodKey(date, period);
        const existing = grouped.get(key);
        if (existing) {
          if (amount > 0) {
            existing.income += amount;
          } else if (amount < 0) {
            existing.expenses += amount;
          }
          return;
        }

        grouped.set(key, {
          key,
          label: formatPeriodLabel(date, period),
          income: amount > 0 ? amount : 0,
          expenses: amount < 0 ? amount : 0,
          connectionId: null
        });
      });

      return Array.from(grouped.entries())
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([, value]) => value);
    };

    return {
      byMonth: aggregateByPeriod('month'),
      byQuarter: aggregateByPeriod('quarter'),
      byYear: aggregateByPeriod('year')
    };
  }, [visibleTransactions]);

  return {
    userProfile,
    setUserProfile,
    bankAccounts,
    allTransactions: transactions,
    transactions: visibleTransactions,
    taxes,
    selectedProviderName,
    taxBufferProviders,
    taxBufferDashboard,
    forecastData,
    legalPublicInfo,
    isTaxBufferLoading,
    isInitialSyncLoading,
    isDataRefreshing,
    providerByConnectionId,
    refreshDashboardData,
    aggregatedSummary,
    timeAggregatedSummary
  };
};
