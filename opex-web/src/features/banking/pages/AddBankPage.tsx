import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SubpageShell } from '../../../app/layout';
import { AccountCategory, AddBankPageProps } from '../types';
import {
  ACCOUNT_CATEGORY_TO_NATURE,
  buildConnectionCards,
  resolveConnectionRecordId
} from '../utils';
import {
  BankAccountEditView,
  BankConnectionDetailView,
  BankConnectionListView,
  ManualBankAccountCreateView,
  ManualBankConnectionCreateView,
  OpenBankingConsentModal
} from '../components';
import { useAddBankPageState } from '../hooks/useAddBankPageState';

export const AddBankPage = ({
  onNavigate,
  onCreateManualBankConnection,
  onUpdateManualBankConnection,
  onRemoveManualBankConnection,
  onCreateManualBankAccount,
  onUpdateBankAccount,
  bankConnections,
  onCreateOpenBankConnection,
  onRemoveOpenBankConnection,
  pendingConnectionReviewById = {},
  initialConnectionId = null,
  onInitialConnectionHandled,
  legalPublicInfo = null,
  openBankingNoticeVersion = null,
  isConnectingOpenBank = false,
  openBankErrorMessage = null,
  embeddedInSettings = false
}: AddBankPageProps) => {
  const { t } = useTranslation('settings');
  const [isManualBankCreateViewOpen, setIsManualBankCreateViewOpen] = useState(false);
  const [manualBankName, setManualBankName] = useState('');
  const [manualBankCreateError, setManualBankCreateError] = useState<string | null>(null);
  const [isCreatingManualBank, setIsCreatingManualBank] = useState(false);
  const [queuedConnectionIdToOpen, setQueuedConnectionIdToOpen] = useState<string | null>(null);
  const [isManualBankRenameMode, setIsManualBankRenameMode] = useState(false);
  const [manualBankRenameValue, setManualBankRenameValue] = useState('');
  const [manualBankRenameError, setManualBankRenameError] = useState<string | null>(null);
  const [isRenamingManualBank, setIsRenamingManualBank] = useState(false);
  const [isManualAccountCreateViewOpen, setIsManualAccountCreateViewOpen] = useState(false);
  const [manualAccountName, setManualAccountName] = useState('');
  const [manualAccountBalance, setManualAccountBalance] = useState('0');
  const [manualAccountCurrency, setManualAccountCurrency] = useState('EUR');
  const [manualAccountCategory, setManualAccountCategory] = useState<AccountCategory>('Personal');
  const [manualAccountIsTaxBuffer, setManualAccountIsTaxBuffer] = useState(false);
  const [manualAccountCreateError, setManualAccountCreateError] = useState<string | null>(null);
  const [isCreatingManualAccount, setIsCreatingManualAccount] = useState(false);
  const allConnectionCards = useMemo(() => buildConnectionCards(bankConnections), [bankConnections]);
  const connectionReviewMetaByKey = useMemo(
    () =>
      Object.fromEntries(
        allConnectionCards.map((conn) => {
          const normalizedConnectionId = conn.connectionId.trim();
          const pendingReviewIds = normalizedConnectionId
            ? pendingConnectionReviewById[normalizedConnectionId] ?? []
            : [];

          return [
            conn.key,
            {
              requiresReview: pendingReviewIds.length > 0,
              pendingReviewCount: pendingReviewIds.length,
              pendingReviewIds
            }
          ];
        })
      ),
    [allConnectionCards, pendingConnectionReviewById]
  );
  const {
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
    clearRemoveConnectionError,
    clearOpenBankingConsentError
  } = useAddBankPageState({
    allConnectionCards,
    onUpdateBankAccount,
    onRemoveOpenBankConnection,
    onRemoveManualBankConnection,
    onCreateOpenBankConnection,
    openBankingNoticeVersion
  });
  const lastAppliedInitialConnectionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!liveConnection || liveConnection.isManagedConnection) {
      setIsManualBankRenameMode(false);
      setManualBankRenameValue('');
      setManualBankRenameError(null);
      setIsRenamingManualBank(false);
      return;
    }

    if (!isManualBankRenameMode) {
      setManualBankRenameValue(liveConnection.providerName);
      setManualBankRenameError(null);
    }
  }, [isManualBankRenameMode, liveConnection]);

  useEffect(() => {
    const normalizedQueuedConnectionId = (queuedConnectionIdToOpen ?? '').trim();
    const normalizedInitialConnectionId = (initialConnectionId ?? '').trim();
    const targetConnectionId = normalizedQueuedConnectionId || normalizedInitialConnectionId;
    if (!targetConnectionId || lastAppliedInitialConnectionIdRef.current === targetConnectionId) {
      return;
    }

    const targetConnection = allConnectionCards.find((conn) => conn.connectionId.trim() === targetConnectionId);
    if (!targetConnection) {
      return;
    }

    lastAppliedInitialConnectionIdRef.current = targetConnectionId;
    openConnectionDetail(targetConnection.key, targetConnection.providerName);
    if (normalizedQueuedConnectionId) {
      setQueuedConnectionIdToOpen(null);
      setIsManualBankCreateViewOpen(false);
    } else {
      onInitialConnectionHandled?.();
    }
  }, [allConnectionCards, initialConnectionId, onInitialConnectionHandled, openConnectionDetail, queuedConnectionIdToOpen]);

  const resetManualAccountCreateState = () => {
    setManualAccountName('');
    setManualAccountBalance('0');
    setManualAccountCurrency((liveConnection?.allAccounts[0]?.currency ?? 'EUR').trim().toUpperCase() || 'EUR');
    setManualAccountCategory('Personal');
    setManualAccountIsTaxBuffer(false);
    setManualAccountCreateError(null);
  };

  const handleCreateManualBankConnection = async () => {
    const normalizedName = manualBankName.trim();
    if (!normalizedName) {
      setManualBankCreateError(t('manualBankCreate.nameRequired'));
      return;
    }

    setIsCreatingManualBank(true);
    setManualBankCreateError(null);

    try {
      const connection = await onCreateManualBankConnection(normalizedName);
      setManualBankName('');
      setQueuedConnectionIdToOpen(connection.id);
    } catch (error) {
      setManualBankCreateError(error instanceof Error ? error.message : t('manualBankCreate.createError'));
    } finally {
      setIsCreatingManualBank(false);
    }
  };

  const handleSubmitManualBankRename = async () => {
    if (!liveConnection || liveConnection.isManagedConnection) {
      return;
    }

    const normalizedName = manualBankRenameValue.trim();
    if (!normalizedName) {
      setManualBankRenameError(t('bankingDetail.manualBankNameRequired'));
      return;
    }

    if (normalizedName === liveConnection.providerName.trim()) {
      setIsManualBankRenameMode(false);
      setManualBankRenameError(null);
      return;
    }

    setIsRenamingManualBank(true);
    setManualBankRenameError(null);

    try {
      await onUpdateManualBankConnection(liveConnection.connectionId, normalizedName);
      setIsManualBankRenameMode(false);
    } catch (error) {
      setManualBankRenameError(
        error instanceof Error ? error.message : t('bankingDetail.renameManualBankError')
      );
    } finally {
      setIsRenamingManualBank(false);
    }
  };

  const handleCreateManualAccount = async () => {
    if (!liveConnection || liveConnection.isManagedConnection) {
      setManualAccountCreateError(t('manualAccountCreate.missingConnection'));
      return;
    }

    const normalizedAccountName = manualAccountName.trim();
    if (!normalizedAccountName) {
      setManualAccountCreateError(t('manualAccountCreate.nameRequired'));
      return;
    }

    const parsedBalance = Number.parseFloat(manualAccountBalance);
    if (!Number.isFinite(parsedBalance)) {
      setManualAccountCreateError(t('manualAccountCreate.invalidBalance'));
      return;
    }

    const normalizedCurrency = manualAccountCurrency.trim().toUpperCase() || 'EUR';
    setIsCreatingManualAccount(true);
    setManualAccountCreateError(null);

    try {
      await onCreateManualBankAccount(liveConnection.connectionId, {
        institutionName: normalizedAccountName,
        balance: parsedBalance,
        currency: normalizedCurrency,
        isForTax: manualAccountIsTaxBuffer,
        nature: ACCOUNT_CATEGORY_TO_NATURE[manualAccountCategory]
      });
      resetManualAccountCreateState();
      setIsManualAccountCreateViewOpen(false);
    } catch (error) {
      setManualAccountCreateError(
        error instanceof Error ? error.message : t('manualAccountCreate.createError')
      );
    } finally {
      setIsCreatingManualAccount(false);
    }
  };

  const accountEditContent = (
    <BankAccountEditView
      account={liveAccount}
      providerName={liveConnection?.providerName ?? selectedConnectionProviderName}
      editAccountName={editAccountName}
      editAccountBalance={editAccountBalance}
      editAccountCurrency={editAccountCurrency}
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
      onBalanceChange={(value) => {
        setEditAccountBalance(value);
        if (accountEditError) {
          setAccountEditError(null);
        }
      }}
      onCurrencyChange={(value) => {
        setEditAccountCurrency(value);
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
      onSave={() => void saveAccountChanges()}
    />
  );

  const connectionDetailContent = (
    <BankConnectionDetailView
      connection={liveConnection ?? null}
      requiresReview={Boolean(liveConnection && connectionReviewMetaByKey[liveConnection.key]?.requiresReview)}
      pendingReviewCount={liveConnection ? connectionReviewMetaByKey[liveConnection.key]?.pendingReviewCount ?? 0 : 0}
      pendingReviewAccountIds={liveConnection ? connectionReviewMetaByKey[liveConnection.key]?.pendingReviewIds ?? [] : []}
      showRemoveConfirm={showRemoveConfirm}
      removeConnectionError={removeConnectionError}
      isRemovingConnection={isRemovingConnection}
      onBack={() => {
        setIsManualBankRenameMode(false);
        setManualBankRenameError(null);
        setBankingView('list');
      }}
      onEditAccount={(accountId) => {
        const account = liveConnection?.allAccounts.find(
          (candidate) => resolveConnectionRecordId(candidate) === accountId
        );
        if (account) {
          openAccountEdit(account);
        }
      }}
      onCreateManualAccount={
        liveConnection && !liveConnection.isManagedConnection
          ? () => {
              resetManualAccountCreateState();
              setIsManualAccountCreateViewOpen(true);
            }
          : undefined
      }
      isManualBankRenameMode={isManualBankRenameMode}
      manualBankRenameValue={manualBankRenameValue}
      manualBankRenameError={manualBankRenameError}
      isRenamingManualBank={isRenamingManualBank}
      onStartManualBankRename={() => {
        setManualBankRenameValue(liveConnection?.providerName ?? '');
        setManualBankRenameError(null);
        setIsManualBankRenameMode(true);
      }}
      onCancelManualBankRename={() => {
        setManualBankRenameValue(liveConnection?.providerName ?? '');
        setManualBankRenameError(null);
        setIsManualBankRenameMode(false);
      }}
      onManualBankRenameChange={(value) => {
        setManualBankRenameValue(value);
        if (manualBankRenameError) {
          setManualBankRenameError(null);
        }
      }}
      onSubmitManualBankRename={() => void handleSubmitManualBankRename()}
      onToggleRemoveConfirm={setShowRemoveConfirm}
      onClearRemoveError={clearRemoveConnectionError}
      onRemoveConnection={() => void removeConnection()}
    />
  );

  const listContent = (
    <BankConnectionListView
      connections={allConnectionCards}
      connectionReviewMetaByKey={connectionReviewMetaByKey}
      isConnectingOpenBank={isConnectingOpenBank}
      openBankErrorMessage={openBankErrorMessage}
      onOpenConsentModal={openConsentModal}
      onOpenManualBankCreate={() => {
        setManualBankName('');
        setManualBankCreateError(null);
        setIsManualBankCreateViewOpen(true);
      }}
      onOpenConnectionDetail={openConnectionDetail}
    />
  );

  const manualBankCreateContent = (
    <ManualBankConnectionCreateView
      providerName={manualBankName}
      errorMessage={manualBankCreateError}
      isSaving={isCreatingManualBank}
      onBack={() => {
        setIsManualBankCreateViewOpen(false);
        setManualBankCreateError(null);
      }}
      onProviderNameChange={(value) => {
        setManualBankName(value);
        if (manualBankCreateError) {
          setManualBankCreateError(null);
        }
      }}
      onSubmit={() => void handleCreateManualBankConnection()}
    />
  );

  const manualAccountCreateContent = (
    <ManualBankAccountCreateView
      bankName={liveConnection?.providerName ?? selectedConnectionProviderName}
      accountName={manualAccountName}
      balance={manualAccountBalance}
      currency={manualAccountCurrency}
      accountCategory={manualAccountCategory}
      isTaxBuffer={manualAccountIsTaxBuffer}
      isSaving={isCreatingManualAccount}
      errorMessage={manualAccountCreateError}
      onBack={() => {
        setIsManualAccountCreateViewOpen(false);
        setManualAccountCreateError(null);
      }}
      onAccountNameChange={(value) => {
        setManualAccountName(value);
        if (manualAccountCreateError) {
          setManualAccountCreateError(null);
        }
      }}
      onBalanceChange={(value) => {
        setManualAccountBalance(value);
        if (manualAccountCreateError) {
          setManualAccountCreateError(null);
        }
      }}
      onCurrencyChange={(value) => {
        setManualAccountCurrency(value);
        if (manualAccountCreateError) {
          setManualAccountCreateError(null);
        }
      }}
      onCategoryChange={(value) => {
        setManualAccountCategory(value);
        if (manualAccountCreateError) {
          setManualAccountCreateError(null);
        }
      }}
      onTaxBufferToggle={() => setManualAccountIsTaxBuffer((value) => !value)}
      onSubmit={() => void handleCreateManualAccount()}
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
      legalPublicInfo={legalPublicInfo}
      onAcceptOpenBankingNoticeChange={(value) => {
        setAcceptOpenBankingNotice(value);
        if (openBankingConsentError) {
          clearOpenBankingConsentError();
        }
      }}
      onAcceptSaltEdgeTransferChange={(value) => {
        setAcceptSaltEdgeTransfer(value);
        if (openBankingConsentError) {
          clearOpenBankingConsentError();
        }
      }}
      onSubmit={() => void submitOpenBankingConsent()}
    />
  );

  if (isManualBankCreateViewOpen) {
    if (embeddedInSettings) {
      return (
        <>
          {manualBankCreateContent}
          {consentModal}
        </>
      );
    }

    return (
      <SubpageShell onBack={() => setIsManualBankCreateViewOpen(false)} title={t('manualBankCreate.shellTitle')}>
        {manualBankCreateContent}
        {consentModal}
      </SubpageShell>
    );
  }

  if (isManualAccountCreateViewOpen) {
    if (embeddedInSettings) {
      return (
        <>
          {manualAccountCreateContent}
          {consentModal}
        </>
      );
    }

    return (
      <SubpageShell onBack={() => setIsManualAccountCreateViewOpen(false)} title={t('manualAccountCreate.shellTitle')}>
        {manualAccountCreateContent}
        {consentModal}
      </SubpageShell>
    );
  }

  if (bankingView === 'account-edit') {
    if (embeddedInSettings) {
      return accountEditContent;
    }

    return (
      <SubpageShell
        onBack={() => setBankingView('connection-detail')}
        title={liveConnection?.providerName || selectedConnectionProviderName || t('bankingEdit.fallbackTitle')}
      >
        {accountEditContent}
      </SubpageShell>
    );
  }

  if (bankingView === 'connection-detail') {
    if (embeddedInSettings) {
      return connectionDetailContent;
    }

    return (
      <SubpageShell
        onBack={() => setBankingView('list')}
        title={liveConnection?.providerName || selectedConnectionProviderName || t('bankingDetail.fallbackTitle')}
      >
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
    <SubpageShell onBack={() => onNavigate('SETTINGS')} title={t('bankingSection.title')}>
      {listContent}
      {consentModal}
    </SubpageShell>
  );
};
