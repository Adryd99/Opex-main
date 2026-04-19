import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SubpageShell } from '../../../app/layout';
import { AddBankPageProps } from '../types';
import {
  groupProviderConnections,
  resolveConnectionRecordId
} from '../utils';
import {
  BankAccountEditView,
  BankConnectionDetailView,
  BankConnectionListView,
  OpenBankingConsentModal
} from '../components';
import { useAddBankPageState } from '../hooks/useAddBankPageState';

export const AddBankPage = ({
  onNavigate,
  onBankSelect,
  onConnectionSelect: _onConnectionSelect,
  onUpdateBankAccount,
  bankAccounts,
  taxBufferProviders = [],
  onCreateOpenBankConnection,
  onRemoveOpenBankConnection,
  legalPublicInfo = null,
  openBankingNoticeVersion = null,
  isConnectingOpenBank = false,
  openBankErrorMessage = null,
  embeddedInSettings = false
}: AddBankPageProps) => {
  const { t } = useTranslation('settings');
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
  const {
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
    onCreateOpenBankConnection,
    openBankingNoticeVersion
  });

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
      onSave={() => void saveAccountChanges()}
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
      onClearRemoveError={clearRemoveConnectionError}
      onRemoveConnection={() => void removeConnection()}
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

  if (bankingView === 'account-edit') {
    if (embeddedInSettings) {
      return accountEditContent;
    }

    return (
      <SubpageShell onBack={() => setBankingView('connection-detail')} title={selectedConnectionProviderName || t('bankingEdit.fallbackTitle')}>
        {accountEditContent}
      </SubpageShell>
    );
  }

  if (bankingView === 'connection-detail') {
    if (embeddedInSettings) {
      return connectionDetailContent;
    }

    return (
      <SubpageShell onBack={() => setBankingView('list')} title={selectedConnectionProviderName || t('bankingDetail.fallbackTitle')}>
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
