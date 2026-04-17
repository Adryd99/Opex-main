import { PaginatedResponse } from '../../../../shared/types';

export type LooseRecord = Record<string, unknown>;

export const toRecord = (payload: unknown): LooseRecord =>
  payload && typeof payload === 'object' ? (payload as LooseRecord) : {};

export const toRecordList = (payload: unknown): LooseRecord[] =>
  Array.isArray(payload)
    ? payload.filter((item): item is LooseRecord => Boolean(item) && typeof item === 'object')
    : [];

export const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const toBooleanValue = (value: unknown, fallback = false): boolean => {
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

export const toStringValue = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

export const toStringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

export const toStringList = (value: unknown): string[] => {
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

export const firstNonEmptyString = (...values: Array<unknown>): string | null => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return null;
};

export const findStringCandidate = (item: LooseRecord, keys: string[]): string | null => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return null;
};

export const findNumberCandidate = (item: LooseRecord, keys: string[]): number => {
  for (const key of keys) {
    const value = item[key];
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

export const normalizePage = <T>(payload: unknown): PaginatedResponse<T> => {
  if (Array.isArray(payload)) {
    return { content: payload as T[] };
  }

  const pagePayload = toRecord(payload);
  const content = Array.isArray(pagePayload.content) ? (pagePayload.content as T[]) : [];

  return {
    ...(pagePayload as Omit<PaginatedResponse<T>, 'content'>),
    content
  };
};
