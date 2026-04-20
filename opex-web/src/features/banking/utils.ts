import { DEFAULT_LANGUAGE } from '../../i18n/constants';
import { formatCurrencyForLanguage } from '../../i18n/formatting';
import { BankAccountRecord, BankConnectionRecord } from '../../shared/types';
import { AccountCategory, ProviderConnectionCard } from './types';

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

export const buildConnectionCards = (bankConnections: BankConnectionRecord[]): ProviderConnectionCard[] =>
  bankConnections
    .map((connection) => {
      const providerName = (connection.providerName ?? '').trim()
        || resolveConnectionAccountName(connection.accounts[0])
        || 'Unknown Provider';
      const sortedAccounts = [...connection.accounts].sort((left, right) =>
        resolveConnectionAccountName(left, providerName).localeCompare(
          resolveConnectionAccountName(right, providerName)
        )
      );

      return {
        key: connection.id,
        providerName,
        allAccounts: sortedAccounts,
        accountCount: connection.accountCount || sortedAccounts.length,
        totalBalance: Number(connection.totalBalance ?? 0),
        currency: sortedAccounts[0]?.currency ?? null,
        connectionId: connection.id,
        status: (connection.status ?? '').trim() || null,
        isManagedConnection: connection.type === 'SALTEDGE',
        connection
      };
    })
    .sort((left, right) =>
      left.providerName.localeCompare(right.providerName) || left.connectionId.localeCompare(right.connectionId)
    );

export const formatBankBalance = (
  amount: number,
  currency?: string,
  language: string = DEFAULT_LANGUAGE
): string =>
  formatCurrencyForLanguage(language, amount, currency || 'EUR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

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
