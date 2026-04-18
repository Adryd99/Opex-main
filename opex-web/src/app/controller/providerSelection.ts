import { useEffect, useState } from 'react';

import {
  BankAccountRecord,
  TaxBufferProviderItem
} from '../../shared/types';
import {
  BANK_PROVIDERS_KEY,
  BANK_PROVIDERS_UPDATED_EVENT,
  getSelectedProviderFromStorage,
  normalizeText,
  PROVIDER_SELECTION_UPDATED_EVENT,
  resolveAccountProviderName,
  SELECTED_PROVIDER_KEY
} from './providerSupport';

export const useSelectedProviderName = () => {
  const [selectedProviderName, setSelectedProviderName] = useState<string | null>(
    typeof window === 'undefined' ? null : getSelectedProviderFromStorage()
  );

  useEffect(() => {
    const updateSelectedProvider = () => {
      setSelectedProviderName(getSelectedProviderFromStorage());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SELECTED_PROVIDER_KEY) {
        updateSelectedProvider();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(PROVIDER_SELECTION_UPDATED_EVENT, updateSelectedProvider);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(PROVIDER_SELECTION_UPDATED_EVENT, updateSelectedProvider);
    };
  }, []);

  return selectedProviderName;
};

type UseBankProviderRegistryArgs = {
  bankAccounts: BankAccountRecord[];
  taxBufferProviders: TaxBufferProviderItem[];
  providerByConnectionId: Map<string, string>;
};

export const useBankProviderRegistry = ({
  bankAccounts,
  taxBufferProviders,
  providerByConnectionId
}: UseBankProviderRegistryArgs) => {
  useEffect(() => {
    const providerNames = Array.from(
      new Set([
        ...taxBufferProviders
          .map((provider) => normalizeText(provider.providerName))
          .filter((name) => name.length > 0),
        ...bankAccounts
          .map((account) => resolveAccountProviderName(account, providerByConnectionId))
          .filter((name) => name.length > 0)
      ])
    );

    window.localStorage.setItem(BANK_PROVIDERS_KEY, JSON.stringify(providerNames));
    window.dispatchEvent(new Event(BANK_PROVIDERS_UPDATED_EVENT));
  }, [bankAccounts, providerByConnectionId, taxBufferProviders]);
};
