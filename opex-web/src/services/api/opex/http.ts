import { runtimeEnv } from '../../runtimeEnv';

const API_BASE_URL = runtimeEnv.VITE_API_BASE_URL ?? '';
export const API_ORIGIN = runtimeEnv.VITE_API_ORIGIN ?? 'http://localhost:8080';

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

  const message = await parseMaybeJson<string>(response);
  throw new Error(typeof message === 'string' ? message : `Request failed with status ${response.status}`);
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
