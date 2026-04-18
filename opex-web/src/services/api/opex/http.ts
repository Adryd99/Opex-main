import { runtimeEnv } from '../../runtimeEnv';

const API_BASE_URL = runtimeEnv.VITE_API_BASE_URL ?? '';
export const API_ORIGIN = runtimeEnv.VITE_API_ORIGIN ?? 'http://localhost:8080';

type ApiErrorShape = {
  message?: unknown;
  error?: unknown;
  title?: unknown;
  detail?: unknown;
  errors?: unknown;
};

export class ApiHttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.body = body;
  }
}

export const getStoredToken = (): string | null => {
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

export const buildQuery = (query: Record<string, string | number | undefined>): string => {
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

const extractValidationMessage = (errors: unknown): string | null => {
  if (!Array.isArray(errors)) {
    return null;
  }

  for (const item of errors) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const record = item as Record<string, unknown>;
    const field = typeof record.field === 'string' && record.field.trim().length > 0 ? record.field.trim() : null;
    const messageCandidates = [record.message, record.defaultMessage, record.detail];

    for (const candidate of messageCandidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return field ? `${field}: ${candidate.trim()}` : candidate.trim();
      }
    }
  }

  return null;
};

export const resolveApiErrorMessage = (payload: unknown, status: number): string => {
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    return trimmed.length > 0 ? trimmed : `Request failed with status ${status}`;
  }

  if (!payload || typeof payload !== 'object') {
    return `Request failed with status ${status}`;
  }

  const record = payload as ApiErrorShape;
  const directCandidates = [record.message, record.error, record.title, record.detail];

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  const validationMessage = extractValidationMessage(record.errors);
  if (validationMessage) {
    return validationMessage;
  }

  return `Request failed with status ${status}`;
};

export const joinBaseAndPath = (baseUrl: string, path: string): string => {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

export const toBrowserRelativeIfSameOrigin = (url: string): string => {
  const browserOrigin = typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin;
  const target = new URL(url, browserOrigin);
  if (target.origin === browserOrigin) {
    return `${target.pathname}${target.search}${target.hash}`;
  }

  return target.toString();
};

export const fetchAuthorized = async (
  path: string,
  init?: RequestInit,
  baseUrl = API_BASE_URL
): Promise<Response> => {
  const headers = new Headers(init?.headers);
  const token = getStoredToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init?.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const requestUrl = toBrowserRelativeIfSameOrigin(joinBaseAndPath(baseUrl, path));
  return fetch(requestUrl, {
    ...init,
    headers,
    credentials: 'include'
  });
};

export const assertOkResponse = async (response: Response): Promise<void> => {
  if (response.ok) {
    return;
  }

  const payload = await parseMaybeJson<unknown>(response);
  const message = resolveApiErrorMessage(payload, response.status);
  throw new ApiHttpError(response.status, message, payload);
};

export const requestWithBase = async <T>(
  baseUrl: string,
  path: string,
  init?: RequestInit
): Promise<T> => {
  const response = await fetchAuthorized(path, init, baseUrl);
  await assertOkResponse(response);
  return parseMaybeJson<T>(response);
};

export const request = async <T>(path: string, init?: RequestInit): Promise<T> =>
  requestWithBase<T>(API_BASE_URL, path, init);
