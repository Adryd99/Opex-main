const ACCESS_TOKEN_KEY = 'opex_access_token';
const COMPAT_ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'opex_refresh_token';
const EXPIRES_AT_KEY = 'opex_token_expires_at';
const PKCE_VERIFIER_KEY = 'opex_pkce_verifier';
const OAUTH_STATE_KEY = 'opex_oauth_state';

export type KeycloakTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  token_type?: string;
};

export const storePkceSession = (verifier: string, state: string) => {
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
};

export const readPkceSession = () => ({
  verifier: sessionStorage.getItem(PKCE_VERIFIER_KEY),
  state: sessionStorage.getItem(OAUTH_STATE_KEY)
});

export const clearPkceSession = () => {
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
};

export const clearStoredTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(COMPAT_ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
};

export const storeTokenResponse = (tokenResponse: KeycloakTokenResponse) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokenResponse.access_token);
  localStorage.setItem(COMPAT_ACCESS_TOKEN_KEY, tokenResponse.access_token);
  if (tokenResponse.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokenResponse.refresh_token);
  }
  if (tokenResponse.expires_in) {
    const expiresAt = Date.now() + tokenResponse.expires_in * 1000;
    localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
  }
};

export const hasValidAccessToken = (): boolean => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? localStorage.getItem(COMPAT_ACCESS_TOKEN_KEY);
  if (!token) {
    return false;
  }

  const expiresAtRaw = localStorage.getItem(EXPIRES_AT_KEY);
  if (!expiresAtRaw) {
    return true;
  }

  const expiresAt = Number.parseInt(expiresAtRaw, 10);
  if (Number.isNaN(expiresAt)) {
    return true;
  }

  return Date.now() < expiresAt - 15_000;
};

export const readRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);
