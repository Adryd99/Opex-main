import { Dispatch, SetStateAction, useCallback, useState } from 'react';

import {
  BankAccountRecord,
  CreateLocalTransactionInput,
  LegalPublicInfoRecord,
  TaxBufferDashboardResponse,
  TaxBufferProviderItem,
  TaxRecord,
  TransactionRecord,
  UserProfile
} from '../../shared/types';
import {
  clearStoredLegalConsents,
  DEFAULT_LEGAL_PUBLIC_INFO,
  syncStoredLegalConsents
} from '../../shared/legal';
import { opexApi, toUserProfilePatchPayload } from '../../services/api/opexApi';
import { APP_TABS } from '../navigation';
import { toErrorMessage } from './errors';
import { resolveBankAccountId } from './providerSupport';

type UseProfileActionsArgs = {
  bankAccounts: BankAccountRecord[];
  legalPublicInfo: LegalPublicInfoRecord | null;
  setActiveTab: (tab: string) => void;
  setErrorMessage: (message: string | null) => void;
  setUserProfile: Dispatch<SetStateAction<UserProfile>>;
  refreshDashboardData: () => Promise<unknown>;
  userProfile: UserProfile;
  transactions: TransactionRecord[];
  taxes: TaxRecord[];
  taxBufferProviders: TaxBufferProviderItem[];
  taxBufferDashboard: TaxBufferDashboardResponse | null;
};

const downloadLocalExportFallback = (payload: Record<string, unknown>) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `opex-data-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const useProfileActions = ({
  bankAccounts,
  legalPublicInfo,
  refreshDashboardData,
  setActiveTab,
  setErrorMessage,
  setUserProfile,
  userProfile,
  transactions,
  taxes,
  taxBufferProviders,
  taxBufferDashboard
}: UseProfileActionsArgs) => {
  const [isTransactionSaving, setIsTransactionSaving] = useState(false);

  const createLocalTransaction = useCallback(async (input: CreateLocalTransactionInput) => {
    setIsTransactionSaving(true);
    setErrorMessage(null);

    try {
      const selectedAccount = bankAccounts.find((account) => {
        const accountId = resolveBankAccountId(account);
        return accountId === input.bankAccountId || account.id.trim() === input.bankAccountId.trim();
      });

      if (!selectedAccount) {
        throw new Error('Selected local account not found.');
      }

      if (selectedAccount.isSaltedge) {
        throw new Error('Transactions can be created only on local accounts.');
      }

      const signedAmount = input.type === 'EXPENSE' ? -Math.abs(input.amount) : Math.abs(input.amount);
      await opexApi.createLocalTransaction({
        bankAccountId: input.bankAccountId,
        amount: signedAmount,
        bookingDate: input.bookingDate || new Date().toISOString().slice(0, 10),
        category: input.category,
        description: input.description,
        merchantName: input.description || input.category,
        status: 'COMPLETED',
        type: input.type === 'EXPENSE' ? 'DEBIT' : 'CREDIT'
      });
      await refreshDashboardData();
      setActiveTab(APP_TABS.DASHBOARD);
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    } finally {
      setIsTransactionSaving(false);
    }
  }, [bankAccounts, refreshDashboardData, setActiveTab, setErrorMessage]);

  const saveUserProfile = useCallback(async (profile: UserProfile) => {
    setErrorMessage(null);

    const savedProfile = await opexApi.patchUserProfile(toUserProfilePatchPayload(profile), profile);
    setUserProfile((current) =>
      syncStoredLegalConsents(
        {
          ...current,
          ...savedProfile,
          logo: savedProfile.logo ?? current.logo
        },
        legalPublicInfo ?? DEFAULT_LEGAL_PUBLIC_INFO
      )
    );
    await refreshDashboardData();
  }, [legalPublicInfo, refreshDashboardData, setErrorMessage, setUserProfile]);

  const requestEmailVerification = useCallback(async () => {
    setErrorMessage(null);
    const response = await opexApi.sendVerificationEmail();

    if (response.emailVerified) {
      setUserProfile((current) => ({
        ...current,
        emailVerified: true
      }));
    }

    return response;
  }, [setErrorMessage, setUserProfile]);

  const downloadDataExport = useCallback(async () => {
    setErrorMessage(null);

    try {
      await opexApi.downloadDataExport();
    } catch (error) {
      try {
        downloadLocalExportFallback({
          generatedAt: new Date().toISOString(),
          source: 'frontend-fallback',
          legalPublicInfo: legalPublicInfo ?? DEFAULT_LEGAL_PUBLIC_INFO,
          userProfile,
          bankAccounts,
          transactions,
          taxes,
          taxBufferProviders,
          taxBufferDashboard
        });
      } catch {
        setErrorMessage(toErrorMessage(error));
        throw error;
      }
    }
  }, [
    bankAccounts,
    legalPublicInfo,
    setErrorMessage,
    taxBufferDashboard,
    taxBufferProviders,
    taxes,
    transactions,
    userProfile
  ]);

  const deleteAccount = useCallback(async () => {
    setErrorMessage(null);
    try {
      await opexApi.deleteUserProfile();
      clearStoredLegalConsents(userProfile.email);
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      throw error;
    }
  }, [setErrorMessage, userProfile.email]);

  return {
    isTransactionSaving,
    createLocalTransaction,
    saveUserProfile,
    requestEmailVerification,
    downloadDataExport,
    deleteAccount
  };
};
