import { Building2, ChevronRight, Landmark, Loader2, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ProviderConnectionCard } from '../types';
import {
  formatBankBalance,
  resolveConnectionStatusColor,
  resolveConnectionStatusLabel
} from '../utils';

type BankConnectionListViewProps = {
  connections: Array<{
    conn: ProviderConnectionCard;
    providerName: string;
  }>;
  isConnectingOpenBank: boolean;
  openBankErrorMessage: string | null;
  onOpenConsentModal: () => void;
  onAddManualAccount: () => void;
  onOpenConnectionDetail: (connectionKey: string, providerName: string) => void;
};

export const BankConnectionListView = ({
  connections,
  isConnectingOpenBank,
  openBankErrorMessage,
  onOpenConsentModal,
  onAddManualAccount,
  onOpenConnectionDetail
}: BankConnectionListViewProps) => {
  const { t } = useTranslation('settings');
  const hasConnections = connections.length > 0;

  return (
    <div className="space-y-8 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-4">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 px-1">
          {t('bankingList.connectionActions')}
        </p>
        <div className="grid gap-3 xl:grid-cols-2">
          <button
            type="button"
            onClick={onOpenConsentModal}
            className="w-full rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 text-left transition-all hover:border-emerald-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isConnectingOpenBank}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-opex-dark text-white shadow-lg shadow-slate-900/10">
                  <Landmark size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">{t('bankingList.connectWithOpenBanking')}</p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-gray-500">
                    {isConnectingOpenBank
                      ? t('bankingList.preparingConsent')
                      : hasConnections
                        ? t('bankingList.addAnotherBank')
                        : t('bankingList.connectFirstBank')}
                  </p>
                </div>
              </div>
              {isConnectingOpenBank
                ? <Loader2 size={18} className="mt-1 shrink-0 animate-spin text-emerald-600" />
                : <ChevronRight size={18} className="mt-1 shrink-0 text-emerald-600" />}
            </div>
          </button>

          <button
            type="button"
            onClick={onAddManualAccount}
            className="w-full rounded-[2rem] border border-slate-200 bg-slate-50 p-5 text-left transition-all hover:border-slate-300 hover:bg-slate-100"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm border border-slate-200">
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">{t('bankingList.addManualAccount')}</p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-gray-500">
                    {t('bankingList.addManualDescription')}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="mt-1 shrink-0 text-slate-400" />
            </div>
          </button>
        </div>
        {openBankErrorMessage && (
          <div className="rounded-[1.5rem] border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {openBankErrorMessage}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
            {t('bankingList.currentConnections')}
          </p>
          <p className="text-xs font-bold text-slate-400">
            {t('bankingList.sources', { count: connections.length })}
          </p>
        </div>
        {connections.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-gray-200 bg-gray-50/70 p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-gray-200">
              <Building2 size={22} className="text-gray-400" />
            </div>
            <p className="mt-4 text-sm font-black text-gray-700">{t('bankingList.noSourcesTitle')}</p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-gray-500">
              {t('bankingList.noSourcesDescription')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {connections.map(({ conn, providerName }) => {
              const icon = providerName.slice(0, 2).toUpperCase();
              const statusLabel = resolveConnectionStatusLabel(conn.status);

              return (
                <button
                  key={conn.key}
                  type="button"
                  onClick={() => onOpenConnectionDetail(conn.key, providerName)}
                  className="w-full text-left rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-sm hover:border-opex-teal/30 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-opex-dark text-white flex items-center justify-center font-black text-sm shadow-md flex-shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-gray-900 leading-tight">{providerName}</p>
                        {statusLabel && (
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${resolveConnectionStatusColor(conn.status)}`}>
                            {statusLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {conn.isManagedConnection ? t('bankingList.liveSource') : t('bankingList.localSource')}
                        {' - '}
                        {t('bankingList.account', { count: conn.accountCount })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-sm font-black text-gray-600 hidden sm:block">
                        {formatBankBalance(conn.totalBalance, conn.account.currency)}
                      </p>
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-opex-teal transition-colors" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
