import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import opesLargeLogo from '../../../shared/assets/Opes_large_dark.png';

import { AccountSelector } from './AccountSelector';
import { NotificationButton } from './NotificationButton';

type SubpageShellProps = {
  children?: ReactNode;
  onBack: () => void;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export const SubpageShell = ({ children, onBack, title, subtitle, actions }: SubpageShellProps) => {
  const { t } = useTranslation('app');

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12 px-4 md:px-8">
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm sticky top-4 z-20 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} aria-label={t('subpage.back')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <img src={opesLargeLogo} alt="Opex" className="h-8 w-auto object-contain" />
              <span className="mx-2 text-gray-300">/</span>
              <span className="font-bold text-gray-900">{title}</span>
            </div>
            {subtitle && <p className="text-[10px] text-gray-500 font-medium ml-11 -mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AccountSelector compact />
          {actions}
          <NotificationButton />
        </div>
      </div>
      {children}
    </div>
  );
};
