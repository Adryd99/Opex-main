import { Building2, ChevronRight, Loader2 } from 'lucide-react';
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
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-3">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 px-1">
          Add Connection
        </p>
        <button
          type="button"
          onClick={onOpenConsentModal}
          className="w-full bg-opex-teal/5 p-5 rounded-[2rem] border border-opex-teal/20 flex items-center justify-between gap-4 hover:bg-opex-teal/10 transition-all group"
          disabled={isConnectingOpenBank}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-opex-teal text-white flex items-center justify-center font-black text-sm shadow-lg group-hover:scale-105 transition-transform flex-shrink-0">
              OB
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-gray-900">New Open Banking Connection</p>
              <p className="text-xs text-gray-500 font-medium">
                {isConnectingOpenBank ? 'Preparing connection...' : 'Connect via Salt Edge authorization.'}
              </p>
            </div>
          </div>
          {isConnectingOpenBank
            ? <Loader2 size={18} className="text-opex-teal animate-spin flex-shrink-0" />
            : <ChevronRight size={18} className="text-opex-teal flex-shrink-0" />}
        </button>
        {openBankErrorMessage && (
          <p className="text-sm text-red-600 font-medium px-1">{openBankErrorMessage}</p>
        )}
        <button
          type="button"
          onClick={onAddManualAccount}
          className="w-full bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200 text-left hover:bg-gray-100 transition-all"
        >
          <p className="text-sm font-black text-gray-700">Add Manual Account</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Create a local account without Open Banking.</p>
        </button>
      </div>

      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 mb-3 px-1">
          Connected Accounts
        </p>
        {connections.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
              <Building2 size={22} className="text-gray-400" />
            </div>
            <p className="mt-4 text-sm font-black text-gray-500">No connections yet</p>
            <p className="text-xs font-medium text-gray-400 mt-1">
              Add an open banking connection or create a manual account above.
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
                        {conn.isManagedConnection ? 'Open Banking - Salt Edge' : 'Local Account'}
                        {' - '}
                        {conn.accountCount} {conn.accountCount === 1 ? 'account' : 'accounts'}
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
