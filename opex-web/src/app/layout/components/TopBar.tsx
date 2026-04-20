import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BrandLogo } from '../../../shared/branding';

import { NotificationButton } from './NotificationButton';

type TopBarProps = {
  title: string;
};

export const TopBar = ({ title }: TopBarProps) => {
  const { t } = useTranslation('app');

  return (
    <div className="h-20 bg-app-surface/85 backdrop-blur-md border-b border-app-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 transition-colors duration-200">
      <div className="flex items-center gap-4">
        <div className="flex items-center md:hidden">
          <BrandLogo variant="large" className="h-9 w-auto object-contain" />
        </div>
        <h1 className="text-xl font-bold text-app-primary hidden md:block">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-tertiary" size={18} />
          <input
            type="text"
            placeholder={t('topBar.globalSearch')}
            className="pl-10 pr-4 py-2 bg-app-muted border border-app-border rounded-xl text-sm text-app-primary placeholder:text-app-tertiary focus:outline-none focus:ring-2 focus:ring-opex-teal/20 w-64 transition-colors duration-200"
          />
        </div>
        <NotificationButton />
      </div>
    </div>
  );
};
