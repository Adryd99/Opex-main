import React, { useEffect, useRef } from 'react';
import { Loader2, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../../shared/ui';
import { BankOption } from '../../../shared/types';

export const BankRedirectionPage = ({
  bank,
  onComplete,
  onBack,
  isSyncing,
  syncStage,
  errorMessage
}: {
  bank: BankOption;
  onComplete: () => Promise<void>;
  onBack: () => void;
  isSyncing: boolean;
  syncStage: 'idle' | 'opening_widget' | 'waiting_success_redirect' | 'syncing_success';
  errorMessage: string | null;
}) => {
  const { t } = useTranslation('banking');
  const hasAutoStartedRef = useRef(false);

  useEffect(() => {
    if (hasAutoStartedRef.current) {
      return;
    }

    hasAutoStartedRef.current = true;
    void onComplete().catch(() => undefined);
  }, [onComplete]);

  const loadingDescription =
    syncStage === 'opening_widget'
      ? t('redirection.openingWidget')
      : syncStage === 'waiting_success_redirect'
        ? t('redirection.waitingRedirect')
        : syncStage === 'syncing_success'
          ? t('redirection.syncingSuccess')
          : isSyncing
            ? t('redirection.waiting')
            : t('redirection.waitingNextStep');

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-4 md:p-8 text-center space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="relative">
        <div className={`w-24 h-24 rounded-[2rem] ${bank.color} text-white flex items-center justify-center text-4xl font-black shadow-2xl ${isSyncing ? 'animate-bounce' : ''}`}>
          {typeof bank.icon === 'string' ? bank.icon : React.isValidElement(bank.icon) ? React.cloneElement(bank.icon as React.ReactElement<any>, { size: 48 }) : bank.icon}
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
          <Loader2 className="animate-spin text-opex-teal" size={24} />
        </div>
      </div>
      <div className="space-y-3">
        <h2 className="text-2xl font-black text-gray-900">{t('redirection.title', { bank: bank.name })}</h2>
        <p className="text-gray-500 max-w-xs mx-auto font-medium">{loadingDescription}</p>
      </div>
      <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-opex-teal animate-progress-fast"></div>
      </div>
      <Button size="sm" variant="outline" onClick={onBack} icon={X} disabled={isSyncing || syncStage === 'syncing_success'}>
        {t('redirection.back')}
      </Button>
      {errorMessage && (
        <div className="max-w-md space-y-4">
          <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
          <Button size="sm" variant="outline" onClick={() => void onComplete().catch(() => undefined)} icon={RefreshCw}>
            {t('redirection.retry')}
          </Button>
        </div>
      )}
    </div>
  );
};


