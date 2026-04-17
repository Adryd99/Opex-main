import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useRef,
  useState
} from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUp,
  Bell,
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Hexagon,
  LayoutGrid,
  LogOut,
  Plus,
  Search,
  Settings,
  Sparkles,
  Wallet
} from 'lucide-react';

import { NotificationRecord, UserProfile } from '../../shared/types';
import { opexApi } from '../../services/api/opexApi';

type ProviderOption = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
};

type QuickActionsProps = {
  compact?: boolean;
  onNavigate?: (tab: string) => void;
};

type SubpageShellProps = {
  children?: ReactNode;
  onBack: () => void;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

type SidebarProps = {
  activeTab: string;
  setActiveTab: (id: string) => void;
  onLogout: () => void;
  userProfile?: UserProfile;
};

type TopBarProps = {
  title: string;
};

type CenteredStatusCardProps = {
  title: string;
  description: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
};

const ICON_MAP: Record<string, ComponentType<{ size?: number | string; className?: string }>> = {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Sparkles,
  Bell
};

const BANK_PROVIDERS_KEY = 'opex_bank_providers';
const BANK_PROVIDERS_UPDATED_EVENT = 'opex:bank-providers-updated';
const SELECTED_PROVIDER_KEY = 'opex_selected_provider_name';
const PROVIDER_SELECTION_UPDATED_EVENT = 'opex:provider-selection-updated';
const PROVIDER_COLORS = ['bg-opex-teal', 'bg-orange-600', 'bg-black', 'bg-green-600', 'bg-red-600', 'bg-slate-700'];
const QUICK_ACTION_ITEMS = [
  { label: 'Add Income', icon: ArrowUp, color: 'text-green-500', bg: 'bg-green-50', id: 'QUICK_INCOME' },
  { label: 'Add Expense', icon: ArrowDownRight, color: 'text-red-500', bg: 'bg-red-50', id: 'QUICK_EXPENSE' },
  { label: 'Open Banking', icon: Building2, color: 'text-purple-500', bg: 'bg-purple-50', id: 'OPEN_BANKING' }
] as const;
const NAV_ITEMS = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutGrid },
  { id: 'BUDGET', label: 'Budget', icon: Wallet },
  { id: 'TAXES', label: 'Taxes', icon: Calculator },
  { id: 'INVOICING', label: 'Invoicing', icon: FileText },
  { id: 'SETTINGS', label: 'Settings', icon: Settings }
] as const;

const toProviderIcon = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return 'B';
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
};

const loadProviderOptions = (): ProviderOption[] => {
  if (typeof window === 'undefined') {
    return [{ id: 'all', name: 'All Providers', icon: 'A', color: 'bg-opex-dark', type: 'Combined' }];
  }

  try {
    const rawValue = window.localStorage.getItem(BANK_PROVIDERS_KEY);
    const providerNames = rawValue ? JSON.parse(rawValue) : [];
    const normalizedNames = Array.isArray(providerNames)
      ? providerNames.filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
      : [];

    return [
      { id: 'all', name: 'All Providers', icon: 'A', color: 'bg-opex-dark', type: 'Combined' },
      ...normalizedNames.map((name, index) => ({
        id: `provider-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name,
        icon: toProviderIcon(name),
        color: PROVIDER_COLORS[index % PROVIDER_COLORS.length],
        type: 'Provider'
      }))
    ];
  } catch {
    return [{ id: 'all', name: 'All Providers', icon: 'A', color: 'bg-opex-dark', type: 'Combined' }];
  }
};

export const AccountSelector = ({ compact = false }: { compact?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProviderName, setSelectedProviderName] = useState<string>(
    typeof window === 'undefined' ? '' : window.localStorage.getItem(SELECTED_PROVIDER_KEY) ?? ''
  );
  const [providerOptions, setProviderOptions] = useState<ProviderOption[]>(() => loadProviderOptions());
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
      setProviderOptions(loadProviderOptions());
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
  }, []);

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
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Account</p>
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

export const NotificationButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await opexApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((notification) => notification.unread).length;

  const markAsRead = async (id: string) => {
    try {
      await opexApi.markNotificationAsRead(id);
      setNotifications((previous) =>
        previous.map((notification) => (notification.id === id ? { ...notification, unread: false } : notification))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await opexApi.markAllNotificationsAsRead();
      setNotifications((previous) => previous.map((notification) => ({ ...notification, unread: false })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 border border-gray-100 transition-all ${isOpen ? 'bg-gray-50 border-opex-teal' : 'bg-white'}`}
      >
        <Bell size={20} className={isOpen ? 'text-opex-teal' : ''} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-[2rem] shadow-2xl border border-gray-100 py-4 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="px-6 py-2 border-b border-gray-50 flex items-center justify-between mb-2">
            <h3 className="font-black text-gray-900 tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[10px] font-black text-opex-teal uppercase tracking-widest hover:underline"
              >
                Mark as read
              </button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto no-scrollbar px-2">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No notifications</div>
            ) : (
              notifications.map((notification) => {
                const Icon = ICON_MAP[notification.icon] || Bell;
                return (
                  <div
                    key={notification.id}
                    onClick={() => void markAsRead(notification.id)}
                    className={`p-4 flex gap-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group ${notification.unread ? 'bg-opex-teal/[0.02]' : ''}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        notification.type === 'warning'
                          ? 'bg-orange-100 text-orange-600'
                          : notification.type === 'danger'
                            ? 'bg-red-100 text-red-600'
                            : notification.type === 'success'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm font-bold leading-none mb-1 ${notification.unread ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </p>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{notification.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed truncate-2-lines">{notification.description}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="px-6 pt-4 border-t border-gray-50 mt-2">
            <button
              type="button"
              className="w-full py-3 bg-gray-50 rounded-xl text-xs font-black text-gray-400 hover:text-opex-teal transition-colors"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const QuickActions = ({ compact = false, onNavigate }: QuickActionsProps) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setShowQuickActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={quickActionsRef}>
      <button
        type="button"
        onClick={() => setShowQuickActions(!showQuickActions)}
        className={`${compact ? 'w-8 h-8 rounded-lg' : 'p-3 rounded-2xl'} bg-opex-dark text-white shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center ${showQuickActions ? 'rotate-45 bg-slate-700' : ''}`}
      >
        <Plus size={compact ? 18 : 24} />
      </button>

      {showQuickActions && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-2 border-b border-gray-50 mb-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Actions</p>
          </div>
          {QUICK_ACTION_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setShowQuickActions(false);
                onNavigate?.(item.id);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
            >
              <div className={`w-8 h-8 ${item.bg} ${item.color} rounded-lg flex items-center justify-center transition-transform group-hover:scale-110`}>
                <item.icon size={18} />
              </div>
              <span className="text-sm font-semibold text-gray-700">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const SubpageShell = ({ children, onBack, title, subtitle, actions }: SubpageShellProps) => (
  <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12 px-4 md:px-8">
    <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm sticky top-4 z-20 backdrop-blur-md bg-white/90">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <Hexagon size={20} fill="#1F4650" className="text-opex-teal" />
            <span className="font-bold text-lg text-opex-teal tracking-tighter">opex</span>
            <span className="mx-2 text-gray-300">/</span>
            <span className="font-bold text-gray-900">{title}</span>
          </div>
          {subtitle && <p className="text-[10px] text-gray-500 font-medium ml-7 -mt-1">{subtitle}</p>}
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

export const Sidebar = ({ activeTab, setActiveTab, onLogout, userProfile }: SidebarProps) => (
  <div className="w-64 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 h-screen fixed left-0 top-0 hidden md:flex flex-col z-50 transition-colors duration-200">
    <div className="p-8 flex items-center gap-2">
      <div className="bg-opex-teal rounded-xl p-2 text-white">
        <Hexagon size={24} fill="currentColor" />
      </div>
      <span className="text-2xl font-bold text-opex-teal dark:text-teal-400 tracking-tight">opex</span>
    </div>

    <nav className="flex-1 px-4 space-y-1 mt-2">
      {NAV_ITEMS.map((item) => {
        const isActive =
          activeTab === item.id ||
          (item.id === 'DASHBOARD' &&
            ['INCOME', 'EXPENSES', '[]', 'QUICK_INCOME', 'QUICK_EXPENSE', 'QUICK_INVOICE'].includes(activeTab)) ||
          (item.id === 'BUDGET' && ['INSIGHTS'].includes(activeTab)) ||
          (item.id === 'SETTINGS' && activeTab.startsWith('SETTINGS_'));

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
      <button
        type="button"
        onClick={onLogout}
        className="w-full bg-gray-50 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full bg-opex-teal/10 overflow-hidden flex items-center justify-center shrink-0">
          {userProfile?.logo ? (
            <img src={userProfile.logo} alt="User" className="w-full h-full object-cover" />
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
          <p className="text-sm font-bold text-gray-900 truncate">{userProfile?.name ?? '—'}</p>
          <p className="text-xs text-gray-500 truncate">{userProfile?.email ?? ''}</p>
        </div>
        <LogOut size={16} className="text-gray-400" />
      </button>
    </div>
  </div>
);

export const TopBar = ({ title }: TopBarProps) => (
  <div className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1 md:hidden">
        <Hexagon size={24} fill="#1F4650" className="text-opex-teal" />
        <span className="font-bold text-xl text-opex-teal tracking-tighter">opex</span>
      </div>
      <h1 className="text-xl font-bold text-gray-900 hidden md:block">{title}</h1>
    </div>

    <div className="flex items-center gap-4">
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Global search..."
          className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-opex-teal/20 w-64"
        />
      </div>
      <NotificationButton />
    </div>
  </div>
);

export const CenteredStatusCard = ({ title, description, icon, actions }: CenteredStatusCardProps) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div className="bg-white border border-gray-100 rounded-3xl p-8 max-w-md w-full text-center shadow-sm space-y-4">
      {icon}
      <h1 className="text-xl font-black text-gray-900">{title}</h1>
      <div className="text-sm text-gray-500">{description}</div>
      {actions}
    </div>
  </div>
);
