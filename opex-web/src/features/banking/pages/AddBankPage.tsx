import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { SubpageShell } from '../../../app/layout';
import { BankAccountRecord } from '../../../shared/types';
import { AccountCategory, AddBankPageProps } from '../types';
import {
  ACCOUNT_CATEGORY_TO_NATURE,
  groupProviderConnections,
  resolveConnectionAccountName,
  resolveConnectionRecordId,
  toAccountCategory
} from '../utils';
import {
  BankAccountEditView,
  BankConnectionDetailView,
  BankConnectionListView,
  OpenBankingConsentModal
} from '../components';

export const AddBankPage = ({
  onNavigate,
  onBankSelect,
  onConnectionSelect: _onConnectionSelect,
  onUpdateBankAccount,
  bankAccounts,
  taxBufferProviders = [],
  onCreateOpenBankConnection,
  onRemoveOpenBankConnection,
  openBankingNoticeVersion = null,
  isConnectingOpenBank = false,
  openBankErrorMessage = null,
  embeddedInSettings = false
}: AddBankPageProps) => {
  const groupedByProvider = useMemo(
    () => groupProviderConnections(bankAccounts, taxBufferProviders),
    [bankAccounts, taxBufferProviders]
  );

  const allConnectionCards = useMemo(
    () => groupedByProvider.flatMap(({ providerName, connections }) =>
      connections.map((conn) => ({ conn, providerName }))
    ),
    [groupedByProvider]
  );

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

  const handleSaveAccount = async () => {
    if (!liveAccount || !onUpdateBankAccount) {
      return;
    }

    const accountId = resolveConnectionRecordId(liveAccount);
    if (!accountId) {
      setAccountEditError('Unable to identify the account ID.');
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
      setAccountEditError(error instanceof Error ? error.message : 'Unable to save changes.');
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleRemoveConnection = async () => {
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
      setRemoveConnectionError(error instanceof Error ? error.message : 'Unable to remove connection.');
    } finally {
      setIsRemovingConnection(false);
      setShowRemoveConfirm(false);
    }
  };

  const handleOpenBankingStart = async () => {
    if (!openBankingNoticeVersion) {
      setOpenBankingConsentError('Open banking notice version is not available yet. Reload and retry.');
      return;
    }
    if (!acceptOpenBankingNotice || !acceptSaltEdgeTransfer) {
      setOpenBankingConsentError('You must confirm both notices before connecting a bank.');
      return;
    }

    setOpenBankingConsentError(null);
    setIsSubmittingOpenBankingConsent(true);

    try {
      await onCreateOpenBankConnection({
        acceptOpenBankingNotice: true,
        openBankingNoticeVersion,
        scopes: ['accounts', 'transactions']
      });
      setIsOpenBankingConsentModalOpen(false);
    } catch (error) {
      setOpenBankingConsentError(error instanceof Error ? error.message : 'Unable to start open banking connection.');
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

  const accountEditContent = (
    <BankAccountEditView
      account={liveAccount}
      providerName={selectedConnectionProviderName}
      editAccountName={editAccountName}
      editAccountCategory={editAccountCategory}
      editIsTaxBuffer={editIsTaxBuffer}
      isSavingAccount={isSavingAccount}
      accountEditError={accountEditError}
      onBack={() => setBankingView('connection-detail')}
      onNameChange={(value) => {
        setEditAccountName(value);
        if (accountEditError) {
          setAccountEditError(null);
        }
      }}
      onCategoryChange={(value) => {
        setEditAccountCategory(value);
        if (accountEditError) {
          setAccountEditError(null);
        }
      }}
      onTaxBufferToggle={() => setEditIsTaxBuffer((value) => !value)}
      onSave={() => void handleSaveAccount()}
    />
  );

  const connectionDetailContent = (
    <BankConnectionDetailView
      connection={liveConnection?.conn ?? null}
      providerName={selectedConnectionProviderName}
      showRemoveConfirm={showRemoveConfirm}
      removeConnectionError={removeConnectionError}
      isRemovingConnection={isRemovingConnection}
      onBack={() => setBankingView('list')}
      onEditAccount={(accountId) => {
        const account = liveConnection?.conn.allAccounts.find(
          (candidate) => resolveConnectionRecordId(candidate) === accountId
        );
        if (account) {
          openAccountEdit(account);
        }
      }}
      onToggleRemoveConfirm={setShowRemoveConfirm}
      onClearRemoveError={() => setRemoveConnectionError(null)}
      onRemoveConnection={() => void handleRemoveConnection()}
    />
  );

  const listContent = (
    <BankConnectionListView
      connections={allConnectionCards}
      isConnectingOpenBank={isConnectingOpenBank}
      openBankErrorMessage={openBankErrorMessage}
      onOpenConsentModal={openConsentModal}
      onAddManualAccount={() => onBankSelect({ name: 'Manual Account', color: 'bg-gray-400', icon: <Plus />, isManual: true })}
      onOpenConnectionDetail={openConnectionDetail}
    />
  );

  const consentModal = (
    <OpenBankingConsentModal
      isOpen={isOpenBankingConsentModalOpen}
      openBankingNoticeVersion={openBankingNoticeVersion}
      acceptOpenBankingNotice={acceptOpenBankingNotice}
      acceptSaltEdgeTransfer={acceptSaltEdgeTransfer}
      openBankingConsentError={openBankingConsentError}
      isSubmittingOpenBankingConsent={isSubmittingOpenBankingConsent}
      onClose={() => setIsOpenBankingConsentModalOpen(false)}
      onAcceptOpenBankingNoticeChange={(value) => {
        setAcceptOpenBankingNotice(value);
        if (openBankingConsentError) {
          setOpenBankingConsentError(null);
        }
      }}
      onAcceptSaltEdgeTransferChange={(value) => {
        setAcceptSaltEdgeTransfer(value);
        if (openBankingConsentError) {
          setOpenBankingConsentError(null);
        }
      }}
      onSubmit={() => void handleOpenBankingStart()}
    />
  );

  if (bankingView === 'account-edit') {
    if (embeddedInSettings) {
      return accountEditContent;
    }

    return (
      <SubpageShell onBack={() => setBankingView('connection-detail')} title={selectedConnectionProviderName || 'Connection'}>
        {accountEditContent}
      </SubpageShell>
    );
  }

  if (bankingView === 'connection-detail') {
    if (embeddedInSettings) {
      return connectionDetailContent;
    }

    return (
      <SubpageShell onBack={() => setBankingView('list')} title={selectedConnectionProviderName || 'Connection'}>
        {connectionDetailContent}
      </SubpageShell>
    );
  }

  if (embeddedInSettings) {
    return (
      <>
        {listContent}
        {consentModal}
      </>
    );
  }

  return (
    <SubpageShell onBack={() => onNavigate('SETTINGS')} title="Banking">
      {listContent}
      {consentModal}
    </SubpageShell>
  );
};
