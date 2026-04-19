import { useCallback, useEffect, useState } from 'react';

import type { UserSecurityStatus } from '../../../shared/types/user';
import { userClient } from '../../../services/api/opex/clients/userClient';

type UseUserSecurityStatusResult = {
  data: UserSecurityStatus | null;
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
};

export const useUserSecurityStatus = (): UseUserSecurityStatusResult => {
  const [data, setData] = useState<UserSecurityStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const securityStatus = await userClient.getUserSecurityStatus();
      setData(securityStatus);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load security status.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    data,
    isLoading,
    errorMessage,
    refresh
  };
};
