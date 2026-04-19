import {
  KEYCLOAK_AUTH_URL,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_LOGOUT_URL,
  KEYCLOAK_SCOPE,
  KEYCLOAK_TOKEN_URL,
  getRedirectUri
} from './config';
import { createPkceSession } from './pkce';
import {
  KeycloakTokenResponse,
  clearPkceSession,
  clearStoredTokens,
  hasValidAccessToken,
  readPkceSession,
  readRefreshToken,
  storePkceSession,
  storeTokenResponse
} from './storage';

export type KeycloakSessionResolution = 'authenticated' | 'redirecting';
export type KeycloakActionStatus = 'success' | 'cancelled' | 'error';
export type KeycloakAuthorizationOptions = {
  redirectPath?: string;
  action?: string;
  actionParameters?: Record<string, string | number | boolean | undefined>;
};
export type KeycloakActionResult = {
  action: string | null;
  status: KeycloakActionStatus | null;
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

const requestToken = async (body: URLSearchParams): Promise<KeycloakTokenResponse> => {
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

  return (await response.json()) as KeycloakTokenResponse;
};

export const tryRefreshToken = async (): Promise<boolean> => {
  const refreshToken = readRefreshToken();
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

const cleanupActionParams = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('kc_action');
  url.searchParams.delete('kc_action_status');

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, document.title, nextUrl);
};

export const readKeycloakActionResult = (): KeycloakActionResult => {
  const url = new URL(window.location.href);
  const action = url.searchParams.get('kc_action');
  const status = url.searchParams.get('kc_action_status');

  if (status === 'success' || status === 'cancelled' || status === 'error') {
    return {
      action,
      status
    };
  }

  return {
    action,
    status: null
  };
};

export const clearKeycloakActionResult = (): void => {
  cleanupActionParams();
};

export const buildAuthorizationUrl = async (
  options: KeycloakAuthorizationOptions = {}
): Promise<string> => {
  const pkceSession = await createPkceSession();
  const redirectUri = getRedirectUri(options.redirectPath);
  storePkceSession(pkceSession.verifier, pkceSession.state);

  const url = new URL(KEYCLOAK_AUTH_URL);
  url.searchParams.set('client_id', KEYCLOAK_CLIENT_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', KEYCLOAK_SCOPE);
  url.searchParams.set('state', pkceSession.state);
  url.searchParams.set('code_challenge', pkceSession.challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  if (options.action) {
    url.searchParams.set('kc_action', options.action);
  }
  Object.entries(options.actionParameters ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

export const redirectToLogin = async (
  options: KeycloakAuthorizationOptions = {}
): Promise<KeycloakSessionResolution> => {
  const authorizationUrl = await buildAuthorizationUrl(options);
  window.location.assign(authorizationUrl);
  return 'redirecting';
};

export const redirectToKeycloakAction = async (
  action: string,
  options: Omit<KeycloakAuthorizationOptions, 'action'> = {}
): Promise<KeycloakSessionResolution> =>
  redirectToLogin({
    ...options,
    action
  });

export const exchangeCodeForToken = async (code: string, state: string | null) => {
  const pkceSession = readPkceSession();

  if (!pkceSession.state || !pkceSession.verifier) {
    throw new Error('Missing PKCE verifier/state in session storage.');
  }
  if (!state || state !== pkceSession.state) {
    throw new Error('Invalid OAuth state returned by Keycloak.');
  }

  const payload = await requestToken(
    new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KEYCLOAK_CLIENT_ID,
      code,
      redirect_uri: getRedirectUri(window.location.pathname),
      code_verifier: pkceSession.verifier
    })
  );

  storeTokenResponse(payload);
  clearPkceSession();
  cleanupAuthorizationParams();
};

export const buildLogoutUrl = () => {
  clearPkceSession();
  clearStoredTokens();

  const redirectUri = getRedirectUri(window.location.pathname);
  const logoutUrl = new URL(KEYCLOAK_LOGOUT_URL, window.location.origin);
  logoutUrl.searchParams.set('client_id', KEYCLOAK_CLIENT_ID);
  logoutUrl.searchParams.set('post_logout_redirect_uri', redirectUri);
  return logoutUrl.toString();
};

export const resolveKeycloakSession = async (): Promise<KeycloakSessionResolution> => {
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
    return 'authenticated';
  }

  if (hasValidAccessToken()) {
    return 'authenticated';
  }

  if (await tryRefreshToken()) {
    return 'authenticated';
  }

  return redirectToLogin();
};

export { hasValidAccessToken };
