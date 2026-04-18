import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
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
  providerName: string;
  showRemoveConfirm: boolean;
  removeConnectionError: string | null;
  isRemovingConnection: boolean;
  onBack: () => void;
  onEditAccount: (accountId: string) => void;
  onToggleRemoveConfirm: (value: boolean) => void;
  onClearRemoveError: () => void;
  onRemoveConnection: () => void;
};

export const BankConnectionDetailView = ({
  connection,
  providerName,
  showRemoveConfirm,
  removeConnectionError,
  isRemovingConnection,
  onBack,
  onEditAccount,
  onToggleRemoveConfirm,
  onClearRemoveError,
  onRemoveConnection
}: BankConnectionDetailViewProps) => {
  const statusLabel = resolveConnectionStatusLabel(connection?.status ?? null);
  const accounts = connection?.allAccounts ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-black text-gray-500 hover:text-opex-dark transition-colors"
      >
        <ArrowLeft size={16} />
        Back to all connections
      </button>

      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-[1.25rem] bg-opex-dark text-white flex items-center justify-center font-black text-sm shadow-md flex-shrink-0">
            {providerName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-black text-gray-900 tracking-tight">{providerName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {connection?.isManagedConnection ? 'Open Banking - Salt Edge' : 'Local Account'}
              </span>
              {statusLabel && (
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${resolveConnectionStatusColor(connection?.status ?? null)}`}>
                  {statusLabel}
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-black text-gray-900">
              {formatBankBalance(connection?.totalBalance ?? 0, connection?.account.currency)}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {(connection?.accountCount ?? 0)} {(connection?.accountCount ?? 0) === 1 ? 'account' : 'accounts'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 px-1">Accounts in this connection</p>
        {accounts.length === 0 ? (
          <p className="text-sm font-medium text-slate-400 px-1">No accounts found.</p>
        ) : (
          <div className="space-y-2">
            {accounts.map((account) => {
              const accountName = resolveConnectionAccountName(account, providerName);
              const accountRecordId = (account.accountId ?? '').trim()
                || (account.saltedgeAccountId ?? '').trim()
                || (account.saltedge_account_id ?? '').trim()
                || account.id;

              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => onEditAccount(accountRecordId)}
                  className="w-full text-left rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-sm hover:border-opex-teal/30 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-500 flex items-center justify-center font-black text-xs group-hover:bg-opex-dark/5 group-hover:text-opex-dark transition-colors flex-shrink-0">
                      {accountName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 leading-tight truncate">{accountName}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {toAccountCategory(account.nature)}
                        </span>
                        {account.isForTax && (
                          <span className="inline-flex items-center rounded-full bg-opex-teal/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-opex-teal">
                            Tax Buffer
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-sm font-black text-gray-700">
                        {formatBankBalance(Number(account.balance ?? 0), account.currency)}
                      </p>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-opex-teal transition-colors" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {connection?.isManagedConnection && connection.connectionId && (
        <div className="rounded-[2rem] border border-red-100 bg-red-50/40 p-6 space-y-4">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-red-400">Danger Zone</p>
          {!showRemoveConfirm ? (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-gray-900">Remove this connection</p>
                <p className="text-xs font-medium text-slate-500 mt-1 max-w-xs">
                  All imported accounts and transactions from this Salt Edge connection will be permanently deleted.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggleRemoveConfirm(true)}
                className="flex-shrink-0 inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 text-xs font-black text-red-600 transition-colors hover:bg-red-50 whitespace-nowrap"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-red-200 bg-white px-5 py-4">
                <p className="text-sm font-black text-red-700">Are you sure?</p>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  This permanently deletes all accounts and transactions from <span className="font-black">{providerName}</span>. This cannot be undone.
                </p>
              </div>
              {removeConnectionError && (
                <p className="text-sm font-bold text-red-600">{removeConnectionError}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onToggleRemoveConfirm(false);
                    onClearRemoveError();
                  }}
                  disabled={isRemovingConnection}
                  className="flex-1 inline-flex h-10 items-center justify-center rounded-[1rem] border border-slate-200 bg-white text-sm font-black text-slate-500 transition-colors hover:border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onRemoveConnection}
                  disabled={isRemovingConnection}
                  className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-[1rem] bg-red-600 text-sm font-black text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                >
                  {isRemovingConnection ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Removing...
                    </>
                  ) : 'Delete Connection'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
