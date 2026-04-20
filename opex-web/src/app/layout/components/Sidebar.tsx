import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BrandLogo } from '../../../shared/branding';

import { UserProfile } from '../../../shared/types';
import {
  APP_TABS,
  isBudgetMobileTab,
  isDashboardMobileTab,
  isSettingsTab,
  normalizeAppTab
} from '../../navigation';
import { buildNavItems } from '../support';

type SidebarProps = {
  activeTab: string;
  setActiveTab: (id: string) => void;
  onLogout: () => void;
  userProfile?: UserProfile;
};

export const Sidebar = ({ activeTab, setActiveTab, onLogout, userProfile }: SidebarProps) => {
  const { t } = useTranslation('app');
  const normalizedActiveTab = normalizeAppTab(activeTab);
  const navItems = buildNavItems(t);

  return (
    <div className="w-64 bg-app-surface border-r border-app-border h-screen fixed left-0 top-0 hidden md:flex flex-col z-50 transition-colors duration-200">
      <div className="p-8 flex items-center">
        <BrandLogo variant="large" className="h-11 w-auto object-contain" />
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-2">
        {navItems.map((item) => {
          const isActive =
            normalizedActiveTab === item.id ||
            (item.id === APP_TABS.DASHBOARD && isDashboardMobileTab(normalizedActiveTab)) ||
            (item.id === APP_TABS.BUDGET && isBudgetMobileTab(normalizedActiveTab)) ||
            (item.id === APP_TABS.SETTINGS && isSettingsTab(normalizedActiveTab));

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                isActive
                  ? 'bg-opex-dark dark:bg-opex-teal text-white shadow-md shadow-blue-900/10'
                  : 'text-app-secondary hover:bg-app-muted hover:text-app-primary'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-app-border">
        <div className="w-full bg-app-muted rounded-2xl p-3 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-opex-teal/10 overflow-hidden flex items-center justify-center shrink-0">
              {userProfile?.logo ? (
                <img src={userProfile.logo} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-sm font-black text-opex-teal select-none">
                  {(userProfile?.name ?? '?')
                    .trim()
                    .split(/\s+/)
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold text-app-primary truncate">{userProfile?.name ?? '-'}</p>
              <p className="text-xs text-app-secondary truncate">{userProfile?.email ?? ''}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-full border border-red-100 bg-app-surface px-4 py-3 text-red-600 shadow-sm transition-colors hover:bg-red-50 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10"
          >
            <LogOut size={15} className="text-current" />
            <span className="text-[11px] font-black uppercase tracking-[0.16em]">{t('navigation.logOut')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
