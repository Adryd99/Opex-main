import { useTranslation } from 'react-i18next';
import { AccountSelector, QuickActions } from '../../../app/layout';

type SettingsHeaderProps = {
  onNavigate: (view: string) => void;
};

export const SettingsHeader = ({ onNavigate }: SettingsHeaderProps) => {
  const { t } = useTranslation('settings');

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 relative z-20">
      <div>
        <h2 className="text-2xl font-bold text-app-primary">{t('header.title')}</h2>
        <p className="text-sm text-app-secondary">{t('header.description')}</p>
      </div>
      <div className="flex items-center gap-3">
        <AccountSelector />
        <QuickActions onNavigate={onNavigate} />
      </div>
    </div>
  );
};
