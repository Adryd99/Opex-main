import { AccountSelector, QuickActions } from '../../../app/layout';

type SettingsHeaderProps = {
  onNavigate: (view: string) => void;
};

export const SettingsHeader = ({ onNavigate }: SettingsHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 relative z-20">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">Manage your account, preferences, and personal data.</p>
      </div>
      <div className="flex items-center gap-3">
        <AccountSelector />
        <QuickActions onNavigate={onNavigate} />
      </div>
    </div>
  );
};
