import { Dispatch, SetStateAction, useCallback, useState } from 'react';

import {
  BankAccountRecord,
  BankOption,
  LegalPublicInfoRecord,
  ManualBankSetupInput,
  OpenBankingConsentPayload,
  UserProfile
} from '../../shared/types';
import {
  persistOpenBankingConsentLocally,
  syncStoredLegalConsents
} from '../../services/api/legalFallbacks';
import { extractBankPopupUrl, opexApi } from '../../services/api/opexApi';
import {
  BANK_SYNC_COMPLETED_EVENT_KEY,
  BankSyncStage,
  DEFAULT_USER_PROFILE,
  normalizeText,
  resolveAccountProviderName,
  resolveBankAccountId,
  toConnectionIcon,
  toErrorMessage
} from './controllerSupport';
import { BankAccountSettingsPayload, DashboardRefreshResult } from './types';

const CONSENT_REQUIRED_ERROR = 'You must accept the current privacy notice and terms before connecting a bank.';

type UseBankingFlowArgs = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  bankAccounts: BankAccountRecord[];
  legalPublicInfo: LegalPublicInfoRecord | null;
  providerByConnectionId: Map<string, string>;
  refreshDashboardData: () => Promise<DashboardRefreshResult>;
  setErrorMessage: (message: string | null) => void;
  setUserProfile: Dispatch<SetStateAction<UserProfile>>;
};

export const useBankingFlow = ({
  activeTab,
  setActiveTab,
  bankAccounts,
  legalPublicInfo,
  providerByConnectionId,
  refreshDashboardData,
  setErrorMessage,
  setUserProfile
}: UseBankingFlowArgs) => {
  const [selectedBank, setSelectedBank] = useState<BankOption | null>(null);
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccountRecord | null>(null);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string | null>(null);
  const [connectionSetupAccounts, setConnectionSetupAccounts] = useState<BankAccountRecord[]>([]);
  const [isBankSyncInProgress, setIsBankSyncInProgress] = useState(false);
  const [bankSyncStage, setBankSyncStage] = useState<BankSyncStage>('idle');
  const [bankPopupUrl, setBankPopupUrl] = useState<string | null>(null);
  const [isManualBankSaving, setIsManualBankSaving] = useState(false);

  const resetSelection = useCallback(() => {
    setSelectedBank(null);
    setSelectedBankAccount(null);
    setSelectedBankAccountId(null);
    setConnectionSetupAccounts([]);
  }, []);

  const startBankFlow = useCallback((bank: BankOption) => {
    setSelectedBank(bank);
    setSelectedBankAccount(null);
    setSelectedBankAccountId(null);
    setConnectionSetupAccounts([]);
    setBankPopupUrl(null);
    setBankSyncStage('idle');

    if (bank.isManual) {
      setActiveTab('SETTINGS_BANK_SETUP');
      return;
    }

    setActiveTab('SETTINGS_BANK_REDIRECT');
  }, [setActiveTab]);

  const selectConnectionAccountForSetup = useCallback((account: BankAccountRecord): boolean => {
    const bankAccountId = resolveBankAccountId(account);
    if (!bankAccountId) {
      setErrorMessage('Unable to edit this connection because accountId is missing.');
      return false;
    }

    setErrorMessage(null);
    setSelectedBankAccount(account);
    setSelectedBankAccountId(bankAccountId);
    return true;
  }, [setErrorMessage]);

  const startConnectionSetup = useCallback((account: BankAccountRecord, providerName?: string) => {
    const normalizedConnectionId = normalizeText(account.connectionId);
    const relatedAccounts = normalizedConnectionId.length > 0
      ? bankAccounts.filter((item) => normalizeText(item.connectionId) === normalizedConnectionId)
      : [account];
    const initialAccount = relatedAccounts[0] ?? account;

    if (!selectConnectionAccountForSetup(initialAccount)) {
      return;
    }

    const resolvedProviderName =
      normalizeText(providerName) ||
      resolveAccountProviderName(account, providerByConnectionId) ||
      'Connection';

    setSelectedBank({
      name: resolvedProviderName,
      color: 'bg-opex-dark',
      icon: toConnectionIcon(resolvedProviderName)
    });
    setConnectionSetupAccounts(relatedAccounts.length > 0 ? relatedAccounts : [account]);
    setBankPopupUrl(null);
    setBankSyncStage('idle');
    setActiveTab('SETTINGS_BANK_SETUP');
  }, [bankAccounts, providerByConnectionId, selectConnectionAccountForSetup, setActiveTab]);

  const openBankPopup = useCallback((connectUrl: string, popupErrorMessage: string) => {
    setBankPopupUrl(connectUrl);
    const popup = window.open(connectUrl, '_blank', 'noopener,noreferrer');
    if (!popup) {
      throw new Error(popupErrorMessage);
    }

    popup.focus();
    setBankSyncStage('waiting_success_redirect');
  }, []);

  const syncExternalBankAndNavigate = useCallback(async (consent: OpenBankingConsentPayload) => {
    setIsBankSyncInProgress(true);
    setErrorMessage(null);
    setBankSyncStage('opening_widget');
    setBankPopupUrl(null);

    try {
      if (legalPublicInfo) {
        setUserProfile((current) => persistOpenBankingConsentLocally(current, legalPublicInfo, consent));
      }

      const connectPayload = await opexApi.bankIntegrationConnect(consent);
      const connectUrl = extractBankPopupUrl(connectPayload);

      if (!connectUrl) {
        throw new Error('Bank integration connect did not return a valid Salt Edge URL.');
      }

      openBankPopup(connectUrl, 'Unable to open bank connection page. Please allow popups and retry.');
    } catch (error) {
      const errorMessage = toErrorMessage(error);

      if (errorMessage === CONSENT_REQUIRED_ERROR && legalPublicInfo) {
        try {
          const refreshedProfile = await opexApi.syncUser(DEFAULT_USER_PROFILE);
          setUserProfile((current) =>
            syncStoredLegalConsents(
              {
                ...current,
                ...refreshedProfile,
                logo: refreshedProfile.logo ?? current.logo
              },
              legalPublicInfo
            )
          );
        } catch {
          // Keep the original error if the reconciliation request fails.
        }
      }

      setErrorMessage(errorMessage);
      setBankSyncStage('idle');
      throw error;
    } finally {
      setIsBankSyncInProgress(false);
    }
  }, [legalPublicInfo, openBankPopup, setErrorMessage, setUserProfile]);

  const refreshExternalBankConnection = useCallback(async (connectionId: string) => {
    const normalizedConnectionId = normalizeText(connectionId);
    if (normalizedConnectionId.length === 0) {
      throw new Error('Missing Salt Edge connection identifier.');
    }

    setIsBankSyncInProgress(true);
    setErrorMessage(null);
    setBankSyncStage('opening_widget');
    setBankPopupUrl(null);

    try {
      const connectPayload = await opexApi.bankIntegrationRefreshConnection(normalizedConnectionId);
      const connectUrl = extractBankPopupUrl(connectPayload);

      if (!connectUrl) {
        throw new Error('Connection refresh did not return a valid Salt Edge URL.');
      }

      openBankPopup(connectUrl, 'Unable to open Salt Edge refresh page. Please allow popups and retry.');
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      setBankSyncStage('idle');
      throw error;
    } finally {
      setIsBankSyncInProgress(false);
    }
  }, [openBankPopup, setErrorMessage]);

  const deleteExternalBankConnection = useCallback(async (connectionId: string) => {
    const normalizedConnectionId = normalizeText(connectionId);
    if (normalizedConnectionId.length === 0) {
      throw new Error('Missing Salt Edge connection identifier.');
    }

    setErrorMessage(null);

    try {
      await opexApi.bankIntegrationDeleteConnection(normalizedConnectionId);

      if (normalizeText(selectedBankAccount?.connectionId) === normalizedConnectionId) {
        resetSelection();
        if (activeTab === 'SETTINGS_BANK_SETUP') {
          setActiveTab('SETTINGS_OPEN_BANKING');
        }
      }

      await refreshDashboardData();
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    }
  }, [activeTab, refreshDashboardData, resetSelection, selectedBankAccount?.connectionId, setActiveTab, setErrorMessage]);

  const syncAfterSuccessRedirect = useCallback(async () => {
    setIsBankSyncInProgress(true);
    setBankSyncStage('syncing_success');
    setErrorMessage(null);

    const existingAccountIds = new Set(
      bankAccounts
        .map((account) => resolveBankAccountId(account))
        .filter((accountId): accountId is string => Boolean(accountId))
    );

    try {
      await opexApi.bankIntegrationSync();
      const refreshedData = await refreshDashboardData();
      window.localStorage.setItem(BANK_SYNC_COMPLETED_EVENT_KEY, String(Date.now()));
      if (window.location.pathname === '/success') {
        window.history.replaceState({}, document.title, '/');
      }

      const refreshedAccounts = refreshedData.accountsResult.content;
      const newSaltedgeAccounts = refreshedAccounts.filter((account) => {
        if (!account.isSaltedge) {
          return false;
        }

        const accountId = resolveBankAccountId(account);
        return Boolean(accountId) && !existingAccountIds.has(accountId);
      });

      const firstNewAccount = newSaltedgeAccounts[0];
      if (!firstNewAccount) {
        resetSelection();
        setActiveTab('DASHBOARD');
        setBankPopupUrl(null);
        setBankSyncStage('idle');
        return;
      }

      const newConnectionId = normalizeText(firstNewAccount.connectionId);
      const accountsForNewConnection = newConnectionId.length > 0
        ? refreshedAccounts.filter((account) => normalizeText(account.connectionId) === newConnectionId)
        : [firstNewAccount];
      const providerFromTaxProviders = newConnectionId.length > 0
        ? refreshedData.taxProvidersResult.find(
            (provider) => normalizeText(provider.connectionId) === newConnectionId
          )?.providerName
        : null;
      const providerName =
        normalizeText(providerFromTaxProviders) ||
        normalizeText(firstNewAccount.institutionName) ||
        'Connection';
      const initialAccount = accountsForNewConnection[0] ?? firstNewAccount;

      setSelectedBank({
        name: providerName,
        color: 'bg-opex-dark',
        icon: toConnectionIcon(providerName)
      });
      setConnectionSetupAccounts(accountsForNewConnection);
      if (!selectConnectionAccountForSetup(initialAccount)) {
        setActiveTab('DASHBOARD');
        return;
      }

      setActiveTab('SETTINGS_BANK_SETUP');
      setBankPopupUrl(null);
      setBankSyncStage('idle');
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    } finally {
      setIsBankSyncInProgress(false);
    }
  }, [
    bankAccounts,
    refreshDashboardData,
    resetSelection,
    selectConnectionAccountForSetup,
    setActiveTab,
    setErrorMessage
  ]);

  const completeManualBankSetup = useCallback(async (payload: ManualBankSetupInput) => {
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
  }, [refreshDashboardData, setActiveTab, setErrorMessage]);

  const completeConnectionSetup = useCallback(async (
    bankAccountId: string,
    payload: ManualBankSetupInput
  ) => {
    setIsManualBankSaving(true);
    setErrorMessage(null);

    try {
      if (selectedBankAccount?.isSaltedge) {
        await opexApi.updateSaltedgeBankAccount(bankAccountId, {
          institutionName: payload.institutionName,
          nature: payload.nature,
          isForTax: payload.isForTax
        });
      } else {
        await opexApi.updateLocalBankAccount(bankAccountId, {
          institutionName: payload.institutionName,
          nature: payload.nature,
          isForTax: payload.isForTax
        });
      }
      await refreshDashboardData();
      setActiveTab('SETTINGS_OPEN_BANKING');
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    } finally {
      setIsManualBankSaving(false);
    }
  }, [refreshDashboardData, selectedBankAccount?.isSaltedge, setActiveTab, setErrorMessage]);

  const updateBankAccountSettings = useCallback(async (
    bankAccountId: string,
    isSaltedge: boolean,
    payload: BankAccountSettingsPayload
  ) => {
    setErrorMessage(null);

    try {
      if (isSaltedge) {
        await opexApi.updateSaltedgeBankAccount(bankAccountId, payload);
      } else {
        await opexApi.updateLocalBankAccount(bankAccountId, payload);
      }
      await refreshDashboardData();
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    }
  }, [refreshDashboardData, setErrorMessage]);

  return {
    selectedBank,
    setSelectedBank,
    selectedBankAccount,
    setSelectedBankAccount,
    selectedBankAccountId,
    connectionSetupAccounts,
    isBankSyncInProgress,
    bankSyncStage,
    bankPopupUrl,
    isManualBankSaving,
    startBankFlow,
    startConnectionSetup,
    selectConnectionAccountForSetup,
    syncExternalBankAndNavigate,
    refreshExternalBankConnection,
    deleteExternalBankConnection,
    syncAfterSuccessRedirect,
    completeManualBankSetup,
    completeConnectionSetup,
    updateBankAccountSettings
  };
};
