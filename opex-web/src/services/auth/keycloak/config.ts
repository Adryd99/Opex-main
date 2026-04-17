import { runtimeEnv } from '../../runtimeEnv';

export const KEYCLOAK_AUTH_URL =
  runtimeEnv.VITE_KEYCLOAK_AUTH_URL ??
  'http://localhost:8081/realms/opex/protocol/openid-connect/auth';
export const KEYCLOAK_TOKEN_URL =
  runtimeEnv.VITE_KEYCLOAK_TOKEN_URL ??
  '/keycloak/realms/opex/protocol/openid-connect/token';
export const KEYCLOAK_LOGOUT_URL =
  runtimeEnv.VITE_KEYCLOAK_LOGOUT_URL ??
  'http://localhost:8081/realms/opex/protocol/openid-connect/logout';
export const KEYCLOAK_CLIENT_ID = runtimeEnv.VITE_KEYCLOAK_CLIENT_ID ?? 'opex';
export const KEYCLOAK_SCOPE = runtimeEnv.VITE_KEYCLOAK_SCOPE ?? 'openid profile email';
const KEYCLOAK_REDIRECT_URI = runtimeEnv.VITE_KEYCLOAK_REDIRECT_URI;

export const getRedirectUri = (): string => KEYCLOAK_REDIRECT_URI ?? window.location.origin;
