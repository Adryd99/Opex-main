import type { BankAccountRecord, BankConnectionRecord, BankConnectionType } from '../../../../shared/types/banking';
import { API_ORIGIN } from '../http';
import { BankIntegrationResponse } from '../types';
import { normalizeBankAccount } from './finance';
import { firstNonEmptyString, toNumber, toRecord, toRecordList, toStringOrNull, toStringValue } from './support';

const resolveUrlAgainstApiBase = (value: string): string => {
  try {
    return new URL(value).toString();
  } catch {
    return new URL(value, API_ORIGIN).toString();
  }
};

export const extractBankPopupUrl = (payload: BankIntegrationResponse): string | null => {
  const rawUrl =
    typeof payload === 'string'
      ? payload
      : firstNonEmptyString(
        payload.url,
        payload.connectUrl,
        payload.redirectUrl,
        payload.authorizationUrl,
        payload.data?.url,
        payload.data?.connectUrl,
        payload.data?.redirectUrl,
        payload.data?.authorizationUrl
      );

  if (!rawUrl) {
    return null;
  }

  return resolveUrlAgainstApiBase(rawUrl);
};

const normalizeBankConnectionType = (value: unknown): BankConnectionType =>
  toStringValue(value).toUpperCase() === 'MANUAL' ? 'MANUAL' : 'SALTEDGE';

export const normalizeBankConnection = (payload: unknown): BankConnectionRecord | null => {
  const item = toRecord(payload);
  if (Object.keys(item).length === 0) {
    return null;
  }

  const accounts = toRecordList(item.accounts)
    .map((account) => normalizeBankAccount(account))
    .filter((account): account is BankAccountRecord => account !== null);

  const id = firstNonEmptyString(item.id, item.connectionId, item.connection_id);
  if (!id) {
    return null;
  }

  return {
    id,
    userId: toStringValue(item.userId ?? item.user_id),
    providerName:
      firstNonEmptyString(item.providerName, item.provider_name, accounts[0]?.institutionName) ?? 'Unknown Provider',
    type: normalizeBankConnectionType(item.type),
    externalConnectionId: toStringOrNull(item.externalConnectionId ?? item.external_connection_id),
    status: toStringOrNull(item.status),
    createdAt: toStringOrNull(item.createdAt ?? item.created_at),
    accountCount: toNumber(item.accountCount ?? item.account_count ?? accounts.length),
    totalBalance: toNumber(item.totalBalance ?? item.total_balance),
    accounts
  };
};

export const normalizeBankConnections = (payload: unknown): BankConnectionRecord[] =>
  toRecordList(payload)
    .map((item) => normalizeBankConnection(item))
    .filter((item): item is BankConnectionRecord => item !== null);
