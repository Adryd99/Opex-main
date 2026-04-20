import { Building2, ChevronRight, Landmark, Loader2, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ProviderConnectionCard } from '../types';
import {
  formatBankBalance,
  resolveConnectionStatusColor,
  resolveConnectionStatusLabel
} from '../utils';

type BankConnectionListViewProps = {
  connections: ProviderConnectionCard[];
  connectionReviewMetaByKey: Record<string, { requiresReview: boolean; pendingReviewCount: number }>;
  isConnectingOpenBank: boolean;
  openBankErrorMessage: string | null;
  onOpenConsentModal: () => void;
  onOpenManualBankCreate: () => void;
  onOpenConnectionDetail: (connectionKey: string, providerName: string) => void;
};

export const BankConnectionListView = ({
  connections,
  connectionReviewMetaByKey,
  isConnectingOpenBank,
  openBankErrorMessage,
  onOpenConsentModal,
  onOpenManualBankCreate,
  onOpenConnectionDetail
}: BankConnectionListViewProps) => {
  const { t } = useTranslation('settings');
  const hasConnections = connections.length > 0;
  const connectedBanks = connections.filter((connection) => connection.isManagedConnection);
  const manualBanks = connections.filter((connection) => !connection.isManagedConnection);

  const renderConnectionCard = (conn: ProviderConnectionCard) => {
    const icon = conn.providerName.slice(0, 2).toUpperCase();
    const statusLabel = resolveConnectionStatusLabel(conn.status);
    const reviewMeta = connectionReviewMetaByKey[conn.key] ?? {
      requiresReview: false,
      pendingReviewCount: 0
    };

    return (
      <button
        key={conn.key}
        type="button"
        onClick={() => onOpenConnectionDetail(conn.key, conn.providerName)}
        className="group w-full rounded-[1.75rem] border border-app-border bg-app-surface p-4 text-left shadow-sm transition-all hover:border-opex-teal/30 hover:shadow-md"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[1.25rem] bg-opex-dark font-black text-sm text-white shadow-md dark:bg-opex-teal dark:text-slate-950 transition-colors duration-200">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-black leading-tight text-app-primary">{conn.providerName}</p>
              {statusLabel && (
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${resolveConnectionStatusColor(conn.status)}`}>
                  {statusLabel}
                </span>
              )}
              {reviewMeta.requiresReview ? (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
                  {t('bankingList.requiresReview')}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-app-tertiary">
              {conn.isManagedConnection ? t('bankingList.liveSource') : t('bankingList.manualSource')}
              {' - '}
              {t('bankingList.account', { count: conn.accountCount })}
            </p>
            {reviewMeta.requiresReview ? (
              <p className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-200">
                {t('bankingList.reviewPendingCount', { count: reviewMeta.pendingReviewCount })}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <p className="hidden text-sm font-black text-app-secondary sm:block">
              {formatBankBalance(conn.totalBalance, conn.currency ?? undefined)}
            </p>
            <ChevronRight size={18} className="text-app-tertiary transition-colors group-hover:text-opex-teal" />
          </div>
        </div>
      </button>
    );
  };

  const renderConnectionSection = (title: string, items: ProviderConnectionCard[]) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-app-tertiary">
            {title}
          </p>
          <p className="text-xs font-bold text-app-tertiary">
            {t('bankingList.sources', { count: items.length })}
          </p>
        </div>
        <div className="space-y-2">
          {items.map((connection) => renderConnectionCard(connection))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-4">
        <p className="px-1 text-[11px] font-black uppercase tracking-[0.24em] text-app-tertiary">
          {t('bankingList.connectionActions')}
        </p>
        <div className="grid gap-3 xl:grid-cols-2">
          <button
            type="button"
            onClick={onOpenConsentModal}
            className="w-full rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 text-left transition-all hover:border-emerald-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 dark:border-emerald-400/20 dark:from-emerald-500/10 dark:via-app-surface dark:to-opex-teal/10"
            disabled={isConnectingOpenBank}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-opex-dark text-white shadow-lg shadow-slate-900/10 dark:bg-opex-teal dark:text-slate-950 transition-colors duration-200">
                  <Landmark size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-app-primary">{t('bankingList.connectWithOpenBanking')}</p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-app-secondary">
                    {isConnectingOpenBank
                      ? t('bankingList.preparingConsent')
                      : hasConnections
                        ? t('bankingList.addAnotherBank')
                        : t('bankingList.connectFirstBank')}
                  </p>
                </div>
              </div>
              {isConnectingOpenBank
                ? <Loader2 size={18} className="mt-1 shrink-0 animate-spin text-emerald-600 dark:text-emerald-300" />
                : <ChevronRight size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />}
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenManualBankCreate}
            className="w-full rounded-[2rem] border border-app-border bg-app-muted p-5 text-left transition-all hover:border-slate-300 hover:bg-slate-100 dark:hover:border-app-tertiary/50 dark:hover:bg-app-surface"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-app-border bg-app-surface text-app-secondary shadow-sm transition-colors duration-200">
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-app-primary">{t('bankingList.createManualBank')}</p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-app-secondary">
                    {t('bankingList.createManualDescription')}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="mt-1 shrink-0 text-app-tertiary" />
            </div>
          </button>
        </div>
        {openBankErrorMessage && (
          <div className="rounded-[1.5rem] border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200 transition-colors duration-200">
            {openBankErrorMessage}
          </div>
        )}
      </div>

      <div>
        {connections.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-app-border bg-app-muted/70 p-10 text-center transition-colors duration-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-app-border bg-app-surface transition-colors duration-200">
              <Building2 size={22} className="text-app-tertiary" />
            </div>
            <p className="mt-4 text-sm font-black text-app-primary">{t('bankingList.noSourcesTitle')}</p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-app-secondary">
              {t('bankingList.noSourcesDescription')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {renderConnectionSection(t('bankingList.connectedBanks'), connectedBanks)}
            {renderConnectionSection(t('bankingList.manualBanks'), manualBanks)}
          </div>
        )}
      </div>
    </div>
  );
};
