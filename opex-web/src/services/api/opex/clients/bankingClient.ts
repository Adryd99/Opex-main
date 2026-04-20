import type { BankAccountRecord, BankConnectionRecord } from '../../../../shared/types/banking';
import type { OpenBankingConsentPayload } from '../../../../shared/types/legal';
import { normalizeBankConnection, normalizeBankConnections } from '../normalizers/banking';
import { normalizeBankAccount } from '../normalizers/finance';
import { request } from '../http';
import {
  BankIntegrationResponse,
  LocalBankAccountPayload,
  LocalBankAccountUpdatePayload,
  ManualBankConnectionPayload,
  ManualBankConnectionUpdatePayload
} from '../types';

export const bankingClient = {
  getMyBankConnections: async (): Promise<BankConnectionRecord[]> =>
    normalizeBankConnections(await request<unknown>('/api/bank-connections/my-connections')),

  bankIntegrationConnect: (payload: OpenBankingConsentPayload) =>
    request<BankIntegrationResponse>('/api/bank-integration/connect', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  bankIntegrationRefreshConnection: (connectionId: string) =>
    request<BankIntegrationResponse>(
      `/api/bank-integration/connections/${encodeURIComponent(connectionId)}/refresh`,
      {
        method: 'POST'
      }
    ),

  bankIntegrationDeleteConnection: (connectionId: string) =>
    request<void>(`/api/bank-integration/connections/${encodeURIComponent(connectionId)}`, {
      method: 'DELETE'
    }),

  bankIntegrationSync: () =>
    request<BankIntegrationResponse>('/api/bank-integration/sync', { method: 'POST' }),

  createManualBankConnection: async (payload: ManualBankConnectionPayload): Promise<BankConnectionRecord> => {
    const response = await request<unknown>('/api/bank-connections/manual', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const normalized = normalizeBankConnection(response);
    if (!normalized) {
      throw new Error('Manual bank connection response could not be normalized.');
    }
    return normalized;
  },

  updateManualBankConnection: async (
    connectionId: string,
    payload: ManualBankConnectionUpdatePayload
  ): Promise<BankConnectionRecord> => {
    const response = await request<unknown>(`/api/bank-connections/manual/${encodeURIComponent(connectionId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    const normalized = normalizeBankConnection(response);
    if (!normalized) {
      throw new Error('Manual bank connection update response could not be normalized.');
    }
    return normalized;
  },

  deleteManualBankConnection: (connectionId: string) =>
    request<void>(`/api/bank-connections/manual/${encodeURIComponent(connectionId)}`, {
      method: 'DELETE'
    }),

  createManualBankAccountForConnection: async (
    connectionId: string,
    payload: LocalBankAccountPayload
  ): Promise<BankAccountRecord> => {
    const response = await request<unknown>(`/api/bank-connections/${encodeURIComponent(connectionId)}/accounts/local`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const normalized = normalizeBankAccount(response);
    if (!normalized) {
      throw new Error('Manual bank account response could not be normalized.');
    }
    return normalized;
  },

  updateManualBankAccountForConnection: async (
    connectionId: string,
    accountId: string,
    payload: LocalBankAccountUpdatePayload
  ): Promise<BankAccountRecord> => {
    const response = await request<unknown>(
      `/api/bank-connections/${encodeURIComponent(connectionId)}/accounts/local/${encodeURIComponent(accountId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }
    );
    const normalized = normalizeBankAccount(response);
    if (!normalized) {
      throw new Error('Manual bank account update response could not be normalized.');
    }
    return normalized;
  }
};
