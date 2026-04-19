import {
  type BankAccountRecord,
  type TimeAggregatedPoint,
  type TimeAggregatedRecord,
  type TransactionRecord
} from '../../shared/types';
import {
  buildPeriodKey,
  formatPeriodLabel
} from './timeAggregation';
import {
  resolveAccountProviderName,
  resolveBankAccountId
} from './providerSupport';

type ProviderMatcher = (account: BankAccountRecord, providerName: string) => boolean;

export const buildAllowedConnectionIdsForSelectedProvider = (
  bankAccounts: BankAccountRecord[],
  selectedProviderName: string | null,
  doesAccountMatchSelectedProvider: ProviderMatcher
): Set<string> | null => {
  if (!selectedProviderName) {
    return null;
  }

  return new Set(
    bankAccounts
      .filter((account) => doesAccountMatchSelectedProvider(account, selectedProviderName))
      .map((account) => account.connectionId ?? '')
      .filter((connectionId) => connectionId.length > 0)
  );
};

export const buildVisibleTransactions = (
  bankAccounts: BankAccountRecord[],
  transactions: TransactionRecord[],
  selectedProviderName: string | null,
  allowedConnectionIdsForSelectedProvider: Set<string> | null,
  doesAccountMatchSelectedProvider: ProviderMatcher
): TransactionRecord[] => {
  if (!selectedProviderName) {
    return transactions;
  }

  const accountsById = new Map(
    bankAccounts.flatMap((account) => {
      const resolvedId = resolveBankAccountId(account);
      if (!resolvedId) {
        return [];
      }
      return [[resolvedId, account] as const];
    })
  );
  const allowedConnections = allowedConnectionIdsForSelectedProvider ?? new Set<string>();

  return transactions.filter((transaction) => {
    const txConnectionId = (transaction.connectionId ?? '').trim();
    if (txConnectionId.length > 0) {
      return allowedConnections.has(txConnectionId);
    }

    const relatedAccount = transaction.bankAccountId
      ? accountsById.get(transaction.bankAccountId)
      : undefined;
    if (!relatedAccount) {
      return false;
    }

    return doesAccountMatchSelectedProvider(relatedAccount, selectedProviderName);
  });
};

export const buildAggregatedSummary = (
  bankAccounts: BankAccountRecord[],
  visibleTransactions: TransactionRecord[],
  selectedProviderName: string | null,
  doesAccountMatchSelectedProvider: ProviderMatcher
) => {
  const visibleBankAccounts = selectedProviderName
    ? bankAccounts.filter((account) => doesAccountMatchSelectedProvider(account, selectedProviderName))
    : bankAccounts;

  return {
    totalBalance: visibleBankAccounts.reduce((sum, account) => sum + Number(account.balance || 0), 0),
    totalIncome: visibleTransactions.reduce((sum, transaction) => {
      const amount = Number(transaction.amount || 0);
      return amount > 0 ? sum + amount : sum;
    }, 0),
    totalExpenses: visibleTransactions.reduce((sum, transaction) => {
      const amount = Number(transaction.amount || 0);
      return amount < 0 ? sum + amount : sum;
    }, 0)
  };
};

const aggregateTransactionsByPeriod = (
  visibleTransactions: TransactionRecord[],
  period: 'month' | 'quarter' | 'year',
  language: string
): TimeAggregatedPoint[] => {
  const grouped = new Map<string, TimeAggregatedRecord['byMonth'][number]>();

  visibleTransactions.forEach((transaction) => {
    const date = new Date(transaction.bookingDate);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    const amount = Number(transaction.amount || 0);
    const key = buildPeriodKey(date, period);
    const existing = grouped.get(key);
    if (existing) {
      if (amount > 0) {
        existing.income += amount;
      } else if (amount < 0) {
        existing.expenses += amount;
      }
      return;
    }

    grouped.set(key, {
      key,
      label: formatPeriodLabel(date, period, language),
      income: amount > 0 ? amount : 0,
      expenses: amount < 0 ? amount : 0,
      connectionId: null
    });
  });

  return Array.from(grouped.entries())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([, value]) => value);
};

export const buildTimeAggregatedSummary = (
  visibleTransactions: TransactionRecord[],
  language: string
): TimeAggregatedRecord => ({
  byMonth: aggregateTransactionsByPeriod(visibleTransactions, 'month', language),
  byQuarter: aggregateTransactionsByPeriod(visibleTransactions, 'quarter', language),
  byYear: aggregateTransactionsByPeriod(visibleTransactions, 'year', language)
});

export const createProviderMatcher = (
  providerByConnectionId: Map<string, string>
): ProviderMatcher => (account, providerName) =>
  resolveAccountProviderName(account, providerByConnectionId) === providerName;
