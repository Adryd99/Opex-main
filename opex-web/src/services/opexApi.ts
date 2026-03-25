import {
  AggregatedBalanceRecord,
  BankAccountRecord,
  PaginatedResponse,
  TaxRecord,
  TaxBufferActivityItem,
  TaxBufferDashboardResponse,
  TaxBufferDeadlineItem,
  TaxBufferLiabilityItem,
  TaxBufferProviderItem,
  TimeAggregatedPoint,
  TimeAggregatedRecord,
  TransactionRecord,
  UserProfile
} from '../models/types';

const runtimeEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const API_BASE_URL = runtimeEnv?.VITE_API_BASE_URL ?? '';
const API_ORIGIN = runtimeEnv?.VITE_API_ORIGIN ?? 'http://localhost:8080';

interface UserProfilePatchPayload {
  email: string;
  firstName: string;
  lastName: string;
  customerId: string | null;
  connectionId: string | null;
  dob: string | null;
  answer1: string | null;
  answer2: string | null;
  answer3: string | null;
  answer4: string | null;
  answer5: string | null;
}

interface LocalBankAccountPayload {
  balance: number;
  institutionName: string;
  currency: string;
  isForTax: boolean;
  nature: string;
}

interface LocalBankAccountUpdatePayload extends Partial<LocalBankAccountPayload> {
  connectionId?: string | null;
  country?: string | null;
  isSaltedge?: boolean;
}

interface LocalTransactionPayload {
  bankAccountId: string;
  amount: number;
  bookingDate: string;
  category: string;
  description: string;
  merchantName: string;
  status: string;
  type: string;
}

interface LocalTaxPayload {
  name: string;
  deadline: string;
  amount: number;
  currency: string;
  status: string;
}

interface TaxBufferDashboardQuery {
  connectionId?: string;
  year?: number;
  deadlinesLimit?: number;
  activityLimit?: number;
}

type AggregatedBalanceResponse = {
  connectionId?: string;
  totalBalance?: number | string | null;
  totalIncome?: number | string | null;
  totalExpenses?: number | string | null;
};

type TimeAggregatedResponse = {
  byMonth?: unknown;
  byQuarter?: unknown;
  byYear?: unknown;
};

type TaxBufferDashboardRaw = {
  selectedConnectionId?: unknown;
  year?: unknown;
  currency?: unknown;
  summary?: Record<string, unknown>;
  incomeSocial?: Record<string, unknown>;
  vat?: Record<string, unknown>;
  liabilitySplit?: unknown;
  deadlines?: unknown;
  activity?: unknown;
  providers?: unknown;
  safeMode?: Record<string, unknown>;
};

type BankIntegrationResponse = {
  url?: string;
  redirectUrl?: string;
  authorizationUrl?: string;
  data?: {
    url?: string;
    redirectUrl?: string;
    authorizationUrl?: string;
  };
  [key: string]: unknown;
} | string;

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const tokenCandidates = [
    window.localStorage.getItem('opex_access_token'),
    window.localStorage.getItem('access_token'),
    window.sessionStorage.getItem('opex_access_token'),
    window.sessionStorage.getItem('access_token')
  ];

  return tokenCandidates.find((value) => Boolean(value)) ?? null;
};

const buildQuery = (query: Record<string, string | number | undefined>): string => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

const parseMaybeJson = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  return requestWithBase<T>(API_BASE_URL, path, init);
};

const joinBaseAndPath = (baseUrl: string, path: string): string => {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const toSameOriginIfApiOrigin = (url: string): string => {
  const browserOrigin = typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin;
  const target = new URL(url, browserOrigin);
  const apiOrigin = new URL(API_ORIGIN);
  if (target.origin !== apiOrigin.origin) {
    return target.origin === browserOrigin
      ? `${target.pathname}${target.search}${target.hash}`
      : target.toString();
  }

  return `${target.pathname}${target.search}${target.hash}`;
};

const requestWithBase = async <T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers);
  const token = getStoredToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init?.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const requestUrl = toSameOriginIfApiOrigin(joinBaseAndPath(baseUrl, path));
  console.log(requestUrl);
  const response = await fetch(requestUrl, {
    ...init,
    headers,
    credentials: 'include'
  });

  if (!response.ok) {
    const message = await parseMaybeJson<string>(response);
    throw new Error(typeof message === 'string' ? message : `Request failed with status ${response.status}`);
  }

  return parseMaybeJson<T>(response);
};

const normalizePage = <T>(payload: unknown): PaginatedResponse<T> => {
  if (Array.isArray(payload)) {
    return { content: payload as T[] };
  }

  if (payload && typeof payload === 'object' && Array.isArray((payload as { content?: unknown }).content)) {
    const pagePayload = payload as PaginatedResponse<T>;
    return {
      ...pagePayload,
      content: pagePayload.content ?? []
    };
  }

  return { content: [] };
};

const toNumber = (value: number | string | null | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const findStringCandidate = (item: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

const findNumberCandidate = (item: Record<string, unknown>, keys: string[]): number => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'number' || typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
};

const normalizeTimeAggregationList = (payload: unknown, fallbackPrefix: string): TimeAggregatedPoint[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item, index) => {
      const keyCandidate = findStringCandidate(item, [
        'key',
        'period',
        'periodKey',
        'month',
        'quarter',
        'year',
        'label'
      ]);
      const labelCandidate = findStringCandidate(item, [
        'label',
        'periodLabel',
        'monthLabel',
        'quarterLabel',
        'yearLabel',
        'month',
        'quarter',
        'year',
        'period'
      ]);

      const fallbackKey = `${fallbackPrefix}-${index + 1}`;
      const key = keyCandidate ?? fallbackKey;
      const label = labelCandidate ?? key;

      return {
        key,
        label,
        connectionId: findStringCandidate(item, ['connectionId']),
        income: findNumberCandidate(item, ['income', 'totalIncome', 'incomes']),
        expenses: findNumberCandidate(item, ['expenses', 'totalExpenses', 'expense'])
      };
    });
};

const normalizeTimeAggregatedBalances = (payload: unknown): TimeAggregatedRecord => {
  const response = (payload && typeof payload === 'object' ? payload : {}) as TimeAggregatedResponse;
  return {
    byMonth: normalizeTimeAggregationList(response.byMonth, 'month'),
    byQuarter: normalizeTimeAggregationList(response.byQuarter, 'quarter'),
    byYear: normalizeTimeAggregationList(response.byYear, 'year')
  };
};

const toStringValue = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const toStringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const normalizeTaxBufferProviders = (payload: unknown): TaxBufferProviderItem[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      connectionId: toStringValue(item.connectionId),
      providerName: toStringValue(item.providerName),
      status: toStringValue(item.status)
    }))
    .filter((item) => item.connectionId.length > 0);
};

const normalizeTaxBufferLiability = (payload: unknown): TaxBufferLiabilityItem[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      label: toStringValue(item.label),
      amount: toNumber(item.amount as number | string | null | undefined),
      percentage: toNumber(item.percentage as number | string | null | undefined)
    }))
    .filter((item) => item.label.length > 0);
};

const normalizeTaxBufferDeadlines = (payload: unknown): TaxBufferDeadlineItem[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      id: toStringValue(item.id),
      title: toStringValue(item.title),
      dueDate: toStringValue(item.dueDate),
      status: toStringValue(item.status),
      amount: toNumber(item.amount as number | string | null | undefined),
      currency: toStringValue(item.currency, 'EUR')
    }))
    .filter((item) => item.id.length > 0 || item.title.length > 0);
};

const normalizeTaxBufferActivity = (payload: unknown): TaxBufferActivityItem[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      id: toStringValue(item.id),
      title: toStringValue(item.title),
      date: toStringValue(item.date),
      amount: toNumber(item.amount as number | string | null | undefined),
      direction: toStringValue(item.direction)
    }))
    .filter((item) => item.id.length > 0 || item.title.length > 0);
};

const normalizeTaxBufferDashboard = (payload: unknown): TaxBufferDashboardResponse => {
  const raw = (payload && typeof payload === 'object' ? payload : {}) as TaxBufferDashboardRaw;
  const summary = raw.summary ?? {};
  const incomeSocial = raw.incomeSocial ?? {};
  const vat = raw.vat ?? {};
  const safeMode = raw.safeMode ?? {};

  return {
    selectedConnectionId: toStringOrNull(raw.selectedConnectionId),
    year: toNumber(raw.year as number | string | null | undefined),
    currency: toStringValue(raw.currency, 'EUR'),
    summary: {
      shouldSetAside: toNumber(summary.shouldSetAside as number | string | null | undefined),
      alreadySaved: toNumber(summary.alreadySaved as number | string | null | undefined),
      missing: toNumber(summary.missing as number | string | null | undefined),
      completionPercentage: toNumber(summary.completionPercentage as number | string | null | undefined),
      weeklyTarget: toNumber(summary.weeklyTarget as number | string | null | undefined),
      targetDate: toStringOrNull(summary.targetDate)
    },
    incomeSocial: {
      taxableIncome: toNumber(incomeSocial.taxableIncome as number | string | null | undefined),
      incomeTax: toNumber(incomeSocial.incomeTax as number | string | null | undefined),
      socialContributions: toNumber(incomeSocial.socialContributions as number | string | null | undefined),
      subtotal: toNumber(incomeSocial.subtotal as number | string | null | undefined)
    },
    vat: {
      regime: toStringValue(vat.regime),
      rate: toNumber(vat.rate as number | string | null | undefined),
      vatLiability: toNumber(vat.vatLiability as number | string | null | undefined)
    },
    liabilitySplit: normalizeTaxBufferLiability(raw.liabilitySplit),
    deadlines: normalizeTaxBufferDeadlines(raw.deadlines),
    activity: normalizeTaxBufferActivity(raw.activity),
    providers: normalizeTaxBufferProviders(raw.providers),
    safeMode: {
      compliant: Boolean(safeMode.compliant),
      message: toStringValue(safeMode.message),
      recommendation: toStringValue(safeMode.recommendation)
    }
  };
};

const normalizeAggregatedBalances = (payload: unknown): AggregatedBalanceRecord[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter((item): item is AggregatedBalanceResponse => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      connectionId: String(item.connectionId ?? ''),
      totalBalance: toNumber(item.totalBalance),
      totalIncome: toNumber(item.totalIncome),
      totalExpenses: toNumber(item.totalExpenses)
    }))
    .filter((item) => item.connectionId.length > 0);
};

const firstNonEmptyString = (...values: Array<unknown>): string | null => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

const resolveUrlAgainstApiBase = (value: string): string => {
  try {
    return new URL(value).toString();
  } catch {
    return new URL(value, API_ORIGIN).toString();
  }
};

export const extractBankPopupUrl = (payload: BankIntegrationResponse): string | null => {
  const rawUrl = typeof payload === 'string'
    ? payload
    : firstNonEmptyString(
    payload.url,
    payload.redirectUrl,
    payload.authorizationUrl,
    payload.data?.url,
    payload.data?.redirectUrl,
    payload.data?.authorizationUrl
  );

  if (!rawUrl) {
    return null;
  }

  return resolveUrlAgainstApiBase(rawUrl);
};

export const toUserProfilePatchPayload = (profile: UserProfile): UserProfilePatchPayload => {
  const nameParts = profile.name.trim().split(/\s+/).filter(Boolean);
  const firstName = profile.firstName ?? nameParts[0] ?? '';
  const lastName = profile.lastName ?? (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

  return {
    email: profile.email,
    firstName,
    lastName,
    customerId: profile.customerId ?? null,
    connectionId: profile.connectionId ?? null,
    dob: profile.dob ?? null,
    answer1: profile.answer1 ?? null,
    answer2: profile.answer2 ?? null,
    answer3: profile.answer3 ?? null,
    answer4: profile.answer4 ?? null,
    answer5: profile.answer5 ?? null
  };
};

export const opexApi = {
  syncUser: () => request<void>('/api/users/sync', { method: 'POST' }),

  patchUserProfile: (payload: UserProfilePatchPayload) =>
    request<UserProfilePatchPayload>('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  deleteUserProfile: () => request<void>('/api/users/profile', { method: 'DELETE' }),

  getMyBankAccounts: async (page = 0, size = 20) =>
    normalizePage<BankAccountRecord>(
      await request<unknown>(`/api/bank-accounts/my-accounts${buildQuery({ page, size })}`)
    ),

  getMyTransactions: async (page = 0, size = 50) =>
    normalizePage<TransactionRecord>(
      await request<unknown>(`/api/transactions/my-transactions${buildQuery({ page, size })}`)
    ),

  getMyTaxes: async (page = 0, size = 20) =>
    normalizePage<TaxRecord>(await request<unknown>(`/api/taxes/my-taxes${buildQuery({ page, size })}`)),

  getAggregatedBalances: async () =>
    normalizeAggregatedBalances(await request<unknown>('/api/transactions/aggregated')),

  getTimeAggregatedBalances: async () =>
    normalizeTimeAggregatedBalances(await request<unknown>('/api/transactions/aggregated/time')),

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

  createLocalTransaction: (payload: LocalTransactionPayload) =>
    request<TransactionRecord>('/api/transactions/local', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateLocalTransaction: (transactionId: string, payload: Partial<LocalTransactionPayload>) =>
    request<TransactionRecord>(`/api/transactions/local/${transactionId}`, {
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
    }),

  bankIntegrationConnect: () =>
    request<BankIntegrationResponse>('/api/bank-integration/connect', { method: 'POST' }),

  bankIntegrationSync: () =>
    request<BankIntegrationResponse>('/api/bank-integration/sync', { method: 'POST' })
};
