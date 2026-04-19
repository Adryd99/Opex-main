import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  BANK_PROVIDERS_KEY,
  BANK_PROVIDERS_UPDATED_EVENT,
  PROVIDER_SELECTION_UPDATED_EVENT,
  SELECTED_PROVIDER_KEY
} from '../../controller/controllerSupport';
import { loadProviderOptions, type ProviderOption } from '../support';

export const AccountSelector = ({ compact = false }: { compact?: boolean }) => {
  const { t, i18n } = useTranslation('app');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProviderName, setSelectedProviderName] = useState<string>(
    typeof window === 'undefined' ? '' : window.localStorage.getItem(SELECTED_PROVIDER_KEY) ?? ''
  );
  const [providerOptions, setProviderOptions] = useState<ProviderOption[]>(() =>
    typeof window === 'undefined'
      ? loadProviderOptions(null, t)
      : loadProviderOptions(window.localStorage.getItem(BANK_PROVIDERS_KEY), t)
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateSelectedProvider = () => {
      setSelectedProviderName(window.localStorage.getItem(SELECTED_PROVIDER_KEY) ?? '');
    };

    const updateProviders = () => {
      setProviderOptions(loadProviderOptions(window.localStorage.getItem(BANK_PROVIDERS_KEY), t));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === BANK_PROVIDERS_KEY) {
        updateProviders();
      }
      if (event.key === SELECTED_PROVIDER_KEY) {
        updateSelectedProvider();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(BANK_PROVIDERS_UPDATED_EVENT, updateProviders);
    window.addEventListener(PROVIDER_SELECTION_UPDATED_EVENT, updateSelectedProvider);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(BANK_PROVIDERS_UPDATED_EVENT, updateProviders);
      window.removeEventListener(PROVIDER_SELECTION_UPDATED_EVENT, updateSelectedProvider);
    };
  }, [t]);

  useEffect(() => {
    setProviderOptions(loadProviderOptions(window.localStorage.getItem(BANK_PROVIDERS_KEY), t));
  }, [i18n.resolvedLanguage, t]);

  useEffect(() => {
    if (!selectedProviderName) {
      return;
    }

    if (!providerOptions.some((provider) => provider.name === selectedProviderName)) {
      window.localStorage.setItem(SELECTED_PROVIDER_KEY, '');
      window.dispatchEvent(new Event(PROVIDER_SELECTION_UPDATED_EVENT));
      setSelectedProviderName('');
    }
  }, [providerOptions, selectedProviderName]);

  const selectedAccount = selectedProviderName
    ? providerOptions.find((provider) => provider.name === selectedProviderName) || providerOptions[0]
    : providerOptions[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${compact ? 'h-8 px-2 rounded-lg' : 'h-12 px-4 rounded-2xl'} bg-white border border-gray-100 shadow-sm hover:border-opex-teal/30 hover:shadow-md transition-all flex items-center gap-3 group active:scale-95`}
      >
        <div className={`w-6 h-6 rounded-lg ${selectedAccount.color} text-white flex items-center justify-center text-[10px] font-black shadow-sm`}>
          {selectedAccount.id === 'all' ? <LayoutGrid size={12} /> : selectedAccount.icon}
        </div>
        {!compact && (
          <>
            <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{selectedAccount.name}</span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-2 border-b border-gray-50 mb-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('accountSelector.selectAccount')}</p>
          </div>
          {providerOptions.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => {
                const nextProviderName = account.id === 'all' ? '' : account.name;
                window.localStorage.setItem(SELECTED_PROVIDER_KEY, nextProviderName);
                window.dispatchEvent(new Event(PROVIDER_SELECTION_UPDATED_EVENT));
                setSelectedProviderName(nextProviderName);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group ${
                account.id === 'all' ? selectedProviderName.length === 0 : selectedProviderName === account.name
                  ? 'bg-gray-50'
                  : ''
              }`}
            >
              <div className={`w-8 h-8 ${account.color} text-white rounded-lg flex items-center justify-center font-black text-xs transition-transform group-hover:scale-110`}>
                {account.id === 'all' ? <LayoutGrid size={16} /> : account.icon}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-700 leading-none">{account.name}</p>
                <p className="text-[10px] text-gray-400 font-medium mt-1">{account.type}</p>
              </div>
              {(account.id === 'all' ? selectedProviderName.length === 0 : selectedProviderName === account.name) && (
                <Check size={14} className="ml-auto text-opex-teal" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
