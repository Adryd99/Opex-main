import type { PaginatedResponse } from '../../../../shared/types/app';
import type { BankAccountRecord, TransactionRecord } from '../../../../shared/types/banking';
import type {
  AggregatedBalanceRecord,
  ForecastHistoricalPoint,
  ForecastPoint,
  ForecastResponse,
  TimeAggregatedPoint,
  TimeAggregatedRecord
} from '../../../../shared/types/finance';
import type {
  TaxBufferActivityItem,
  TaxBufferDashboardResponse,
  TaxBufferDeadlineItem,
  TaxBufferLiabilityItem,
  TaxBufferProviderItem
} from '../../../../shared/types/tax';
import {
  findNumberCandidate,
  findStringCandidate,
  firstNonEmptyString,
  normalizePage,
  toBooleanValue,
  toNumber,
  toRecord,
  toRecordList,
  toStringOrNull,
  toStringValue
} from './support';

const normalizeTimeAggregationList = (payload: unknown, fallbackPrefix: string): TimeAggregatedPoint[] =>
  toRecordList(payload).map((item, index) => {
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

    return {
      key,
      label: labelCandidate ?? key,
      connectionId: findStringCandidate(item, ['connectionId']),
      income: findNumberCandidate(item, ['income', 'totalIncome', 'incomes']),
      expenses: findNumberCandidate(item, ['expenses', 'totalExpenses', 'expense'])
    };
  });

export const normalizePageResponse = normalizePage;

export const normalizeTimeAggregatedBalances = (payload: unknown): TimeAggregatedRecord => {
  const response = toRecord(payload);

  return {
    byMonth: normalizeTimeAggregationList(response.byMonth, 'month'),
    byQuarter: normalizeTimeAggregationList(response.byQuarter, 'quarter'),
    byYear: normalizeTimeAggregationList(response.byYear, 'year')
  };
};

export const normalizeForecast = (payload: unknown): ForecastResponse => {
  const raw = toRecord(payload);
  const toForecastNumber = (value: unknown) =>
    (typeof value === 'number' ? value : parseFloat(String(value ?? '0')) || 0);

  const historical: ForecastHistoricalPoint[] = Array.isArray(raw.historical)
    ? raw.historical.map((entry) => {
      const item = toRecord(entry);
      return {
        key: String(item.key ?? ''),
        label: String(item.label ?? ''),
        income: toForecastNumber(item.income),
        expenses: toForecastNumber(item.expenses),
        net: toForecastNumber(item.net)
      };
    })
    : [];

  const forecast: ForecastPoint[] = Array.isArray(raw.forecast)
    ? raw.forecast.map((entry) => {
      const item = toRecord(entry);
      return {
        key: String(item.key ?? ''),
        label: String(item.label ?? ''),
        predictedIncome: toForecastNumber(item.predictedIncome),
        predictedExpenses: toForecastNumber(item.predictedExpenses),
        predictedNet: toForecastNumber(item.predictedNet)
      };
    })
    : [];

  const trendRaw = String(raw.trend ?? 'STABLE');
  const trend = (['GROWING', 'DECLINING', 'STABLE'] as const).find((item) => item === trendRaw) ?? 'STABLE';

  return {
    historical,
    forecast,
    trend,
    monthsOfData: toForecastNumber(raw.monthsOfData)
  };
};

export const normalizeBankAccount = (payload: unknown): BankAccountRecord | null => {
  const item = toRecord(payload);
  if (Object.keys(item).length === 0) {
    return null;
  }

  const saltedgeAccountId = findStringCandidate(item, ['saltedge_account_id', 'saltedgeAccountId']);
  const accountId =
    findStringCandidate(item, ['accountId', 'bankAccountId']) ??
    saltedgeAccountId ??
    findStringCandidate(item, ['id']);
  const id =
    findStringCandidate(item, ['id', 'name', 'accountName']) ??
    accountId ??
    saltedgeAccountId ??
    'Unknown Account';
  const institutionName =
    findStringCandidate(item, ['institutionName', 'institution_name', 'providerName', 'provider_name']) ??
    'Unknown Provider';

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

export const normalizeBankAccountsPage = (payload: unknown): PaginatedResponse<BankAccountRecord> => {
  const page = normalizePage<unknown>(payload);

  return {
    ...page,
    content: page.content
      .map((item) => normalizeBankAccount(item))
      .filter((item): item is BankAccountRecord => item !== null)
  };
};

export const normalizeTransaction = (payload: unknown): TransactionRecord | null => {
  const item = toRecord(payload);
  if (Object.keys(item).length === 0) {
    return null;
  }

  return {
    id: toStringValue(item.id),
    bankAccountId: firstNonEmptyString(item.bankAccountId, item.bank_account_id) ?? undefined,
    connectionId: toStringOrNull(firstNonEmptyString(item.connectionId, item.connection_id)),
    amount: toNumber(item.amount),
    bookingDate: toStringValue(item.bookingDate ?? item.booking_date),
    category: toStringValue(item.category),
    description: toStringValue(item.description),
    merchantName: toStringValue(item.merchantName ?? item.merchant_name),
    status: toStringValue(item.status),
    type: toStringValue(item.type)
  };
};

export const normalizeTransactionsPage = (payload: unknown): PaginatedResponse<TransactionRecord> => {
  const page = normalizePage<unknown>(payload);

  return {
    ...page,
    content: page.content
      .map((item) => normalizeTransaction(item))
      .filter((item): item is TransactionRecord => item !== null && item.id.length > 0)
  };
};

export const normalizeTaxBufferProviders = (payload: unknown): TaxBufferProviderItem[] =>
  toRecordList(payload)
    .map((item) => ({
      connectionId: toStringValue(item.connectionId),
      providerName: toStringValue(item.providerName),
      status: toStringValue(item.status)
    }))
    .filter((item) => item.connectionId.length > 0);

export const normalizeTaxBufferLiability = (payload: unknown): TaxBufferLiabilityItem[] =>
  toRecordList(payload)
    .map((item) => ({
      label: toStringValue(item.label),
      amount: toNumber(item.amount),
      percentage: toNumber(item.percentage)
    }))
    .filter((item) => item.label.length > 0);

export const normalizeTaxBufferDeadlines = (payload: unknown): TaxBufferDeadlineItem[] =>
  toRecordList(payload)
    .map((item) => ({
      id: toStringValue(item.id),
      title: toStringValue(item.title),
      dueDate: toStringValue(item.dueDate),
      status: toStringValue(item.status),
      amount: toNumber(item.amount),
      currency: toStringValue(item.currency, 'EUR'),
      category: toStringOrNull(item.category) ?? undefined,
      periodLabel: toStringOrNull(item.periodLabel),
      description: toStringOrNull(item.description),
      systemGenerated: Boolean(item.systemGenerated)
    }))
    .filter((item) => item.id.length > 0 || item.title.length > 0);

export const normalizeTaxBufferActivity = (payload: unknown): TaxBufferActivityItem[] =>
  toRecordList(payload)
    .map((item) => ({
      id: toStringValue(item.id),
      title: toStringValue(item.title),
      date: toStringValue(item.date),
      amount: toNumber(item.amount),
      direction: toStringValue(item.direction)
    }))
    .filter((item) => item.id.length > 0 || item.title.length > 0);

export const normalizeTaxBufferDashboard = (payload: unknown): TaxBufferDashboardResponse => {
  const raw = toRecord(payload);
  const summary = toRecord(raw.summary);
  const incomeSocial = toRecord(raw.incomeSocial);
  const vat = toRecord(raw.vat);
  const safeMode = toRecord(raw.safeMode);

  return {
    selectedConnectionId: toStringOrNull(raw.selectedConnectionId),
    year: toNumber(raw.year),
    currency: toStringValue(raw.currency, 'EUR'),
    summary: {
      shouldSetAside: toNumber(summary.shouldSetAside),
      alreadySaved: toNumber(summary.alreadySaved),
      missing: toNumber(summary.missing),
      completionPercentage: toNumber(summary.completionPercentage),
      weeklyTarget: toNumber(summary.weeklyTarget),
      safeToSpend: toNumber(summary.safeToSpend),
      targetDate: toStringOrNull(summary.targetDate)
    },
    incomeSocial: {
      taxableIncome: toNumber(incomeSocial.taxableIncome),
      incomeTax: toNumber(incomeSocial.incomeTax),
      socialContributions: toNumber(incomeSocial.socialContributions),
      subtotal: toNumber(incomeSocial.subtotal)
    },
    vat: {
      regime: toStringValue(vat.regime),
      rate: toNumber(vat.rate),
      vatLiability: toNumber(vat.vatLiability),
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

export const normalizeAggregatedBalances = (payload: unknown): AggregatedBalanceRecord[] =>
  toRecordList(payload)
    .map((item) => ({
      connectionId: String(item.connectionId ?? ''),
      totalBalance: toNumber(item.totalBalance),
      totalIncome: toNumber(item.totalIncome),
      totalExpenses: toNumber(item.totalExpenses)
    }))
    .filter((item) => item.connectionId.length > 0);
