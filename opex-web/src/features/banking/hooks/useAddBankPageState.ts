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

type ConnectionCardItem = {
  conn: ProviderConnectionCard;
  providerName: string;
};

type UseAddBankPageStateArgs = {
  allConnectionCards: ConnectionCardItem[];
  onUpdateBankAccount: AddBankPageProps['onUpdateBankAccount'];
  onRemoveOpenBankConnection: AddBankPageProps['onRemoveOpenBankConnection'];
  onCreateOpenBankConnection: AddBankPageProps['onCreateOpenBankConnection'];
  openBankingNoticeVersion: string | null;
};

export const useAddBankPageState = ({
  allConnectionCards,
  onUpdateBankAccount,
  onRemoveOpenBankConnection,
  onCreateOpenBankConnection,
  openBankingNoticeVersion
}: UseAddBankPageStateArgs) => {
  const { t } = useTranslation('banking');
  const [bankingView, setBankingView] = useState<'list' | 'connection-detail' | 'account-edit'>('list');
  const [selectedConnectionKey, setSelectedConnectionKey] = useState<string | null>(null);
  const [selectedConnectionProviderName, setSelectedConnectionProviderName] = useState('');
  const [selectedAccountRecordId, setSelectedAccountRecordId] = useState<string | null>(null);

  const [editAccountName, setEditAccountName] = useState('');
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
    () => allConnectionCards.find(({ conn }) => conn.key === selectedConnectionKey) ?? null,
    [allConnectionCards, selectedConnectionKey]
  );

  const liveAccount = useMemo(() => {
    if (!selectedAccountRecordId || !liveConnection) {
      return null;
    }

    return liveConnection.conn.allAccounts.find(
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

    setIsSavingAccount(true);
    setAccountEditError(null);

    try {
      await onUpdateBankAccount(accountId, Boolean(liveAccount.isSaltedge), {
        institutionName: editAccountName.trim() || resolveConnectionAccountName(liveAccount, selectedConnectionProviderName),
        nature: ACCOUNT_CATEGORY_TO_NATURE[editAccountCategory],
        isForTax: editIsTaxBuffer
      });
      setBankingView('connection-detail');
    } catch (error) {
      setAccountEditError(error instanceof Error ? error.message : t('errors.saveChanges'));
    } finally {
      setIsSavingAccount(false);
    }
  };

  const removeConnection = async () => {
    const connectionId = liveConnection?.conn.connectionId;
    if (!connectionId) {
      return;
    }

    setIsRemovingConnection(true);
    setRemoveConnectionError(null);

    try {
      await onRemoveOpenBankConnection(connectionId);
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
