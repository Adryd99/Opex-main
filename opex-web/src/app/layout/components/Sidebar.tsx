import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import opesLargeLogo from '../../../shared/assets/Opes_large_dark.png';

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
    <div className="w-64 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 h-screen fixed left-0 top-0 hidden md:flex flex-col z-50 transition-colors duration-200">
      <div className="p-8 flex items-center">
        <img src={opesLargeLogo} alt="Opex" className="h-11 w-auto object-contain" />
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
                  ? 'bg-opex-dark dark:bg-teal-600 text-white shadow-md shadow-blue-900/10'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-50 dark:border-slate-700">
        <div className="w-full bg-gray-50 rounded-2xl p-3 shadow-sm">
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
              <p className="text-sm font-bold text-gray-900 truncate">{userProfile?.name ?? '-'}</p>
              <p className="text-xs text-gray-500 truncate">{userProfile?.email ?? ''}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-full border border-red-100 bg-white px-4 py-3 text-red-600 shadow-sm transition-colors hover:bg-red-50"
          >
            <LogOut size={15} className="text-current" />
            <span className="text-[11px] font-black uppercase tracking-[0.16em]">{t('navigation.logOut')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
