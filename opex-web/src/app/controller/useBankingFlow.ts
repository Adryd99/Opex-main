import { Dispatch, SetStateAction, useCallback, useState } from 'react';

import {
  BankAccountRecord,
  BankConnectionRecord,
  LegalPublicInfoRecord,
  OpenBankingConsentPayload,
  UserProfile
} from '../../shared/types';
import {
  persistOpenBankingConsentLocally,
  syncStoredLegalConsents
} from '../../shared/legal';
import { extractBankPopupUrl, opexApi } from '../../services/api/opexApi';
import {
  BANK_SYNC_COMPLETED_EVENT_KEY,
  normalizeText,
  resolveBankAccountId
} from './providerSupport';
import { APP_TABS } from '../navigation';
import { BankSyncStage, DEFAULT_USER_PROFILE } from './defaults';
import { toErrorMessage } from './errors';
import { BankAccountSettingsPayload, DashboardRefreshResult } from './types';

const CONSENT_REQUIRED_ERROR = 'You must accept the current privacy notice and terms before connecting a bank.';

type UseBankingFlowArgs = {
  setActiveTab: (tab: string) => void;
  bankConnections: BankConnectionRecord[];
  bankAccounts: BankAccountRecord[];
  legalPublicInfo: LegalPublicInfoRecord | null;
  refreshDashboardData: () => Promise<DashboardRefreshResult>;
  setErrorMessage: (message: string | null) => void;
  setUserProfile: Dispatch<SetStateAction<UserProfile>>;
};

export type PostSyncImportedAccountsSummary = {
  providerName: string;
  importedAccountCount: number;
  connectionId: string | null;
};

export const useBankingFlow = ({
  setActiveTab,
  bankConnections,
  bankAccounts,
  legalPublicInfo,
  refreshDashboardData,
  setErrorMessage,
  setUserProfile
}: UseBankingFlowArgs) => {
  const [pendingConnectionReviewById, setPendingConnectionReviewById] = useState<Record<string, string[]>>({});
  const [isBankSyncInProgress, setIsBankSyncInProgress] = useState(false);
  const [bankSyncStage, setBankSyncStage] = useState<BankSyncStage>('idle');
  const [isManualBankSaving, setIsManualBankSaving] = useState(false);

  const markPendingConnectionAccountReviewed = useCallback((
    connectionId: string | null | undefined,
    reviewedAccountId: string,
    connectionAccountIds: string[]
  ) => {
    const normalizedConnectionId = normalizeText(connectionId);
    if (!normalizedConnectionId || !reviewedAccountId) {
      return;
    }

    setPendingConnectionReviewById((current) => {
      const existingPendingIds = current[normalizedConnectionId];
      if (!existingPendingIds) {
        return current;
      }

      const validConnectionAccountIds = connectionAccountIds.filter(Boolean);
      const nextPendingIds = existingPendingIds.filter(
        (accountId) => accountId !== reviewedAccountId && validConnectionAccountIds.includes(accountId)
      );

      if (nextPendingIds.length === 0) {
        const { [normalizedConnectionId]: _removed, ...rest } = current;
        return rest;
      }

      return {
        ...current,
        [normalizedConnectionId]: nextPendingIds
      };
    });
  }, []);

  const redirectToBankConnection = useCallback((connectUrl: string) => {
    setBankSyncStage('waiting_success_redirect');
    window.location.assign(connectUrl);
  }, []);

  const syncExternalBankAndNavigate = useCallback(async (consent: OpenBankingConsentPayload) => {
    setIsBankSyncInProgress(true);
    setErrorMessage(null);
    setBankSyncStage('opening_widget');

    try {
      if (legalPublicInfo) {
        setUserProfile((current) => persistOpenBankingConsentLocally(current, legalPublicInfo, consent));
      }

      const connectPayload = await opexApi.bankIntegrationConnect(consent);
      const connectUrl = extractBankPopupUrl(connectPayload);

      if (!connectUrl) {
        throw new Error('Bank integration connect did not return a valid Salt Edge URL.');
      }

      redirectToBankConnection(connectUrl);
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
      setIsBankSyncInProgress(false);
      throw error;
    }
  }, [legalPublicInfo, redirectToBankConnection, setErrorMessage, setUserProfile]);

  const refreshExternalBankConnection = useCallback(async (connectionId: string) => {
    const normalizedConnectionId = normalizeText(connectionId);
    if (normalizedConnectionId.length === 0) {
      throw new Error('Missing Salt Edge connection identifier.');
    }

    setIsBankSyncInProgress(true);
    setErrorMessage(null);
    setBankSyncStage('opening_widget');

    try {
      const connectPayload = await opexApi.bankIntegrationRefreshConnection(normalizedConnectionId);
      const connectUrl = extractBankPopupUrl(connectPayload);

      if (!connectUrl) {
        throw new Error('Connection refresh did not return a valid Salt Edge URL.');
      }

      redirectToBankConnection(connectUrl);
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      setBankSyncStage('idle');
      setIsBankSyncInProgress(false);
      throw error;
    }
  }, [redirectToBankConnection, setErrorMessage]);

  const deleteExternalBankConnection = useCallback(async (connectionId: string) => {
    const normalizedConnectionId = normalizeText(connectionId);
    if (normalizedConnectionId.length === 0) {
      throw new Error('Missing Salt Edge connection identifier.');
    }

    setErrorMessage(null);

    try {
      await opexApi.bankIntegrationDeleteConnection(normalizedConnectionId);
      setPendingConnectionReviewById((current) => {
        if (!current[normalizedConnectionId]) {
          return current;
        }

        const { [normalizedConnectionId]: _removed, ...rest } = current;
        return rest;
      });

      await refreshDashboardData();
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    }
  }, [refreshDashboardData, setErrorMessage]);

  const syncAfterSuccessRedirect = useCallback(async (): Promise<PostSyncImportedAccountsSummary | null> => {
    setIsBankSyncInProgress(true);
    setBankSyncStage('syncing_success');
    setErrorMessage(null);

    const existingConnectionIds = new Set(
      bankConnections
        .map((connection) => normalizeText(connection.id))
        .filter((connectionId): connectionId is string => Boolean(connectionId))
    );
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

      const firstNewConnection = refreshedData.connectionsResult.find((connection) =>
        connection.type === 'SALTEDGE'
        && !existingConnectionIds.has(normalizeText(connection.id))
        && connection.accounts.length > 0
      );

      if (firstNewConnection) {
        const accountIdsForNewConnection = firstNewConnection.accounts
          .map((account) => resolveBankAccountId(account))
          .filter((accountId): accountId is string => Boolean(accountId));

        if (accountIdsForNewConnection.length > 0) {
          setPendingConnectionReviewById((current) => ({
            ...current,
            [firstNewConnection.id]: accountIdsForNewConnection
        }));
        }

        setActiveTab(APP_TABS.SETTINGS_BANKING);
        setBankSyncStage('idle');
        return {
          providerName: normalizeText(firstNewConnection.providerName) || 'Connection',
          importedAccountCount: firstNewConnection.accounts.length,
          connectionId: firstNewConnection.id
        };
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
        setActiveTab(APP_TABS.SETTINGS_BANKING);
        setBankSyncStage('idle');
        return null;
      }

      const newConnectionId = normalizeText(firstNewAccount.connectionId);
      const accountsForNewConnection = newConnectionId.length > 0
        ? refreshedAccounts.filter((account) => normalizeText(account.connectionId) === newConnectionId)
        : [firstNewAccount];
      const accountIdsForNewConnection = accountsForNewConnection
        .map((account) => resolveBankAccountId(account))
        .filter((accountId): accountId is string => Boolean(accountId));
      const providerFromConnections = newConnectionId.length > 0
        ? refreshedData.connectionsResult.find(
            (connection) => normalizeText(connection.id) === newConnectionId
          )?.providerName
        : null;
      const providerName =
        normalizeText(providerFromConnections) ||
        normalizeText(firstNewAccount.institutionName) ||
        'Connection';
      if (newConnectionId.length > 0 && accountIdsForNewConnection.length > 0) {
        setPendingConnectionReviewById((current) => ({
          ...current,
          [newConnectionId]: accountIdsForNewConnection
        }));
      }
      setActiveTab(APP_TABS.SETTINGS_BANKING);
      setBankSyncStage('idle');
      return {
        providerName,
        importedAccountCount: accountsForNewConnection.length,
        connectionId: newConnectionId.length > 0 ? newConnectionId : null
      };
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    } finally {
      setIsBankSyncInProgress(false);
    }
  }, [
    bankConnections,
    bankAccounts,
    refreshDashboardData,
    setActiveTab,
    setErrorMessage
  ]);

  const createManualBankConnection = useCallback(async (providerName: string): Promise<BankConnectionRecord> => {
    const normalizedProviderName = providerName.trim();
    if (!normalizedProviderName) {
      throw new Error('Manual bank name is required.');
    }

    setIsManualBankSaving(true);
    setErrorMessage(null);

    try {
      const createdConnection = await opexApi.createManualBankConnection({
        providerName: normalizedProviderName
      });
      await refreshDashboardData();
      setActiveTab(APP_TABS.SETTINGS_BANKING);
      return createdConnection;
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    } finally {
      setIsManualBankSaving(false);
    }
  }, [refreshDashboardData, setActiveTab, setErrorMessage]);

  const updateManualBankConnection = useCallback(async (
    connectionId: string,
    providerName: string
  ): Promise<BankConnectionRecord> => {
    const normalizedConnectionId = normalizeText(connectionId);
    const normalizedProviderName = providerName.trim();
    if (!normalizedConnectionId) {
      throw new Error('Manual bank connection identifier is required.');
    }
    if (!normalizedProviderName) {
      throw new Error('Manual bank name is required.');
    }

    setIsManualBankSaving(true);
    setErrorMessage(null);

    try {
      const updatedConnection = await opexApi.updateManualBankConnection(normalizedConnectionId, {
        providerName: normalizedProviderName
      });
      await refreshDashboardData();
      setActiveTab(APP_TABS.SETTINGS_BANKING);
      return updatedConnection;
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    } finally {
      setIsManualBankSaving(false);
    }
  }, [refreshDashboardData, setActiveTab, setErrorMessage]);

  const deleteManualBankConnection = useCallback(async (connectionId: string) => {
    const normalizedConnectionId = normalizeText(connectionId);
    if (!normalizedConnectionId) {
      throw new Error('Manual bank connection identifier is required.');
    }

    setErrorMessage(null);

    try {
      await opexApi.deleteManualBankConnection(normalizedConnectionId);
      setPendingConnectionReviewById((current) => {
        if (!current[normalizedConnectionId]) {
          return current;
        }

        const { [normalizedConnectionId]: _removed, ...rest } = current;
        return rest;
      });
      await refreshDashboardData();
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    }
  }, [refreshDashboardData, setErrorMessage]);

  const createManualBankAccount = useCallback(async (
    connectionId: string,
    payload: {
      institutionName: string;
      balance: number;
      currency: string;
      isForTax: boolean;
      nature: string;
    }
  ): Promise<BankAccountRecord> => {
    const normalizedConnectionId = normalizeText(connectionId);
    if (!normalizedConnectionId) {
      throw new Error('Manual bank connection identifier is required.');
    }

    setIsManualBankSaving(true);
    setErrorMessage(null);

    try {
      const createdAccount = await opexApi.createManualBankAccountForConnection(normalizedConnectionId, payload);
      await refreshDashboardData();
      setActiveTab(APP_TABS.SETTINGS_BANKING);
      return createdAccount;
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    } finally {
      setIsManualBankSaving(false);
    }
  }, [refreshDashboardData, setActiveTab, setErrorMessage]);

  const updateBankAccountSettings = useCallback(async (
    bankAccountId: string,
    isSaltedge: boolean,
    payload: BankAccountSettingsPayload,
    reviewContext?: {
      connectionId: string | null | undefined;
      connectionAccountIds: string[];
    }
  ) => {
    setErrorMessage(null);
    const normalizedConnectionId = normalizeText(reviewContext?.connectionId);

    try {
      if (isSaltedge) {
        await opexApi.updateSaltedgeBankAccount(bankAccountId, payload);
      } else {
        if (!normalizedConnectionId) {
          throw new Error('Manual accounts must belong to a manual bank connection before they can be updated.');
        }
        await opexApi.updateManualBankAccountForConnection(normalizedConnectionId, bankAccountId, payload);
      }
      await refreshDashboardData();
      if (reviewContext) {
        markPendingConnectionAccountReviewed(
          reviewContext.connectionId,
          bankAccountId,
          reviewContext.connectionAccountIds
        );
      }
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    }
  }, [markPendingConnectionAccountReviewed, refreshDashboardData, setErrorMessage]);

  return {
    pendingConnectionReviewById,
    isBankSyncInProgress,
    bankSyncStage,
    isManualBankSaving,
    syncExternalBankAndNavigate,
    createManualBankConnection,
    updateManualBankConnection,
    deleteManualBankConnection,
    createManualBankAccount,
    refreshExternalBankConnection,
    deleteExternalBankConnection,
    syncAfterSuccessRedirect,
    markPendingConnectionAccountReviewed,
    updateBankAccountSettings
  };
};
