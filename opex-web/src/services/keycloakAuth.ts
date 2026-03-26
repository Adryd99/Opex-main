import { useCallback, useEffect, useState } from 'react';

const runtimeEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;

const KEYCLOAK_AUTH_URL =
  runtimeEnv?.VITE_KEYCLOAK_AUTH_URL ??
  'http://localhost:8081/realms/opex/protocol/openid-connect/auth';
const KEYCLOAK_TOKEN_URL =
  runtimeEnv?.VITE_KEYCLOAK_TOKEN_URL ??
  '/keycloak/realms/opex/protocol/openid-connect/token';
const KEYCLOAK_LOGOUT_URL =
  runtimeEnv?.VITE_KEYCLOAK_LOGOUT_URL ??
  'http://localhost:8081/realms/opex/protocol/openid-connect/logout';
const KEYCLOAK_CLIENT_ID = runtimeEnv?.VITE_KEYCLOAK_CLIENT_ID ?? 'opex';
const KEYCLOAK_SCOPE = runtimeEnv?.VITE_KEYCLOAK_SCOPE ?? 'openid profile email';
const KEYCLOAK_REDIRECT_URI = runtimeEnv?.VITE_KEYCLOAK_REDIRECT_URI;

const ACCESS_TOKEN_KEY = 'opex_access_token';
const COMPAT_ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'opex_refresh_token';
const EXPIRES_AT_KEY = 'opex_token_expires_at';
const PKCE_VERIFIER_KEY = 'opex_pkce_verifier';
const OAUTH_STATE_KEY = 'opex_oauth_state';

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  token_type?: string;
};

const getRedirectUri = (): string => KEYCLOAK_REDIRECT_URI ?? `${window.location.origin}/`;

const clearPkceSession = () => {
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
};

const clearStoredTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(COMPAT_ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
};

const generateRandomString = (length: number): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  return Array.from(randomValues)
    .map((value) => charset[value % charset.length])
    .join('');
};

const toBase64Url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const createCodeChallenge = async (verifier: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return toBase64Url(digest);
};

const storeTokenResponse = (tokenResponse: TokenResponse) => {
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

const cleanupAuthorizationParams = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('session_state');
  url.searchParams.delete('iss');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, document.title, nextUrl);
};

const hasValidAccessToken = (): boolean => {
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

const requestToken = async (body: URLSearchParams): Promise<TokenResponse> => {
  const response = await fetch(KEYCLOAK_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || `Token request failed with status ${response.status}`);
  }

  return (await response.json()) as TokenResponse;
};

const tryRefreshToken = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return false;
  }

  try {
    const payload = await requestToken(
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: KEYCLOAK_CLIENT_ID,
        refresh_token: refreshToken
      })
    );
    storeTokenResponse(payload);
    return true;
  } catch {
    clearStoredTokens();
    return false;
  }
};

const buildAuthorizationUrl = async (): Promise<string> => {
  const verifier = generateRandomString(96);
  const state = generateRandomString(48);
  const challenge = await createCodeChallenge(verifier);
  const redirectUri = getRedirectUri();

  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(OAUTH_STATE_KEY, state);

  const url = new URL(KEYCLOAK_AUTH_URL);
  url.searchParams.set('client_id', KEYCLOAK_CLIENT_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', KEYCLOAK_SCOPE);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
};

const exchangeCodeForToken = async (code: string, state: string | null) => {
  const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY);
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);

  if (!expectedState || !verifier) {
    throw new Error('Missing PKCE verifier/state in session storage.');
  }
  if (!state || state !== expectedState) {
    throw new Error('Invalid OAuth state returned by Keycloak.');
  }

  const payload = await requestToken(
    new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KEYCLOAK_CLIENT_ID,
      code,
      redirect_uri: getRedirectUri(),
      code_verifier: verifier
    })
  );

  storeTokenResponse(payload);
  clearPkceSession();
  cleanupAuthorizationParams();
};

type AuthStatus = 'loading' | 'authenticated' | 'error';

export const useKeycloakAuth = () => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const login = useCallback(async () => {
    const authorizationUrl = await buildAuthorizationUrl();
    window.location.assign(authorizationUrl);
  }, []);

  const logout = useCallback(() => {
    clearPkceSession();
    clearStoredTokens();

    const redirectUri = getRedirectUri();
    const logoutUrl = new URL(KEYCLOAK_LOGOUT_URL, window.location.origin);
    logoutUrl.searchParams.set('client_id', KEYCLOAK_CLIENT_ID);
    logoutUrl.searchParams.set('post_logout_redirect_uri', redirectUri);
    window.location.assign(logoutUrl.toString());
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUrl = new URL(window.location.href);
        const authorizationCode = currentUrl.searchParams.get('code');
        const authorizationState = currentUrl.searchParams.get('state');
        const oauthError = currentUrl.searchParams.get('error');
        const oauthErrorDescription = currentUrl.searchParams.get('error_description');

        if (oauthError) {
          throw new Error(oauthErrorDescription ?? oauthError);
        }

        if (authorizationCode) {
          await exchangeCodeForToken(authorizationCode, authorizationState);
          setStatus('authenticated');
          setErrorMessage(null);
          return;
        }

        if (hasValidAccessToken()) {
          setStatus('authenticated');
          setErrorMessage(null);
          return;
        }

        const refreshed = await tryRefreshToken();
        if (refreshed) {
          setStatus('authenticated');
          setErrorMessage(null);
          return;
        }

        await login();
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed.');
      }
    };

    void initAuth();
  }, [login]);

  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    errorMessage,
    login,
    logout
  };
};
