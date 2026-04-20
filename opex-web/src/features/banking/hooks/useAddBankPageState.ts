import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BankAccountRecord, OpenBankingConsentPayload } from '../../../shared/types';
import { AccountCategory, AddBankPageProps, ProviderConnectionCard } from '../types';
import {
  ACCOUNT_CATEGORY_TO_NATURE,
  resolveConnectionAccountName,
  resolveConnectionRecordId,
  toAccountCategory
} from '../utils';

type UseAddBankPageStateArgs = {
  allConnectionCards: ProviderConnectionCard[];
  onUpdateBankAccount: AddBankPageProps['onUpdateBankAccount'];
  onRemoveOpenBankConnection: AddBankPageProps['onRemoveOpenBankConnection'];
  onRemoveManualBankConnection: AddBankPageProps['onRemoveManualBankConnection'];
  onCreateOpenBankConnection: AddBankPageProps['onCreateOpenBankConnection'];
  openBankingNoticeVersion: string | null;
};

export const useAddBankPageState = ({
  allConnectionCards,
  onUpdateBankAccount,
  onRemoveOpenBankConnection,
  onRemoveManualBankConnection,
  onCreateOpenBankConnection,
  openBankingNoticeVersion
}: UseAddBankPageStateArgs) => {
  const { t } = useTranslation('banking');
  const [bankingView, setBankingView] = useState<'list' | 'connection-detail' | 'account-edit'>('list');
  const [selectedConnectionKey, setSelectedConnectionKey] = useState<string | null>(null);
  const [selectedConnectionProviderName, setSelectedConnectionProviderName] = useState('');
  const [selectedAccountRecordId, setSelectedAccountRecordId] = useState<string | null>(null);

  const [editAccountName, setEditAccountName] = useState('');
  const [editAccountBalance, setEditAccountBalance] = useState('0');
  const [editAccountCurrency, setEditAccountCurrency] = useState('EUR');
  const [editAccountCategory, setEditAccountCategory] = useState<AccountCategory>('Personal');
  const [editIsTaxBuffer, setEditIsTaxBuffer] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountEditError, setAccountEditError] = useState<string | null>(null);

  const [isRemovingConnection, setIsRemovingConnection] = useState(false);
  const [removeConnectionError, setRemoveConnectionError] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const [isOpenBankingConsentModalOpen, setIsOpenBankingConsentModalOpen] = useState(false);
  const [acceptOpenBankingNotice, setAcceptOpenBankingNotice] = useState(false);
  const [acceptSaltEdgeTransfer, setAcceptSaltEdgeTransfer] = useState(false);
  const [openBankingConsentError, setOpenBankingConsentError] = useState<string | null>(null);
  const [isSubmittingOpenBankingConsent, setIsSubmittingOpenBankingConsent] = useState(false);

  const liveConnection = useMemo(
    () => allConnectionCards.find((conn) => conn.key === selectedConnectionKey) ?? null,
    [allConnectionCards, selectedConnectionKey]
  );

  const liveAccount = useMemo(() => {
    if (!selectedAccountRecordId || !liveConnection) {
      return null;
    }

    return liveConnection.allAccounts.find(
      (account) => resolveConnectionRecordId(account) === selectedAccountRecordId
    ) ?? null;
  }, [liveConnection, selectedAccountRecordId]);

  const openConnectionDetail = (connectionKey: string, providerName: string) => {
    setSelectedConnectionKey(connectionKey);
    setSelectedConnectionProviderName(providerName);
    setRemoveConnectionError(null);
    setShowRemoveConfirm(false);
    setBankingView('connection-detail');
  };

  const openAccountEdit = (account: BankAccountRecord) => {
    const recordId = resolveConnectionRecordId(account);
    setSelectedAccountRecordId(recordId);
    setEditAccountName(resolveConnectionAccountName(account, selectedConnectionProviderName));
    setEditAccountBalance(String(account.balance ?? 0));
    setEditAccountCurrency((account.currency ?? 'EUR').trim().toUpperCase() || 'EUR');
    setEditAccountCategory(toAccountCategory(account.nature));
    setEditIsTaxBuffer(Boolean(account.isForTax));
    setAccountEditError(null);
    setBankingView('account-edit');
  };

  const saveAccountChanges = async () => {
    if (!liveAccount || !onUpdateBankAccount) {
      return;
    }

    const accountId = resolveConnectionRecordId(liveAccount);
    if (!accountId) {
      setAccountEditError(t('errors.missingAccountId'));
      return;
    }

    const isManualAccount = !liveAccount.isSaltedge;
    const parsedBalance = Number.parseFloat(editAccountBalance);
    if (isManualAccount && !Number.isFinite(parsedBalance)) {
      setAccountEditError(t('errors.invalidBalance'));
      return;
    }

    setIsSavingAccount(true);
    setAccountEditError(null);

    try {
      const connectionAccountIds = liveConnection?.allAccounts
        .map((account) => resolveConnectionRecordId(account))
        .filter((accountId): accountId is string => Boolean(accountId)) ?? [];
      await onUpdateBankAccount(accountId, Boolean(liveAccount.isSaltedge), {
        institutionName: editAccountName.trim() || resolveConnectionAccountName(liveAccount, selectedConnectionProviderName),
        nature: ACCOUNT_CATEGORY_TO_NATURE[editAccountCategory],
        isForTax: editIsTaxBuffer,
        balance: isManualAccount ? parsedBalance : undefined,
        currency: isManualAccount
          ? (editAccountCurrency.trim().toUpperCase() || liveAccount.currency || 'EUR')
          : undefined
      }, {
        connectionId: liveAccount.connectionId,
        connectionAccountIds
      });
      setBankingView('connection-detail');
    } catch (error) {
      setAccountEditError(error instanceof Error ? error.message : t('errors.saveChanges'));
    } finally {
      setIsSavingAccount(false);
    }
  };

  const removeConnection = async () => {
    const connectionId = liveConnection?.connectionId;
    if (!connectionId) {
      return;
    }

    setIsRemovingConnection(true);
    setRemoveConnectionError(null);

    try {
      if (liveConnection?.isManagedConnection) {
        await onRemoveOpenBankConnection(connectionId);
      } else {
        await onRemoveManualBankConnection(connectionId);
      }
      setBankingView('list');
      setSelectedConnectionKey(null);
    } catch (error) {
      setRemoveConnectionError(error instanceof Error ? error.message : t('errors.removeConnection'));
    } finally {
      setIsRemovingConnection(false);
      setShowRemoveConfirm(false);
    }
  };

  const submitOpenBankingConsent = async () => {
    if (!openBankingNoticeVersion) {
      setOpenBankingConsentError(t('errors.missingNoticeVersion'));
      return;
    }
    if (!acceptOpenBankingNotice || !acceptSaltEdgeTransfer) {
      setOpenBankingConsentError(t('errors.consentRequired'));
      return;
    }

    setOpenBankingConsentError(null);
    setIsSubmittingOpenBankingConsent(true);

    try {
      const consent: OpenBankingConsentPayload = {
        acceptOpenBankingNotice: true,
        openBankingNoticeVersion,
        scopes: ['accounts', 'transactions']
      };
      await onCreateOpenBankConnection(consent);
      setIsOpenBankingConsentModalOpen(false);
    } catch (error) {
      setOpenBankingConsentError(error instanceof Error ? error.message : t('errors.startConnection'));
    } finally {
      setIsSubmittingOpenBankingConsent(false);
    }
  };

  const openConsentModal = () => {
    setAcceptOpenBankingNotice(false);
    setAcceptSaltEdgeTransfer(false);
    setOpenBankingConsentError(null);
    setIsOpenBankingConsentModalOpen(true);
  };

  return {
    bankingView,
    setBankingView,
    selectedConnectionProviderName,
    liveConnection,
    liveAccount,
    editAccountName,
    setEditAccountName,
    editAccountBalance,
    setEditAccountBalance,
    editAccountCurrency,
    setEditAccountCurrency,
    editAccountCategory,
    setEditAccountCategory,
    editIsTaxBuffer,
    setEditIsTaxBuffer,
    isSavingAccount,
    accountEditError,
    setAccountEditError,
    isRemovingConnection,
    removeConnectionError,
    setRemoveConnectionError,
    showRemoveConfirm,
    setShowRemoveConfirm,
    isOpenBankingConsentModalOpen,
    setIsOpenBankingConsentModalOpen,
    acceptOpenBankingNotice,
    setAcceptOpenBankingNotice,
    acceptSaltEdgeTransfer,
    setAcceptSaltEdgeTransfer,
    openBankingConsentError,
    isSubmittingOpenBankingConsent,
    openConnectionDetail,
    openAccountEdit,
    saveAccountChanges,
    removeConnection,
    submitOpenBankingConsent,
    openConsentModal,
    clearRemoveConnectionError: () => setRemoveConnectionError(null),
    clearOpenBankingConsentError: () => setOpenBankingConsentError(null)
  };
};
