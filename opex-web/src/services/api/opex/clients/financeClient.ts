import {
  AggregatedBalanceRecord,
  BankAccountRecord,
  ForecastResponse,
  TaxRecord
} from '../../../../shared/types';
import { buildQuery, request } from '../http';
import {
  normalizeAggregatedBalances,
  normalizeBankAccountsPage,
  normalizeForecast,
  normalizePageResponse,
  normalizeTaxBufferDashboard,
  normalizeTaxBufferProviders,
  normalizeTimeAggregatedBalances,
  normalizeTransactionsPage
} from '../normalizers/finance';
import {
  LocalBankAccountPayload,
  LocalBankAccountUpdatePayload,
  LocalTaxPayload,
  LocalTransactionPayload,
  SaltedgeBankAccountUpdatePayload,
  TaxBufferDashboardQuery
} from '../types';

const getMyTransactionsPage = async (page = 0, size = 50) =>
  normalizeTransactionsPage(
    await request<unknown>(`/api/transactions/my-transactions${buildQuery({ page, size })}`)
  );

export const financeClient = {
  getMyBankAccounts: async (page = 0, size = 20) =>
    normalizeBankAccountsPage(
      await request<unknown>(`/api/bank-accounts/my-accounts${buildQuery({ page, size })}`)
    ),

  getMyTransactions: getMyTransactionsPage,

  getAllMyTransactions: async (size = 250) => {
    const firstPage = await getMyTransactionsPage(0, size);
    const totalPages = Number(firstPage.totalPages ?? 1);

    if (!Number.isFinite(totalPages) || totalPages <= 1) {
      return firstPage.content;
    }

    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => getMyTransactionsPage(index + 1, size))
    );

    const allTransactions = [firstPage, ...remainingPages].flatMap((pageResult) => pageResult.content);
    const dedupedTransactions = new Map<string, (typeof allTransactions)[number]>();
    allTransactions.forEach((transaction) => {
      dedupedTransactions.set(transaction.id, transaction);
    });

    return Array.from(dedupedTransactions.values());
  },

  getMyTaxes: async (page = 0, size = 20) =>
    normalizePageResponse<TaxRecord>(await request<unknown>(`/api/taxes/my-taxes${buildQuery({ page, size })}`)),

  getAggregatedBalances: async (): Promise<AggregatedBalanceRecord[]> =>
    normalizeAggregatedBalances(await request<unknown>('/api/transactions/aggregated')),

  getTimeAggregatedBalances: async () =>
    normalizeTimeAggregatedBalances(await request<unknown>('/api/transactions/aggregated/time')),

  getForecast: async (months = 3): Promise<ForecastResponse> =>
    normalizeForecast(await request<unknown>(`/api/transactions/forecast?months=${months}`)),

  getTaxBufferProviders: async () =>
    normalizeTaxBufferProviders(await request<unknown>('/api/taxes/buffer/providers')),

  getTaxBufferDashboard: async (query: TaxBufferDashboardQuery = {}) =>
    normalizeTaxBufferDashboard(
      await request<unknown>(
        `/api/taxes/buffer/dashboard${buildQuery({
          connectionId: query.connectionId,
          year: query.year,
          deadlinesLimit: query.deadlinesLimit,
          activityLimit: query.activityLimit
        })}`
      )
    ),

  createLocalBankAccount: (payload: LocalBankAccountPayload) =>
    request<BankAccountRecord>('/api/bank-accounts/local', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateLocalBankAccount: (bankAccountId: string, payload: LocalBankAccountUpdatePayload) =>
    request<BankAccountRecord>(`/api/bank-accounts/local/${bankAccountId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  updateSaltedgeBankAccount: (bankAccountId: string, payload: SaltedgeBankAccountUpdatePayload) =>
    request<BankAccountRecord>(`/api/bank-accounts/saltedge/${bankAccountId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  createLocalTransaction: (payload: LocalTransactionPayload) =>
    request('/api/transactions/local', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateLocalTransaction: (transactionId: string, payload: Partial<LocalTransactionPayload>) =>
    request(`/api/transactions/local/${transactionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  deleteLocalTransaction: (transactionId: string) =>
    request<void>(`/api/transactions/local/${transactionId}`, {
      method: 'DELETE'
    }),

  createLocalTax: (payload: LocalTaxPayload) =>
    request<TaxRecord>('/api/taxes/local', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateLocalTax: (taxId: string, payload: Partial<LocalTaxPayload>) =>
    request<TaxRecord>(`/api/taxes/local/${taxId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  deleteLocalTax: (taxId: string) =>
    request<void>(`/api/taxes/local/${taxId}`, {
      method: 'DELETE'
    })
};
