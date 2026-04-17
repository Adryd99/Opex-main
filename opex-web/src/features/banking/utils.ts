import { BankAccountRecord, TaxBufferProviderItem } from '../../shared/types';
import { AccountCategory, ProviderConnectionCard, ProviderConnectionGroup } from './types';

export const ACCOUNT_CATEGORY_OPTIONS: AccountCategory[] = ['Personal', 'Business', 'Savings'];

export const ACCOUNT_CATEGORY_TO_NATURE: Record<AccountCategory, string> = {
  Personal: 'personal',
  Business: 'business',
  Savings: 'savings'
};

export const toAccountCategory = (nature?: string | null): AccountCategory => {
  const normalized = (nature ?? '').trim().toLowerCase();
  if (normalized === 'business') {
    return 'Business';
  }
  if (normalized === 'savings') {
    return 'Savings';
  }
  return 'Personal';
};

export const resolveConnectionAccountName = (
  account: Pick<BankAccountRecord, 'institutionName'> | null | undefined,
  providerName?: string
): string => {
  return (account?.institutionName ?? '').trim() || (providerName ?? '').trim();
};

export const resolveConnectionRecordId = (account: BankAccountRecord | null | undefined): string => {
  if (!account) {
    return '';
  }

  const accountId = (account.accountId ?? '').trim();
  if (accountId.length > 0) {
    return accountId;
  }

  const saltedgeAccountId = (account.saltedgeAccountId ?? '').trim();
  if (saltedgeAccountId.length > 0) {
    return saltedgeAccountId;
  }

  const saltedgeAccountIdSnake = (account.saltedge_account_id ?? '').trim();
  if (saltedgeAccountIdSnake.length > 0) {
    return saltedgeAccountIdSnake;
  }

  return (account.id ?? '').trim();
};

export const groupProviderConnections = (
  bankAccounts: BankAccountRecord[],
  taxBufferProviders: TaxBufferProviderItem[] = []
): ProviderConnectionGroup[] => {
  const providerByConnectionId = new Map<string, string>();
  const providerStatusByConnectionId = new Map<string, string>();

  taxBufferProviders.forEach((provider) => {
    const connectionId = (provider.connectionId ?? '').trim();
    if (!connectionId) {
      return;
    }

    const providerName = (provider.providerName ?? '').trim();
    if (providerName) {
      providerByConnectionId.set(connectionId, providerName);
    }

    const status = (provider.status ?? '').trim();
    if (status) {
      providerStatusByConnectionId.set(connectionId, status);
    }
  });

  const groups = new Map<string, Map<string, BankAccountRecord[]>>();

  bankAccounts.forEach((account) => {
    const connectionId = (account.connectionId ?? '').trim();
    const providerName = (
      (connectionId ? providerByConnectionId.get(connectionId) : undefined)
      || (account.institutionName ?? '').trim()
      || 'Unknown Provider'
    );

    const groupKey = connectionId
      ? `connection:${connectionId}`
      : `local:${resolveConnectionRecordId(account) || account.id || providerName}`;

    if (!groups.has(providerName)) {
      groups.set(providerName, new Map<string, BankAccountRecord[]>());
    }

    const providerGroups = groups.get(providerName);
    if (!providerGroups?.has(groupKey)) {
      providerGroups?.set(groupKey, []);
    }

    providerGroups?.get(groupKey)?.push(account);
  });

  return Array.from(groups.entries())
    .map(([providerName, connectionGroups]) => ({
      providerName,
      connections: Array.from(connectionGroups.entries())
        .map<ProviderConnectionCard | null>(([groupKey, accounts]) => {
          const sortedAccounts = [...accounts].sort((left, right) =>
            resolveConnectionAccountName(left, providerName).localeCompare(
              resolveConnectionAccountName(right, providerName)
            )
          );
          const representativeAccount = sortedAccounts[0];
          if (!representativeAccount) {
            return null;
          }

          const normalizedConnectionId = (representativeAccount.connectionId ?? '').trim();

          return {
            key: groupKey,
            account: representativeAccount,
            allAccounts: sortedAccounts,
            accountCount: sortedAccounts.length,
            totalBalance: sortedAccounts.reduce((sum, item) => sum + Number(item.balance ?? 0), 0),
            connectionId: normalizedConnectionId || null,
            status: normalizedConnectionId ? (providerStatusByConnectionId.get(normalizedConnectionId) ?? null) : null,
            isManagedConnection: Boolean(normalizedConnectionId) && sortedAccounts.some((item) => item.isSaltedge)
          };
        })
        .filter((item): item is ProviderConnectionCard => item !== null)
        .sort((left, right) =>
          resolveConnectionAccountName(left.account, providerName).localeCompare(
            resolveConnectionAccountName(right.account, providerName)
          )
        )
    }))
    .sort((left, right) => left.providerName.localeCompare(right.providerName));
};

export const formatBankBalance = (amount: number, currency?: string): string =>
  new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: currency || 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);

export const resolveConnectionStatusLabel = (status: string | null): string | null => {
  const normalized = (status ?? '').trim();
  return normalized
    ? normalized.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
    : null;
};

export const resolveConnectionStatusColor = (status: string | null): string => {
  const normalized = (status ?? '').trim().toLowerCase();
  if (normalized === 'active') {
    return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  }
  if (normalized === 'inactive' || normalized === 'disabled') {
    return 'bg-gray-100 text-gray-500 border-gray-200';
  }
  if (normalized.includes('error') || normalized.includes('failed')) {
    return 'bg-red-50 text-red-600 border-red-100';
  }
  if (normalized.includes('expir') || normalized.includes('consent')) {
    return 'bg-amber-50 text-amber-600 border-amber-100';
  }
  return 'bg-slate-100 text-slate-500 border-slate-200';
};
