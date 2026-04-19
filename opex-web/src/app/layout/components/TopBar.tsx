import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import opesLargeLogo from '../../../shared/assets/Opes_large_dark.png';

import { NotificationButton } from './NotificationButton';

type TopBarProps = {
  title: string;
};

export const TopBar = ({ title }: TopBarProps) => {
  const { t } = useTranslation('app');

  return (
    <div className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div className="flex items-center md:hidden">
          <img src={opesLargeLogo} alt="Opex" className="h-9 w-auto object-contain" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 hidden md:block">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t('topBar.globalSearch')}
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-opex-teal/20 w-64"
          />
        </div>
        <NotificationButton />
      </div>
    </div>
  );
};
