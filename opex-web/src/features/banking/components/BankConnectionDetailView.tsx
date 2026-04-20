import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ProviderConnectionCard } from '../types';
import {
  formatBankBalance,
  resolveConnectionAccountName,
  resolveConnectionStatusColor,
  resolveConnectionStatusLabel,
  toAccountCategory
} from '../utils';

type BankConnectionDetailViewProps = {
  connection: ProviderConnectionCard | null;
  requiresReview: boolean;
  pendingReviewCount: number;
  pendingReviewAccountIds: string[];
  showRemoveConfirm: boolean;
  removeConnectionError: string | null;
  isRemovingConnection: boolean;
  onBack: () => void;
  onEditAccount: (accountId: string) => void;
  onCreateManualAccount?: () => void;
  isManualBankRenameMode?: boolean;
  manualBankRenameValue?: string;
  manualBankRenameError?: string | null;
  isRenamingManualBank?: boolean;
  onStartManualBankRename?: () => void;
  onCancelManualBankRename?: () => void;
  onManualBankRenameChange?: (value: string) => void;
  onSubmitManualBankRename?: () => void;
  onToggleRemoveConfirm: (value: boolean) => void;
  onClearRemoveError: () => void;
  onRemoveConnection: () => void;
};

export const BankConnectionDetailView = ({
  connection,
  requiresReview,
  pendingReviewCount,
  pendingReviewAccountIds,
  showRemoveConfirm,
  removeConnectionError,
  isRemovingConnection,
  onBack,
  onEditAccount,
  onCreateManualAccount,
  isManualBankRenameMode = false,
  manualBankRenameValue = '',
  manualBankRenameError = null,
  isRenamingManualBank = false,
  onStartManualBankRename,
  onCancelManualBankRename,
  onManualBankRenameChange,
  onSubmitManualBankRename,
  onToggleRemoveConfirm,
  onClearRemoveError,
  onRemoveConnection
}: BankConnectionDetailViewProps) => {
  const { t } = useTranslation('settings');
  const statusLabel = resolveConnectionStatusLabel(connection?.status ?? null);
  const accounts = connection?.allAccounts ?? [];
  const isManagedConnection = Boolean(connection?.isManagedConnection);
  const pendingReviewIdSet = useMemo(
    () => new Set(pendingReviewAccountIds.filter(Boolean)),
    [pendingReviewAccountIds]
  );
  const sortedAccounts = useMemo(() => {
    if (!requiresReview || pendingReviewIdSet.size === 0) {
      return accounts;
    }

    return [...accounts].sort((left, right) => {
      const leftId = (left.accountId ?? '').trim()
        || (left.saltedgeAccountId ?? '').trim()
        || (left.saltedge_account_id ?? '').trim()
        || left.id;
      const rightId = (right.accountId ?? '').trim()
        || (right.saltedgeAccountId ?? '').trim()
        || (right.saltedge_account_id ?? '').trim()
        || right.id;
      const leftPending = pendingReviewIdSet.has(leftId) ? 0 : 1;
      const rightPending = pendingReviewIdSet.has(rightId) ? 0 : 1;

      return leftPending - rightPending;
    });
  }, [accounts, pendingReviewIdSet, requiresReview]);

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-black text-app-secondary transition-colors hover:text-opex-dark dark:hover:text-opex-teal"
      >
        <ArrowLeft size={16} />
        {t('bankingDetail.backToConnections')}
      </button>

      <div className="rounded-[2rem] border border-app-border bg-app-surface p-6 shadow-sm transition-colors duration-200">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[1.25rem] bg-opex-dark font-black text-sm text-white shadow-md dark:bg-opex-teal dark:text-slate-950 transition-colors duration-200">
            {(connection?.providerName ?? '').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-black tracking-tight text-app-primary">{connection?.providerName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-app-tertiary">
                {connection?.isManagedConnection ? t('bankingDetail.liveSource') : t('bankingDetail.localSource')}
              </span>
              {statusLabel && (
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${resolveConnectionStatusColor(connection?.status ?? null)}`}>
                  {statusLabel}
                </span>
              )}
              {requiresReview ? (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
                  {t('bankingDetail.requiresReview')}
                </span>
              ) : null}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-black text-app-primary">
              {formatBankBalance(connection?.totalBalance ?? 0, connection?.currency ?? undefined)}
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-app-tertiary">
              {t('bankingList.account', { count: connection?.accountCount ?? 0 })}
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-[1.5rem] border border-app-border bg-app-muted px-4 py-3">
          <p className="text-sm font-black text-app-primary">
            {isManagedConnection ? t('bankingDetail.connectedBankTitle') : t('bankingDetail.manualBankTitle')}
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-app-secondary">
            {isManagedConnection ? t('bankingDetail.connectedBankDescription') : t('bankingDetail.manualBankDescription')}
          </p>
        </div>
      </div>

      {!isManagedConnection ? (
        <div className="rounded-[1.75rem] border border-app-border bg-app-muted/70 p-5 transition-colors duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-app-tertiary">
                {t('bankingDetail.manualBankSettings')}
              </p>
              <p className="mt-2 text-sm font-black text-app-primary">{t('bankingDetail.renameManualBank')}</p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-app-secondary">
                {t('bankingDetail.renameManualBankDescription')}
              </p>
            </div>
            {!isManualBankRenameMode ? (
              <button
                type="button"
                onClick={onStartManualBankRename}
                className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-xl border border-app-border bg-app-surface px-4 text-xs font-black text-app-secondary transition-colors hover:border-slate-300 dark:hover:border-app-tertiary/50"
              >
                {t('bankingDetail.renameManualBank')}
              </button>
            ) : null}
          </div>

          {isManualBankRenameMode ? (
            <div className="mt-4 space-y-4 rounded-[1.5rem] border border-app-border bg-app-surface px-5 py-4 transition-colors duration-200">
              <div className="space-y-2">
                <label
                  htmlFor="manual-bank-name"
                  className="text-[11px] font-black uppercase tracking-[0.22em] text-app-tertiary"
                >
                  {t('bankingDetail.manualBankNameLabel')}
                </label>
                <input
                  id="manual-bank-name"
                  type="text"
                  value={manualBankRenameValue}
                  onChange={(event) => onManualBankRenameChange?.(event.target.value)}
                  placeholder={t('bankingDetail.manualBankNamePlaceholder')}
                  className="w-full rounded-[1rem] border border-app-border bg-app-base px-4 py-3 text-sm font-medium text-app-primary outline-none transition-colors focus:border-opex-teal/60"
                />
              </div>
              {manualBankRenameError ? (
                <p className="text-sm font-bold text-red-600 dark:text-red-200">{manualBankRenameError}</p>
              ) : null}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancelManualBankRename}
                  disabled={isRenamingManualBank}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-[1rem] border border-app-border bg-app-base text-sm font-black text-app-secondary transition-colors hover:border-slate-300 dark:hover:border-app-tertiary/50"
                >
                  {t('bankingDetail.cancel')}
                </button>
                <button
                  type="button"
                  onClick={onSubmitManualBankRename}
                  disabled={isRenamingManualBank}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[1rem] bg-opex-dark text-sm font-black text-white transition-colors hover:bg-slate-800 disabled:opacity-60 dark:bg-opex-teal dark:text-slate-950 dark:hover:bg-opex-teal/90"
                >
                  {isRenamingManualBank ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {t('bankingDetail.savingManualBank')}
                    </>
                  ) : t('bankingDetail.saveManualBank')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        {requiresReview ? (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/90 px-4 py-4 dark:border-amber-400/20 dark:bg-amber-400/10 transition-colors duration-200">
            <p className="text-sm font-black text-app-primary">{t('bankingDetail.reviewNoticeTitle')}</p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-app-secondary">
              {t('bankingDetail.reviewNoticeDescription', { count: pendingReviewCount })}
            </p>
          </div>
        ) : null}
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-app-tertiary">{t('bankingDetail.accountsInConnection')}</p>
            <p className="text-sm font-medium text-app-secondary">{t('bankingDetail.accountsInConnectionDescription')}</p>
          </div>
          {!isManagedConnection && onCreateManualAccount ? (
            <button
              type="button"
              onClick={onCreateManualAccount}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-[1rem] bg-opex-dark px-4 text-sm font-black text-white shadow-[0_20px_40px_-20px_rgba(12,33,49,0.55)] transition-all hover:bg-slate-800 dark:bg-opex-teal dark:text-slate-950 dark:hover:bg-opex-teal/90"
            >
              {t('bankingDetail.addManualAccount')}
            </button>
          ) : null}
        </div>
        {accounts.length === 0 ? (
          !isManagedConnection && onCreateManualAccount ? (
            <div className="rounded-[1.75rem] border border-dashed border-app-border bg-app-muted/70 p-8 text-center transition-colors duration-200">
              <p className="text-sm font-black text-app-primary">{t('bankingDetail.noManualAccountsTitle')}</p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-app-secondary">
                {t('bankingDetail.noManualAccountsDescription')}
              </p>
              <button
                type="button"
                onClick={onCreateManualAccount}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-[1rem] bg-opex-dark px-4 text-sm font-black text-white shadow-[0_20px_40px_-20px_rgba(12,33,49,0.55)] transition-all hover:bg-slate-800 dark:bg-opex-teal dark:text-slate-950 dark:hover:bg-opex-teal/90"
              >
                {t('bankingDetail.addFirstManualAccount')}
              </button>
            </div>
          ) : (
            <p className="px-1 text-sm font-medium text-app-tertiary">{t('bankingDetail.noAccountsFound')}</p>
          )
        ) : (
          <div className="space-y-2">
            {sortedAccounts.map((account) => {
              const accountName = resolveConnectionAccountName(account, connection?.providerName);
              const accountRecordId = (account.accountId ?? '').trim()
                || (account.saltedgeAccountId ?? '').trim()
                || (account.saltedge_account_id ?? '').trim()
                || account.id;
              const category = toAccountCategory(account.nature).toLowerCase();
              const hasReviewStatuses = requiresReview && pendingReviewIdSet.size > 0;
              const isPendingReview = hasReviewStatuses && pendingReviewIdSet.has(accountRecordId);

              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => onEditAccount(accountRecordId)}
                  className="group w-full rounded-[1.75rem] border border-app-border bg-app-surface p-4 text-left shadow-sm transition-all hover:border-opex-teal/30 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-app-muted font-black text-xs text-app-secondary transition-colors group-hover:bg-opex-dark/5 group-hover:text-opex-dark dark:group-hover:bg-opex-teal/15 dark:group-hover:text-opex-teal">
                      {accountName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-black leading-tight text-app-primary">{accountName}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {hasReviewStatuses ? (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                              isPendingReview
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200'
                                : 'bg-opex-teal/10 text-opex-teal dark:bg-opex-teal/15 dark:text-emerald-200'
                            }`}
                          >
                            {isPendingReview
                              ? t('bankingDetail.pendingStatus')
                              : t('bankingDetail.configuredStatus')}
                          </span>
                        ) : null}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-app-tertiary">
                          {t(`bankingEdit.categoryLabel.${category}`)}
                        </span>
                        {account.isForTax && (
                          <span className="inline-flex items-center rounded-full bg-opex-teal/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-opex-teal dark:bg-opex-teal/15 dark:text-emerald-200">
                            {t('bankingDetail.taxBuffer')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-sm font-black text-app-secondary">
                        {formatBankBalance(Number(account.balance ?? 0), account.currency)}
                      </p>
                      <ChevronRight size={16} className="text-app-tertiary transition-colors group-hover:text-opex-teal" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {connection?.connectionId ? (
        <div className="rounded-[1.75rem] border border-app-border bg-app-muted/70 p-5 transition-colors duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-app-tertiary">
                {isManagedConnection ? t('bankingDetail.connectionActions') : t('bankingDetail.manualBankActions')}
              </p>
              <p className="mt-2 text-sm font-black text-app-primary">
                {isManagedConnection ? t('bankingDetail.removeConnection') : t('bankingDetail.removeManualBank')}
              </p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-app-secondary">
                {isManagedConnection
                  ? t('bankingDetail.secondaryConnectionActionDescription')
                  : t('bankingDetail.secondaryManualBankActionDescription')}
              </p>
            </div>
            {!showRemoveConfirm ? (
              <button
                type="button"
                onClick={() => onToggleRemoveConfirm(true)}
                className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-xl border border-app-border bg-app-surface px-4 text-xs font-black text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 dark:border-app-border dark:bg-app-surface dark:text-red-200 dark:hover:border-red-400/30 dark:hover:bg-red-500/10"
              >
                {isManagedConnection ? t('bankingDetail.remove') : t('bankingDetail.removeManualBankCta')}
              </button>
            ) : null}
          </div>

          {showRemoveConfirm ? (
            <div className="mt-4 space-y-4 rounded-[1.5rem] border border-red-200 bg-white px-5 py-4 dark:border-red-400/30 dark:bg-app-surface transition-colors duration-200">
              <div>
                <p className="text-sm font-black text-red-700 dark:text-red-200">{t('bankingDetail.areYouSure')}</p>
                <p className="mt-1 text-xs font-medium leading-relaxed text-app-secondary">
                  {isManagedConnection
                    ? t('bankingDetail.removeWarningCopy', { provider: connection?.providerName ?? '' })
                    : t('bankingDetail.manualRemoveWarningCopy', { provider: connection?.providerName ?? '' })}
                </p>
              </div>
              {removeConnectionError ? (
                <p className="text-sm font-bold text-red-600 dark:text-red-200">{removeConnectionError}</p>
              ) : null}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onToggleRemoveConfirm(false);
                    onClearRemoveError();
                  }}
                  disabled={isRemovingConnection}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-[1rem] border border-app-border bg-app-surface text-sm font-black text-app-secondary transition-colors hover:border-slate-300 dark:hover:border-app-tertiary/50"
                >
                  {t('bankingDetail.cancel')}
                </button>
                <button
                  type="button"
                  onClick={onRemoveConnection}
                  disabled={isRemovingConnection}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[1rem] bg-red-600 text-sm font-black text-white transition-colors hover:bg-red-700 disabled:opacity-60 dark:bg-red-500 dark:text-slate-950 dark:hover:bg-red-500"
                >
                  {isRemovingConnection ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {isManagedConnection ? t('bankingDetail.removing') : t('bankingDetail.removingManualBank')}
                    </>
                  ) : isManagedConnection ? t('bankingDetail.deleteConnection') : t('bankingDetail.deleteManualBank')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
