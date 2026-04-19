import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppLanguage } from '../../i18n';
import { i18n as appI18n } from '../../i18n/config';
import { normalizeLanguage, isSupportedLanguage } from '../../i18n/constants';

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
} from '../../shared/legal';
import { opexApi } from '../../services/api/opexApi';
import {
  buildAggregatedSummary,
  buildAllowedConnectionIdsForSelectedProvider,
  buildTimeAggregatedSummary,
  buildVisibleTransactions,
  createProviderMatcher
} from './dashboardDerivations';
import { DEFAULT_USER_PROFILE } from './defaults';
import { toErrorMessage } from './errors';
import {
  BANK_SYNC_COMPLETED_EVENT_KEY,
  buildProviderMap,
  getSelectedProviderFromStorage,
  resolveSelectedConnectionId
} from './providerSupport';
import {
  useBankProviderRegistry,
  useSelectedProviderName
} from './providerSelection';
import { DashboardRefreshResult } from './types';

type UseAppDataArgs = {
  isAuthenticated: boolean;
  setErrorMessage: (message: string | null) => void;
};

export const useAppData = ({ isAuthenticated, setErrorMessage }: UseAppDataArgs) => {
  const { language } = useAppLanguage();
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [taxes, setTaxes] = useState<TaxRecord[]>([]);
  const selectedProviderName = useSelectedProviderName();
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

  const providerByConnectionId = useMemo(() => buildProviderMap(taxBufferProviders), [taxBufferProviders]);
  useBankProviderRegistry({
    bankAccounts,
    taxBufferProviders,
    providerByConnectionId
  });
  const doesAccountMatchSelectedProvider = useCallback(
    createProviderMatcher(providerByConnectionId),
    [providerByConnectionId]
  );

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
        const nextPreferredLanguage = syncedProfile.preferredLanguage;
        const currentLanguage = normalizeLanguage(appI18n.resolvedLanguage ?? appI18n.language);
        if (isSupportedLanguage(nextPreferredLanguage) && normalizeLanguage(nextPreferredLanguage) !== currentLanguage) {
          await appI18n.changeLanguage(normalizeLanguage(nextPreferredLanguage));
        }
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
    return buildAllowedConnectionIdsForSelectedProvider(
      bankAccounts,
      selectedProviderName,
      doesAccountMatchSelectedProvider
    );
  }, [bankAccounts, doesAccountMatchSelectedProvider, selectedProviderName]);

  const visibleTransactions = useMemo(() => {
    return buildVisibleTransactions(
      bankAccounts,
      transactions,
      selectedProviderName,
      allowedConnectionIdsForSelectedProvider,
      doesAccountMatchSelectedProvider
    );
  }, [
    allowedConnectionIdsForSelectedProvider,
    bankAccounts,
    doesAccountMatchSelectedProvider,
    selectedProviderName,
    transactions
  ]);

  const aggregatedSummary = useMemo(() => {
    return buildAggregatedSummary(
      bankAccounts,
      visibleTransactions,
      selectedProviderName,
      doesAccountMatchSelectedProvider
    );
  }, [bankAccounts, doesAccountMatchSelectedProvider, selectedProviderName, visibleTransactions]);

  const timeAggregatedSummary = useMemo<TimeAggregatedRecord>(
    () => buildTimeAggregatedSummary(visibleTransactions, language),
    [language, visibleTransactions]
  );

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
