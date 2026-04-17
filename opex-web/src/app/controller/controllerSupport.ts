import {
  BankAccountRecord,
  TaxBufferProviderItem,
  UserProfile
} from '../../shared/types';

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Opex User',
  email: '',
  residence: 'Netherlands (NL)',
  vatFrequency: 'Quarterly',
  logo: null,
  gdprAccepted: false,
  fiscalResidence: null,
  taxRegime: null,
  activityType: null,
  openBankingConsentScopes: []
};

export type BankSyncStage = 'idle' | 'opening_widget' | 'waiting_success_redirect' | 'syncing_success';

export const BANK_SYNC_COMPLETED_EVENT_KEY = 'opex_bank_sync_completed_at';
export const BANK_PROVIDERS_KEY = 'opex_bank_providers';
export const BANK_PROVIDERS_UPDATED_EVENT = 'opex:bank-providers-updated';
export const SELECTED_PROVIDER_KEY = 'opex_selected_provider_name';
export const PROVIDER_SELECTION_UPDATED_EVENT = 'opex:provider-selection-updated';

export const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unexpected error while processing the request.';

export const normalizeText = (value: string | null | undefined): string => (value ?? '').trim();

export const buildProviderMap = (providers: TaxBufferProviderItem[]): Map<string, string> => {
  const providerMap = new Map<string, string>();
  providers.forEach((provider) => {
    const connectionId = normalizeText(provider.connectionId);
    const providerName = normalizeText(provider.providerName);
    if (connectionId.length > 0 && providerName.length > 0) {
      providerMap.set(connectionId, providerName);
    }
  });
  return providerMap;
};

export const resolveAccountProviderName = (
  account: BankAccountRecord,
  providerByConnectionId: Map<string, string>
): string => {
  const connectionId = normalizeText(account.connectionId);
  if (connectionId.length > 0) {
    const providerName = providerByConnectionId.get(connectionId);
    if (providerName) {
      return providerName;
    }
  }
  return normalizeText(account.institutionName);
};

export const toConnectionIcon = (value: string): string => {
  const sanitized = value.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  if (!sanitized) {
    return 'BA';
  }

  const parts = sanitized.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return sanitized.slice(0, 2).toUpperCase();
};

export const resolveBankAccountId = (account: BankAccountRecord | null | undefined): string | null => {
  if (!account) {
    return null;
  }

  const accountId = normalizeText(account.accountId);
  if (accountId.length > 0) {
    return accountId;
  }

  const saltedgeAccountId = normalizeText(account.saltedgeAccountId);
  if (saltedgeAccountId.length > 0) {
    return saltedgeAccountId;
  }

  const saltedgeAccountIdSnake = normalizeText(account.saltedge_account_id);
  if (saltedgeAccountIdSnake.length > 0) {
    return saltedgeAccountIdSnake;
  }

  const fallbackId = normalizeText(account.id);
  return fallbackId.length > 0 ? fallbackId : null;
};

export const getSelectedProviderFromStorage = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = window.localStorage.getItem(SELECTED_PROVIDER_KEY);
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const resolveSelectedConnectionId = (
  providerName: string | null,
  accounts: BankAccountRecord[],
  providers: TaxBufferProviderItem[]
): string | undefined => {
  if (!providerName) {
    return undefined;
  }

  const selectedProvider = normalizeText(providerName);
  const providerByConnectionId = buildProviderMap(providers);

  const accountConnectionId = accounts
    .find((account) => {
      const connectionId = normalizeText(account.connectionId);
      if (connectionId.length === 0) {
        return false;
      }
      return resolveAccountProviderName(account, providerByConnectionId) === selectedProvider;
    })
    ?.connectionId;

  if (accountConnectionId && accountConnectionId.trim().length > 0) {
    return accountConnectionId;
  }

  const providerConnectionId = providers
    .find(
      (provider) =>
        normalizeText(provider.providerName) === selectedProvider &&
        normalizeText(provider.connectionId).length > 0
    )
    ?.connectionId;

  return providerConnectionId && providerConnectionId.trim().length > 0
    ? providerConnectionId
    : undefined;
};

export const formatPeriodLabel = (date: Date, period: 'month' | 'quarter' | 'year'): string => {
  if (period === 'month') {
    return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
  }
  if (period === 'quarter') {
    return `Q${Math.floor(date.getMonth() / 3) + 1}`;
  }
  return String(date.getFullYear());
};

export const buildPeriodKey = (date: Date, period: 'month' | 'quarter' | 'year'): string => {
  const year = date.getFullYear();
  if (period === 'month') {
    return `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  if (period === 'quarter') {
    return `${year}-Q${Math.floor(date.getMonth() / 3) + 1}`;
  }
  return String(year);
};
