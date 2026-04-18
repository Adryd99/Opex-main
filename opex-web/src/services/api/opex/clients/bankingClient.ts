import type { OpenBankingConsentPayload } from '../../../../shared/types/legal';
import { request } from '../http';
import { BankIntegrationResponse } from '../types';

export const bankingClient = {
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
    request<BankIntegrationResponse>('/api/bank-integration/sync', { method: 'POST' })
};
