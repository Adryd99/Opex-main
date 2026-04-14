import {
  AggregatedBalanceRecord,
  BankAccountRecord,
  ForecastHistoricalPoint,
  ForecastPoint,
  ForecastResponse,
  LegalDocumentRecord,
  LegalPublicInfoRecord,
  OpenBankingConsentPayload,
  PaginatedResponse,
  RequiredLegalConsentPayload,
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
import {
  DEFAULT_LEGAL_PUBLIC_INFO,
  persistRequiredLegalConsentsLocally
} from '../legal/defaultLegalContent';

const runtimeEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const API_BASE_URL = runtimeEnv?.VITE_API_BASE_URL ?? '';
const API_ORIGIN = runtimeEnv?.VITE_API_ORIGIN ?? 'http://localhost:8080';

interface UserProfilePatchPayload {
  email: string;
  firstName: string;
  lastName: string;
  residence: string;
  vatFrequency: string;
  gdprAccepted: boolean;
  fiscalResidence: string | null;
  taxRegime: string | null;
  activityType: string | null;
  customerId: string | null;
  connectionId: string | null;
  dob: string | null;
  answer1: string | null;
  answer2: string | null;
  answer3: string | null;
  answer4: string | null;
  answer5: string | null;
  profilePicture: string | null;
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

interface SaltedgeBankAccountUpdatePayload {
  institutionName?: string;
  isForTax?: boolean;
  nature?: string;
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

type TransactionResponse = {
  id?: unknown;
  bankAccountId?: unknown;
  bank_account_id?: unknown;
  connectionId?: unknown;
  connection_id?: unknown;
  amount?: unknown;
  bookingDate?: unknown;
  booking_date?: unknown;
  category?: unknown;
  description?: unknown;
  merchantName?: unknown;
  merchant_name?: unknown;
  status?: unknown;
  type?: unknown;
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

type BackendUserProfileResponse = {
  email?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  customerId?: unknown;
  dob?: unknown;
  residence?: unknown;
  vatFrequency?: unknown;
  gdprAccepted?: unknown;
  fiscalResidence?: unknown;
  taxRegime?: unknown;
  activityType?: unknown;
  answer1?: unknown;
  answer2?: unknown;
  answer3?: unknown;
  answer4?: unknown;
  answer5?: unknown;
  privacyPolicyVersion?: unknown;
  privacyAcceptedAt?: unknown;
  termsOfServiceVersion?: unknown;
  termsAcceptedAt?: unknown;
  cookiePolicyVersion?: unknown;
  cookiePolicyAcknowledgedAt?: unknown;
  openBankingNoticeVersion?: unknown;
  openBankingNoticeAcceptedAt?: unknown;
  openBankingConsentScopes?: unknown;
  profilePicture?: unknown;
};

type LegalSectionRaw = {
  title?: unknown;
  bullets?: unknown;
};

type LegalDocumentRaw = {
  slug?: unknown;
  title?: unknown;
  version?: unknown;
  lastUpdated?: unknown;
  summary?: unknown;
  sections?: unknown;
};

type LegalPublicInfoRaw = {
  controller?: Record<string, unknown>;
  processors?: unknown;
  storageTechnologies?: unknown;
  privacyPolicy?: unknown;
  termsOfService?: unknown;
  cookiePolicy?: unknown;
  openBankingNotice?: unknown;
};

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

const normalizeForecast = (payload: unknown): ForecastResponse => {
  const raw = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;

  const toNum = (v: unknown) => (typeof v === 'number' ? v : parseFloat(String(v ?? '0')) || 0);

  const historical: ForecastHistoricalPoint[] = Array.isArray(raw.historical)
    ? raw.historical.map((h: unknown) => {
        const item = (h && typeof h === 'object' ? h : {}) as Record<string, unknown>;
        return {
          key: String(item.key ?? ''),
          label: String(item.label ?? ''),
          income: toNum(item.income),
          expenses: toNum(item.expenses),
          net: toNum(item.net)
        };
      })
    : [];

  const forecast: ForecastPoint[] = Array.isArray(raw.forecast)
    ? raw.forecast.map((f: unknown) => {
        const item = (f && typeof f === 'object' ? f : {}) as Record<string, unknown>;
        return {
          key: String(item.key ?? ''),
          label: String(item.label ?? ''),
          predictedIncome: toNum(item.predictedIncome),
          predictedExpenses: toNum(item.predictedExpenses),
          predictedNet: toNum(item.predictedNet)
        };
      })
    : [];

  const trendRaw = String(raw.trend ?? 'STABLE');
  const trend = (['GROWING', 'DECLINING', 'STABLE'] as const).find(t => t === trendRaw) ?? 'STABLE';

  return { historical, forecast, trend, monthsOfData: toNum(raw.monthsOfData) };
};

const toStringValue = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const toStringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const toStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
};

const normalizeUserProfile = (payload: unknown, fallback?: Partial<UserProfile>): UserProfile => {
  const item = (payload && typeof payload === 'object' ? payload : {}) as BackendUserProfileResponse;
  const email = toStringValue(item.email, fallback?.email ?? '');
  const firstName = toStringOrNull(item.firstName) ?? fallback?.firstName ?? null;
  const lastName = toStringOrNull(item.lastName) ?? fallback?.lastName ?? null;
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const fallbackName = (fallback?.name ?? '').trim();
  const inferredName = email.includes('@') ? email.split('@')[0] : 'Opex User';

  return {
    name: fullName || fallbackName || inferredName,
    email,
    residence: toStringValue(item.residence, fallback?.residence ?? 'Netherlands (NL)'),
    vatFrequency: toStringValue(item.vatFrequency, fallback?.vatFrequency ?? 'Quarterly'),
    logo: toStringOrNull(item.profilePicture) ?? fallback?.logo ?? null,
    gdprAccepted: toBooleanValue(item.gdprAccepted, fallback?.gdprAccepted ?? false),
    fiscalResidence: toStringOrNull(item.fiscalResidence) ?? fallback?.fiscalResidence ?? null,
    taxRegime: toStringOrNull(item.taxRegime) ?? fallback?.taxRegime ?? null,
    activityType: toStringOrNull(item.activityType) ?? fallback?.activityType ?? null,
    firstName: firstName ?? undefined,
    lastName: lastName ?? undefined,
    customerId: toStringOrNull(item.customerId) ?? fallback?.customerId ?? null,
    connectionId: fallback?.connectionId ?? null,
    dob: toStringOrNull(item.dob) ?? fallback?.dob ?? null,
    answer1: toStringOrNull(item.answer1) ?? fallback?.answer1 ?? null,
    answer2: toStringOrNull(item.answer2) ?? fallback?.answer2 ?? null,
    answer3: toStringOrNull(item.answer3) ?? fallback?.answer3 ?? null,
    answer4: toStringOrNull(item.answer4) ?? fallback?.answer4 ?? null,
    answer5: toStringOrNull(item.answer5) ?? fallback?.answer5 ?? null,
    privacyPolicyVersion: toStringOrNull(item.privacyPolicyVersion) ?? fallback?.privacyPolicyVersion ?? null,
    privacyAcceptedAt: toStringOrNull(item.privacyAcceptedAt) ?? fallback?.privacyAcceptedAt ?? null,
    termsOfServiceVersion: toStringOrNull(item.termsOfServiceVersion) ?? fallback?.termsOfServiceVersion ?? null,
    termsAcceptedAt: toStringOrNull(item.termsAcceptedAt) ?? fallback?.termsAcceptedAt ?? null,
    cookiePolicyVersion: toStringOrNull(item.cookiePolicyVersion) ?? fallback?.cookiePolicyVersion ?? null,
    cookiePolicyAcknowledgedAt: toStringOrNull(item.cookiePolicyAcknowledgedAt) ?? fallback?.cookiePolicyAcknowledgedAt ?? null,
    openBankingNoticeVersion: toStringOrNull(item.openBankingNoticeVersion) ?? fallback?.openBankingNoticeVersion ?? null,
    openBankingNoticeAcceptedAt: toStringOrNull(item.openBankingNoticeAcceptedAt) ?? fallback?.openBankingNoticeAcceptedAt ?? null,
    openBankingConsentScopes: toStringList(item.openBankingConsentScopes).length > 0
      ? toStringList(item.openBankingConsentScopes)
      : fallback?.openBankingConsentScopes ?? []
  };
};

const toBooleanValue = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }
  return fallback;
};

const normalizeBankAccount = (payload: unknown): BankAccountRecord | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const item = payload as Record<string, unknown>;
  const saltedgeAccountId = findStringCandidate(item, ['saltedge_account_id', 'saltedgeAccountId']);
  const accountId = findStringCandidate(item, ['accountId', 'bankAccountId']) ?? saltedgeAccountId ?? findStringCandidate(item, ['id']);
  const id = findStringCandidate(item, ['id', 'name', 'accountName']) ?? accountId ?? saltedgeAccountId ?? 'Unknown Account';
  const institutionName = findStringCandidate(item, ['institutionName', 'institution_name', 'providerName', 'provider_name']) ?? 'Unknown Provider';

  return {
    id,
    accountId,
    saltedgeAccountId,
    saltedge_account_id: saltedgeAccountId,
    institutionName,
    currency: findStringCandidate(item, ['currency']) ?? 'EUR',
    balance: findNumberCandidate(item, ['balance', 'currentBalance', 'amount']),
    isForTax: toBooleanValue(item.isForTax ?? item.is_for_tax),
    nature: findStringCandidate(item, ['nature', 'accountCategory', 'account_category']) ?? undefined,
    isSaltedge: toBooleanValue(item.isSaltedge ?? item.is_saltedge, Boolean(saltedgeAccountId)),
    connectionId: findStringCandidate(item, ['connectionId', 'connection_id']),
    country: findStringCandidate(item, ['country', 'countryCode', 'country_code'])
  };
};

const normalizeBankAccountsPage = (payload: unknown): PaginatedResponse<BankAccountRecord> => {
  const page = normalizePage<unknown>(payload);
  return {
    ...page,
    content: page.content
      .map((item) => normalizeBankAccount(item))
      .filter((item): item is BankAccountRecord => item !== null)
  };
};

const normalizeTransaction = (payload: unknown): TransactionRecord | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const item = payload as TransactionResponse;

  return {
    id: toStringValue(item.id),
    bankAccountId: firstNonEmptyString(item.bankAccountId, item.bank_account_id) ?? undefined,
    connectionId: toStringOrNull(firstNonEmptyString(item.connectionId, item.connection_id)),
    amount: toNumber(item.amount as number | string | null | undefined),
    bookingDate: toStringValue(item.bookingDate ?? item.booking_date),
    category: toStringValue(item.category),
    description: toStringValue(item.description),
    merchantName: toStringValue(item.merchantName ?? item.merchant_name),
    status: toStringValue(item.status),
    type: toStringValue(item.type)
  };
};

const normalizeTransactionsPage = (payload: unknown): PaginatedResponse<TransactionRecord> => {
  const page = normalizePage<unknown>(payload);
  return {
    ...page,
    content: page.content
      .map((item) => normalizeTransaction(item))
      .filter((item): item is TransactionRecord => item !== null && item.id.length > 0)
  };
};

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
      currency: toStringValue(item.currency, 'EUR'),
      category: toStringOrNull(item.category) ?? undefined,
      periodLabel: toStringOrNull(item.periodLabel),
      description: toStringOrNull(item.description),
      systemGenerated: Boolean(item.systemGenerated)
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
      safeToSpend: toNumber(summary.safeToSpend as number | string | null | undefined),
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
      vatLiability: toNumber(vat.vatLiability as number | string | null | undefined),
      warningMessage: toStringOrNull(vat.warningMessage)
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

const normalizeLegalDocument = (payload: unknown, fallbackSlug: string, fallbackTitle: string): LegalDocumentRecord => {
  const item = (payload && typeof payload === 'object' ? payload : {}) as LegalDocumentRaw;

  return {
    slug: toStringValue(item.slug, fallbackSlug),
    title: toStringValue(item.title, fallbackTitle),
    version: toStringValue(item.version),
    lastUpdated: toStringValue(item.lastUpdated),
    summary: toStringValue(item.summary),
    sections: Array.isArray(item.sections)
      ? item.sections
        .filter((section): section is LegalSectionRaw => Boolean(section) && typeof section === 'object')
        .map((section) => ({
          title: toStringValue(section.title),
          bullets: toStringList(section.bullets)
        }))
      : []
  };
};

const normalizeLegalPublicInfo = (payload: unknown): LegalPublicInfoRecord => {
  const raw = (payload && typeof payload === 'object' ? payload : {}) as LegalPublicInfoRaw;
  const controller = (raw.controller && typeof raw.controller === 'object' ? raw.controller : {}) as Record<string, unknown>;

  return {
    controller: {
      name: toStringValue(controller.name),
      address: toStringValue(controller.address),
      privacyEmail: toStringValue(controller.privacyEmail),
      dpoEmail: toStringValue(controller.dpoEmail),
      supportEmail: toStringValue(controller.supportEmail),
      supervisoryAuthority: toStringValue(controller.supervisoryAuthority)
    },
    processors: Array.isArray(raw.processors)
      ? raw.processors
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item) => ({
          name: toStringValue(item.name),
          purpose: toStringValue(item.purpose),
          dataCategories: toStringValue(item.dataCategories),
          region: toStringValue(item.region)
        }))
      : [],
    storageTechnologies: Array.isArray(raw.storageTechnologies)
      ? raw.storageTechnologies
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item) => ({
          name: toStringValue(item.name),
          key: toStringValue(item.key),
          purpose: toStringValue(item.purpose),
          duration: toStringValue(item.duration),
          essential: Boolean(item.essential)
        }))
      : [],
    privacyPolicy: normalizeLegalDocument(raw.privacyPolicy, 'privacy', 'Privacy Notice'),
    termsOfService: normalizeLegalDocument(raw.termsOfService, 'terms', 'Terms of Service'),
    cookiePolicy: normalizeLegalDocument(raw.cookiePolicy, 'cookies', 'Cookie And Storage Notice'),
    openBankingNotice: normalizeLegalDocument(raw.openBankingNotice, 'open-banking', 'Open Banking Data Notice')
  };
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
    residence: profile.residence,
    vatFrequency: profile.vatFrequency,
    gdprAccepted: profile.gdprAccepted ?? false,
    fiscalResidence: profile.fiscalResidence ?? null,
    taxRegime: profile.taxRegime ?? null,
    activityType: profile.activityType ?? null,
    customerId: profile.customerId ?? null,
    connectionId: profile.connectionId ?? null,
    dob: profile.dob ?? null,
    answer1: profile.answer1 ?? null,
    answer2: profile.answer2 ?? null,
    answer3: profile.answer3 ?? null,
    answer4: profile.answer4 ?? null,
    answer5: profile.answer5 ?? null,
    profilePicture: profile.logo ?? null
  };
};

export const opexApi = {
  getLegalPublicInfo: async () => {
    try {
      return normalizeLegalPublicInfo(await request<unknown>('/api/legal/public'));
    } catch {
      return DEFAULT_LEGAL_PUBLIC_INFO;
    }
  },

  acceptRequiredConsents: async (payload: RequiredLegalConsentPayload, fallback?: Partial<UserProfile>) => {
    try {
      return normalizeUserProfile(await request<unknown>('/api/legal/consents', {
        method: 'PUT',
        body: JSON.stringify(payload)
      }), fallback);
    } catch (error) {
      if (fallback) {
        return persistRequiredLegalConsentsLocally(
          normalizeUserProfile(fallback, fallback),
          DEFAULT_LEGAL_PUBLIC_INFO,
          payload
        );
      }
      throw error;
    }
  },

  syncUser: async (fallback?: Partial<UserProfile>) =>
    normalizeUserProfile(await request<unknown>('/api/users/sync', { method: 'POST' }), fallback),

  patchUserProfile: async (payload: UserProfilePatchPayload, fallback?: Partial<UserProfile>) =>
    normalizeUserProfile(await request<unknown>('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }), fallback),

  deleteUserProfile: () => request<void>('/api/users/profile', { method: 'DELETE' }),

  downloadDataExport: async () => {
    const headers = new Headers();
    const token = getStoredToken();

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const requestUrl = toSameOriginIfApiOrigin(joinBaseAndPath(API_BASE_URL, '/api/legal/export'));
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      const message = await parseMaybeJson<string>(response);
      throw new Error(typeof message === 'string' ? message : `Request failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('content-disposition') ?? '';
    const filenameMatch = contentDisposition.match(/filename=\"?([^"]+)\"?/i);
    const filename = filenameMatch?.[1] ?? 'opex-data-export.json';

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  getMyBankAccounts: async (page = 0, size = 20) =>
    normalizeBankAccountsPage(
      await request<unknown>(`/api/bank-accounts/my-accounts${buildQuery({ page, size })}`)
    ),

  getMyTransactions: async (page = 0, size = 50) =>
    normalizeTransactionsPage(
      await request<unknown>(`/api/transactions/my-transactions${buildQuery({ page, size })}`)
    ),

  getAllMyTransactions: async (size = 250) => {
    const firstPage = await opexApi.getMyTransactions(0, size);
    const totalPages = Number(firstPage.totalPages ?? 1);

    if (!Number.isFinite(totalPages) || totalPages <= 1) {
      return firstPage.content;
    }

    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => opexApi.getMyTransactions(index + 1, size))
    );

    const allTransactions = [firstPage, ...remainingPages].flatMap((pageResult) => pageResult.content);
    const dedupedTransactions = new Map<string, TransactionRecord>();
    allTransactions.forEach((transaction) => {
      dedupedTransactions.set(transaction.id, transaction);
    });

    return Array.from(dedupedTransactions.values());
  },

  getMyTaxes: async (page = 0, size = 20) =>
    normalizePage<TaxRecord>(await request<unknown>(`/api/taxes/my-taxes${buildQuery({ page, size })}`)),

  getAggregatedBalances: async () =>
    normalizeAggregatedBalances(await request<unknown>('/api/transactions/aggregated')),

  getTimeAggregatedBalances: async () =>
    normalizeTimeAggregatedBalances(await request<unknown>('/api/transactions/aggregated/time')),

  getForecast: async (months = 3) =>
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

  bankIntegrationConnect: (payload: OpenBankingConsentPayload) =>
    request<BankIntegrationResponse>('/api/bank-integration/connect', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  bankIntegrationRefreshConnection: (connectionId: string) =>
    request<BankIntegrationResponse>(`/api/bank-integration/connections/${encodeURIComponent(connectionId)}/refresh`, {
      method: 'POST'
    }),

  bankIntegrationDeleteConnection: (connectionId: string) =>
    request<void>(`/api/bank-integration/connections/${encodeURIComponent(connectionId)}`, {
      method: 'DELETE'
    }),

  bankIntegrationSync: () =>
    request<BankIntegrationResponse>('/api/bank-integration/sync', { method: 'POST' })
};
