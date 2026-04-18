import { useCallback, useEffect, useState } from 'react';

import {
  buildLogoutUrl,
  redirectToLogin,
  resolveKeycloakSession
} from './keycloak/client';

type AuthStatus = 'loading' | 'authenticated' | 'error';

export const useKeycloakAuth = ({ suspend = false }: { suspend?: boolean } = {}) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const login = useCallback(async () => {
    await redirectToLogin();
  }, []);

  const logout = useCallback(() => {
    window.location.assign(buildLogoutUrl());
  }, []);

  useEffect(() => {
    if (suspend) {
      return;
    }

    const initAuth = async () => {
      try {
        const resolution = await resolveKeycloakSession();
        if (resolution === 'authenticated') {
          setStatus('authenticated');
          setErrorMessage(null);
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed.');
      }
    };

    void initAuth();
  }, [suspend]);

  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    errorMessage,
    login,
    logout
  };
};
