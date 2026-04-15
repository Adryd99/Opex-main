import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  LayoutGrid,
  Hexagon,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Settings,
  LogOut,
  Wallet,
  ArrowUp,
  ArrowRight,
  Building2,
  ArrowLeft,
  Calculator,
  FileText,
  Check,
  RefreshCw,
  ChevronDown,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Lock
} from 'lucide-react';
import { NotificationRecord } from '../models/types';
import { opexApi } from '../services/opexApi';

const ICON_MAP: Record<string, React.FC<any>> = {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Sparkles,
  Bell
};
import { TimeAggregatedRecord, ForecastResponse, UserProfile } from '../models/types';

const BANK_PROVIDERS_KEY = 'opex_bank_providers';
const BANK_PROVIDERS_UPDATED_EVENT = 'opex:bank-providers-updated';
const SELECTED_PROVIDER_KEY = 'opex_selected_provider_name';
const PROVIDER_SELECTION_UPDATED_EVENT = 'opex:provider-selection-updated';

type ProviderOption = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
};

const PROVIDER_COLORS = ['bg-opex-teal', 'bg-orange-600', 'bg-black', 'bg-green-600', 'bg-red-600', 'bg-slate-700'];

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
          {providerOptions.map((acc) => (
            <button 
              key={acc.id}
              onClick={() => {
                const nextProviderName = acc.id === 'all' ? '' : acc.name;
                window.localStorage.setItem(SELECTED_PROVIDER_KEY, nextProviderName);
                window.dispatchEvent(new Event(PROVIDER_SELECTION_UPDATED_EVENT));
                setSelectedProviderName(nextProviderName);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group ${
                (acc.id === 'all' ? selectedProviderName.length === 0 : selectedProviderName === acc.name) ? 'bg-gray-50' : ''
              }`}
            >
              <div className={`w-8 h-8 ${acc.color} text-white rounded-lg flex items-center justify-center font-black text-xs transition-transform group-hover:scale-110`}>
                {acc.id === 'all' ? <LayoutGrid size={16} /> : acc.icon}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-700 leading-none">{acc.name}</p>
                <p className="text-[10px] text-gray-400 font-medium mt-1">{acc.type}</p>
              </div>
              {(acc.id === 'all' ? selectedProviderName.length === 0 : selectedProviderName === acc.name) && (
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
    } catch (err) {
      console.error('Error fetching notifications:', err);
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

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAsRead = async (id: string) => {
    try {
      await opexApi.markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await opexApi.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 border border-gray-100 transition-all ${isOpen ? 'bg-gray-50 border-opex-teal' : 'bg-white'}`}
      >
        <Bell size={20} className={isOpen ? 'text-opex-teal' : ''} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-[2rem] shadow-2xl border border-gray-100 py-4 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="px-6 py-2 border-b border-gray-50 flex items-center justify-between mb-2">
            <h3 className="font-black text-gray-900 tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-[10px] font-black text-opex-teal uppercase tracking-widest hover:underline">
                Mark as read
              </button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto no-scrollbar px-2">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No notifications</div>
            ) : (
              notifications.map((notif) => {
                const Icon = ICON_MAP[notif.icon] || Bell;
                return (
                  <div 
                    key={notif.id} 
                    onClick={() => markAsRead(notif.id)}
                    className={`p-4 flex gap-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group ${notif.unread ? 'bg-opex-teal/[0.02]' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      notif.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                      notif.type === 'danger' ? 'bg-red-100 text-red-600' :
                      notif.type === 'success' ? 'bg-green-100 text-green-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm font-bold leading-none mb-1 ${notif.unread ? 'text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{notif.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed truncate-2-lines">{notif.description}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="px-6 pt-4 border-t border-gray-50 mt-2">
            <button className="w-full py-3 bg-gray-50 rounded-xl text-xs font-black text-gray-400 hover:text-opex-teal transition-colors">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const Button = ({ children, variant = 'primary', className = '', onClick, fullWidth = false, size = 'md', icon: Icon, disabled = false }: any) => {
  const baseStyle = "rounded-xl font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2";
  const sizes = {
    sm: "py-2 px-3 text-sm",
    md: "py-2.5 px-5 text-sm",
    lg: "py-3.5 px-8 text-base"
  };
  const variants = {
    primary: "bg-opex-dark text-white shadow-lg shadow-blue-900/10 hover:bg-slate-800",
    secondary: "bg-opex-teal text-white hover:bg-opacity-90",
    outline: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
    ghost: "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
    black: "bg-black text-white hover:bg-gray-800 shadow-md",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button 
      disabled={disabled}
      className={`${baseStyle} ${sizes[size as keyof typeof sizes]} ${variants[variant as keyof typeof variants]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  );
};

export const Card = ({ children, className = "", title, action, noPadding = false, onClick }: any) => (
  <div
    onClick={onClick}
    className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm ${className} overflow-hidden flex flex-col h-full transition-colors duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 transition-all active:scale-[0.99]' : ''}`}
  >
    {(title || action) && (
      <div className="flex justify-between items-center px-6 py-2.5 border-b border-gray-50 dark:border-slate-700">
        {title && <h3 className="font-black text-gray-900 dark:text-gray-100 text-[10px] uppercase tracking-widest">{title}</h3>}
        {action}
      </div>
    )}
    <div className={`${noPadding ? '' : 'p-4 md:p-5'} flex-1`}>
      {children}
    </div>
  </div>
);

export const Badge = ({ children, variant = 'neutral' }: any) => {
  const variants = {
    neutral: 'bg-gray-100 text-gray-600',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-yellow-50 text-yellow-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${variants[variant as keyof typeof variants]}`}>
      {children}
    </span>
  );
};

export const ToggleFilter = ({ options, active, onChange }: any) => (
  <div className="flex bg-gray-100 p-1 rounded-lg">
    {options.map((opt: string) => (
      <button
        key={opt}
        onClick={(e) => { e.stopPropagation(); onChange(opt); }}
        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
          active === opt 
            ? 'bg-white text-opex-dark shadow-sm' 
            : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
);

export const RecurringWidget = ({ onClick }: { onClick: () => void }) => (
  <div className="relative w-full h-full">
    {/* Coming Soon overlay */}
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl pointer-events-auto select-none">
      <div className="flex flex-col items-center gap-2 text-center px-4">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
          <Lock size={16} className="text-gray-400" />
        </div>
        <div>
          <p className="text-xs font-black text-gray-700 tracking-tight">Coming Soon</p>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">In development</p>
        </div>
      </div>
    </div>
    <button
      onClick={onClick}
      className="flex flex-col text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 overflow-hidden transition-all duration-200 w-full h-full pointer-events-none select-none"
      style={{ filter: 'blur(2px)', opacity: 0.5 }}
      disabled
    >
      <div className="flex justify-between items-start mb-4 w-full">
        <div className="p-2 bg-gray-50 rounded-xl text-gray-600">
          <RefreshCw size={18} />
        </div>
      </div>

      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Recurring</p>

      <div className="space-y-1 mb-4 w-full">
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Income</span>
          <span className="text-sm font-black text-emerald-600">€2,400</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Expenses</span>
          <span className="text-sm font-bold text-gray-900">€340</span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between w-full">
        <p className="text-[9px] font-bold text-gray-400 truncate">
          Next: <span className="text-gray-900">Figma €15 · 2d</span>
        </p>
        <div className="text-opex-teal shrink-0">
          <ArrowRight size={14} />
        </div>
      </div>
    </button>
  </div>
);

export const ClickableStat = ({ title, amount, trend, icon: Icon, trendUp = true, onClick }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col text-left justify-center bg-white rounded-2xl border border-gray-100 shadow-sm p-5 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-opex-teal/30 hover:bg-gray-50/30 active:scale-[0.98] group w-full"
  >
    <div className="flex justify-between items-start mb-3 w-full">
      <div className="p-2 bg-gray-50 rounded-xl text-gray-600 group-hover:bg-opex-teal group-hover:text-white transition-colors">
        <Icon size={18} />
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${trendUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />} {trend}
        </span>
      )}
    </div>
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{title}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-bold text-gray-400">€</span>
      <span className="text-xl font-bold text-gray-900 tracking-tight">{amount}</span>
    </div>
  </button>
);

export const QuickActions = ({ compact = false, onNavigate }: { compact?: boolean, onNavigate?: (tab: string) => void }) => {
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

  const quickActionItems = [
    { label: 'Add Income', icon: ArrowUp, color: 'text-green-500', bg: 'bg-green-50', id: 'QUICK_INCOME' },
    { label: 'Add Expense', icon: ArrowDownRight, color: 'text-red-500', bg: 'bg-red-50', id: 'QUICK_EXPENSE' },
    // { label: 'Add Invoice', icon: Receipt, color: 'text-blue-500', bg: 'bg-blue-50', id: 'QUICK_INVOICE' },
    { label: 'Open Banking', icon: Building2, color: 'text-purple-500', bg: 'bg-purple-50', id: 'OPEN_BANKING' },
  ];

  return (
    <div className="relative" ref={quickActionsRef}>
      <button 
        onClick={() => setShowQuickActions(!showQuickActions)}
        className={`${compact ? 'w-8 h-8 rounded-lg' : 'p-3 rounded-2xl'} bg-opex-dark text-white shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center ${showQuickActions ? 'rotate-45 bg-slate-700' : ''}`}
      >
        <Plus size={compact ? 18 : 24} />
      </button>
      
      {showQuickActions && (
        <div className={`absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200`}>
          <div className="px-4 py-2 border-b border-gray-50 mb-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Actions</p>
          </div>
          {quickActionItems.map((item, idx) => (
            <button 
              key={idx}
              onClick={() => {
                setShowQuickActions(false);
                if (onNavigate) onNavigate(item.id);
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



export const EnhancedLineChart = ({ color = "#22C55E", period = 'Month', heightPixels = 280 }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number, x: number, y: number } | null>(null);
  const containerRef = useRef<SVGSVGElement>(null);

  const data = useMemo(() => [], [period]);
  
  const width = 400;
  const height = 100;
  const padding = { top: 15, bottom: 10, left: 10, right: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map(d => d.value)) || 1;
  const yAxisTicks = [maxVal, maxVal * 0.66, maxVal * 0.33, 0];

  const points = data.map((d, i) => {
    const x = padding.left + (i * (chartWidth / (data.length - 1)));
    const y = padding.top + (chartHeight - (d.value / maxVal) * chartHeight);
    return { x, y, ...d };
  });

  const bezierPathD = useMemo(() => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const x_mid = (points[i].x + points[i+1].x) / 2;
        const y_mid = (points[i].y + points[i+1].y) / 2;
        d += ` Q ${points[i].x},${points[i].y} ${x_mid},${y_mid}`;
    }
    d += ` T ${points[points.length-1].x},${points[points.length-1].y}`;
    return d;
  }, [points]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    
    let closestIndex = 0;
    let minDistance = Infinity;
    points.forEach((p, i) => {
      const distance = Math.abs(p.x - mouseX);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    });

    setHoveredPoint({ 
      index: closestIndex, 
      x: points[closestIndex].x, 
      y: points[closestIndex].y 
    });
  };

  const handleMouseLeave = () => setHoveredPoint(null);

  const uniqueLabels = useMemo(() => {
    const labels: { label: string, x: number, index: number }[] = [];
    let lastLabel = "";
    points.forEach((p, i) => {
       if (p.label !== lastLabel) {
         labels.push({ label: p.label, x: p.x, index: i });
         lastLabel = p.label;
       }
    });
    return labels;
  }, [points]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div style={{ height: `${heightPixels}px` }} className="flex w-full">
        <div className="flex flex-col justify-between py-4 pr-3 text-[10px] font-bold text-gray-400 border-r border-gray-50 w-12 text-right">
          {yAxisTicks.map((tick, i) => (
            <span key={i}>€{(tick / 1000).toFixed(1)}k</span>
          ))}
        </div>

        <div className="flex-1 relative group ml-2">
          <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none opacity-10 py-4 px-0">
            <div className="w-full border-t border-gray-300"></div>
            <div className="w-full border-t border-gray-300"></div>
            <div className="w-full border-t border-gray-300"></div>
            <div className="w-full border-t border-gray-300"></div>
          </div>

          <svg 
            ref={containerRef}
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-full overflow-visible" 
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id={`gradient-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            
            <path 
              d={`${bezierPathD} L${points[points.length-1].x},${height} L${points[0].x},${height} Z`} 
              fill={`url(#gradient-${color.replace('#','')})`}
              opacity="0.1"
              className="transition-all duration-700 ease-in-out"
            />
            
            <path 
              d={bezierPathD} 
              fill="none" 
              stroke={color}  strokeWidth="3" 
              strokeLinecap="round"
              className="transition-all duration-700 ease-in-out"
            />

            {hoveredPoint && (
              <line 
                x1={hoveredPoint.x} 
                y1="0" 
                x2={hoveredPoint.x} 
                y2={height} 
                stroke={color} 
                strokeWidth="1" 
                strokeDasharray="4 4" 
                opacity="0.3"
              />
            )}
            
            <circle 
              cx={hoveredPoint ? hoveredPoint.x : points[points.length - 1].x} 
              cy={hoveredPoint ? hoveredPoint.y : points[points.length - 1].y} 
              r="4" 
              fill={color} 
              className="transition-all duration-300 ease-out shadow-lg"
            />
          </svg>

          {hoveredPoint && (
            <div 
              className="absolute bg-white p-3 rounded-2xl shadow-2xl border border-gray-100 pointer-events-none z-30 transition-all duration-150 ease-out"
              style={{ 
                left: `${(hoveredPoint.x / width) * 100}%`, 
                top: `${(hoveredPoint.y / height) * 100}%`,
                transform: 'translate(-50%, -130%)'
              }}
            >
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">
                {points[hoveredPoint.index].label}
              </p>
              <p className="text-base font-black text-gray-900 leading-none">
                €{points[hoveredPoint.index].value.toLocaleString()}
              </p>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-b border-r border-gray-100"></div>
            </div>
          )}
        </div>
      </div>
      
      <div className="relative h-6 ml-14 mr-2">
        {uniqueLabels.map((item, i) => (
          <span 
            key={i} 
            className={`absolute text-[10px] font-bold uppercase tracking-widest transition-colors -translate-x-1/2 ${(hoveredPoint && points[hoveredPoint.index].label === item.label) ? 'text-opex-teal' : 'text-gray-400'}`}
            style={{ left: `${(item.x / width) * 100}%` }}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export const MiniPieChart = ({ type = 'income' }) => (
  <div className="w-20 h-20 relative group shrink-0">
    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
      <circle cx="18" cy="18" r="16" fill="transparent" stroke="#F3F4F6" strokeWidth="4" />
      <circle 
        cx="18" cy="18" r="16" fill="transparent" 
        stroke={type === 'income' ? '#22C55E' : '#3B82F6'} 
        strokeWidth="4.5" 
        strokeDasharray="65 100" 
        strokeLinecap="round" 
        className="transition-all duration-1000"
      />
      <circle 
        cx="18" cy="18" r="16" fill="transparent" 
        stroke={type === 'income' ? '#3B82F6' : '#EF4444'} 
        strokeWidth="4.5" 
        strokeDasharray="25 100" 
        strokeDashoffset="-65" 
        strokeLinecap="round" 
        className="transition-all duration-1000"
      />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
       <span className="text-[9px] font-black text-gray-900 leading-none">82%</span>
       <span className="text-[6px] font-bold text-gray-400 uppercase tracking-tighter">TARGET</span>
    </div>
  </div>
);


// Catmull-Rom → cubic bezier smooth path (viewBox-coordinate points)
const catmullRomPath = (pts: { x: number; y: number }[]): string => {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
};

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

export const ForecastCompactWidget = ({
  timeAggregatedSummary,
  forecastData
}: {
  timeAggregatedSummary: TimeAggregatedRecord;
  forecastData?: ForecastResponse | null;
}) => {
  const [period, setPeriod] = useState('Month');
  const [tooltip, setTooltip] = useState<{
    label: string;
    isForecast: boolean;
    income: number;
    expenses: number;
    net: number;
    xPct: number; // 0-100, relative to chart area
    yPct: number; // 0-100, relative to chart area
  } | null>(null);

  const config = useMemo(() => {
    type ChartPoint = {
      label: string;
      income: number;
      expenses: number;
      net: number;
      isForecast: boolean;
    };

    // Historical bars always come from client-computed timeAggregatedSummary
    // so they stay in sync with the transactions state after every mutation.
    const hasForecast = period === 'Month' && forecastData != null
      && (forecastData.forecast ?? []).length > 0;

    const srcHist =
      period === 'Quarter'
        ? timeAggregatedSummary.byQuarter
        : period === 'Year'
          ? timeAggregatedSummary.byYear
          : timeAggregatedSummary.byMonth;

    const histRaw = srcHist.length > 0
      ? (period === 'Month' ? srcHist.slice(-6) : srcHist)
      : [{ key: 'empty', label: 'No data', income: 0, expenses: 0 }];

    const histPoints: ChartPoint[] = histRaw.map(p => {
      const inc = Math.max(Number(p.income ?? 0), 0);
      const exp = Math.abs(Number(p.expenses ?? 0));
      return { label: p.label, income: inc, expenses: exp, net: inc - exp, isForecast: false };
    });

    const fcPoints: ChartPoint[] = hasForecast
      ? (forecastData!.forecast ?? []).slice(0, 3).map(f => ({
          label: f.label,
          income: Number(f.predictedIncome ?? 0),
          expenses: Math.abs(Number(f.predictedExpenses ?? 0)),
          net: Number(f.predictedNet ?? 0),
          isForecast: true
        }))
      : [];

    const splitIndex = histPoints.length;
    const points: ChartPoint[] = [...histPoints, ...fcPoints];

    const inEuros = points.map(p => p.income);
    const outEuros = points.map(p => p.expenses);
    const netEuros = points.map(p => p.net);
    const maxE = Math.max(...inEuros, ...outEuros, 1);
    const minNet = Math.min(...netEuros, 0);
    const padding = Math.max(maxE * 0.14, 1);
    const yMin = minNet < 0 ? minNet - padding : 0;
    const yMax = maxE + padding;
    const yRange = yMax - yMin || 1;

    // viewBox is 1000 × 200 — aspect ratio similar to container, reduces distortion
    const VW = 1000;
    const VH = 200;
    const getY = (v: number) => VH * (1 - (v - yMin) / yRange);
    const getBarY = (v: number) => Math.min(getY(0), getY(v));
    const getBarH = (v: number) => Math.max(Math.abs(getY(0) - getY(v)), 1);

    const yStep = yRange / 4;
    const yLabels = Array.from({ length: 5 }).map((_, i) => {
      const val = yMax - i * yStep;
      const abs = Math.abs(val);
      if (abs >= 1_000_000) return `${val < 0 ? '-' : ''}${Math.round(abs / 1_000_000)}M`;
      if (abs >= 1000) return `${val < 0 ? '-' : ''}${Math.round(abs / 1000)}K`;
      return `${Math.round(val)}`;
    });

    const n = points.length;
    const bw = n > 0 ? VW / n : VW;
    const linePoints = points.map((p, i) => ({
      x: i * bw + bw / 2,
      y: getY(p.net)
    }));

    const trendLabel = hasForecast ? (forecastData!.trend ?? null) : null;

    return {
      points, splitIndex, hasForecast,
      inEuros, outEuros, netEuros,
      yLabels, linePoints, bw,
      VW, VH,
      getY, getBarY, getBarH,
      trendLabel,
    };
  }, [period, timeAggregatedSummary, forecastData]);

  const trendColor =
    config.trendLabel === 'GROWING'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : config.trendLabel === 'DECLINING'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-gray-100 text-gray-500 border-gray-200';
  const trendIcon = config.trendLabel === 'GROWING' ? '↑' : config.trendLabel === 'DECLINING' ? '↓' : '→';

  const actualLinePoints = config.linePoints.slice(0, config.splitIndex);
  // overlap by 1 so the dashed segment starts right where the solid one ends
  const forecastLinePoints = config.splitIndex > 0
    ? config.linePoints.slice(config.splitIndex - 1)
    : [];

  const actualPath = catmullRomPath(actualLinePoints);
  const forecastPath = catmullRomPath(forecastLinePoints);
  // separator as percentage of chart width
  const separatorPct = config.splitIndex * (100 / config.points.length);

  return (
    <Card
      title="Forecast"
      noPadding
      action={
        <div className="flex items-center gap-3 scale-90 origin-right">
          {config.trendLabel && (
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border tracking-wider uppercase ${trendColor}`}>
              {trendIcon} {config.trendLabel}
            </span>
          )}
          <ToggleFilter
            options={['Month', 'Quarter', 'Year']}
            active={period}
            onChange={setPeriod}
          />
          <div className="hidden sm:flex items-center gap-3 mr-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Expense</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-[2px] rounded-full" style={{ background: '#2F6FED' }} />
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Net</span>
            </div>
          </div>
        </div>
      }
    >
      <div className="p-4">
        <div className="relative h-44 w-full">
          {/* Y-axis labels */}
          <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-[8px] font-black text-gray-300 pb-6 pointer-events-none w-8">
            {config.yLabels.map((l, i) => <span key={i}>{l}</span>)}
          </div>

          {/* Grid lines */}
          <div className="absolute left-10 right-0 inset-y-0 flex flex-col justify-between pb-6 pointer-events-none">
            {[0, 1, 2, 3].map(i => <div key={i} className="w-full border-t border-gray-100" />)}
            <div className="w-full border-t border-gray-200" />
          </div>

          {/* Forecast background zone */}
          {config.hasForecast && config.splitIndex < config.points.length && (
            <div
              className="absolute top-0 bottom-6 bg-blue-50/40 border-l border-dashed border-blue-200/70 pointer-events-none"
              style={{ left: `calc(2.5rem + ${separatorPct}%)`, right: 0 }}
            />
          )}

          {/* Chart area */}
          <div className="absolute left-10 right-0 bottom-6 top-0">
            <svg
              viewBox={`0 0 ${config.VW} ${config.VH}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              {config.points.map((pt, i) => {
                const xPos = i * config.bw;
                const isFC = pt.isForecast;
                // xPct / yPct are used for the tooltip position (percent of chart area)
                const centerXPct = (xPos + config.bw / 2) / config.VW * 100;
                return (
                  <g key={i}>
                    {/* Income bar */}
                    <rect
                      x={xPos + config.bw * 0.1}
                      y={config.getBarY(pt.income)}
                      width={config.bw * 0.35}
                      height={config.getBarH(pt.income)}
                      fill="#22C55E"
                      opacity={isFC ? 0.35 : 0.82}
                      className="cursor-pointer"
                      onMouseEnter={() => setTooltip({
                        label: pt.label, isForecast: isFC,
                        income: pt.income, expenses: pt.expenses, net: pt.net,
                        xPct: centerXPct,
                        yPct: config.getBarY(pt.income) / config.VH * 100
                      })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                    {/* Expense bar */}
                    <rect
                      x={xPos + config.bw * 0.5}
                      y={config.getBarY(pt.expenses)}
                      width={config.bw * 0.35}
                      height={config.getBarH(pt.expenses)}
                      fill="#EF4444"
                      opacity={isFC ? 0.35 : 0.82}
                      className="cursor-pointer"
                      onMouseEnter={() => setTooltip({
                        label: pt.label, isForecast: isFC,
                        income: pt.income, expenses: pt.expenses, net: pt.net,
                        xPct: centerXPct,
                        yPct: config.getBarY(pt.expenses) / config.VH * 100
                      })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  </g>
                );
              })}

              {/* Forecast separator */}
              {config.hasForecast && config.splitIndex > 0 && config.splitIndex < config.points.length && (
                <line
                  x1={config.splitIndex * config.bw} y1="0"
                  x2={config.splitIndex * config.bw} y2={config.VH}
                  stroke="#93C5FD"
                  strokeWidth="1"
                  strokeDasharray="4 5"
                  vectorEffect="non-scaling-stroke"
                />
              )}

              {/* Actual net line */}
              {actualPath && (
                <path
                  d={actualPath}
                  fill="none"
                  stroke="#2F6FED"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.9}
                />
              )}

              {/* Forecast net line (dashed) */}
              {forecastPath && (
                <path
                  d={forecastPath}
                  fill="none"
                  stroke="#2F6FED"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4 6"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.65}
                />
              )}
            </svg>

            {/* Dot markers – rendered as HTML divs to stay perfectly circular */}
            {config.linePoints.map((lp, i) => {
              const pt = config.points[i];
              const leftPct = lp.x / config.VW * 100;
              const topPct = lp.y / config.VH * 100;
              return (
                <div
                  key={i}
                  className="absolute w-2.5 h-2.5 rounded-full border-2 bg-white shadow-sm cursor-pointer hover:scale-125 transition-transform z-10"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: 'translate(-50%, -50%)',
                    borderColor: '#2F6FED',
                    opacity: pt.isForecast ? 0.7 : 1
                  }}
                  onMouseEnter={() => setTooltip({
                    label: pt.label, isForecast: pt.isForecast,
                    income: pt.income, expenses: pt.expenses, net: pt.net,
                    xPct: leftPct, yPct: topPct
                  })}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}

            {/* "FORECAST →" label */}
            {config.hasForecast && config.splitIndex > 0 && config.splitIndex < config.points.length && (
              <div
                className="absolute top-1 text-[7px] font-black text-blue-400/70 uppercase tracking-widest pointer-events-none select-none"
                style={{ left: `${separatorPct + 0.5}%` }}
              >
                Forecast →
              </div>
            )}
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute bg-gray-900 text-white px-3 py-2.5 rounded-2xl shadow-2xl pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150 min-w-[130px]"
              style={{
                left: `calc(2.5rem + ${tooltip.xPct}%)`,
                top: `${tooltip.yPct}%`,
                transform: 'translate(-50%, calc(-100% - 14px))'
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">{tooltip.label}</p>
                {tooltip.isForecast && (
                  <span className="text-[7px] font-black text-blue-400 bg-blue-900/40 px-1 py-0.5 rounded uppercase">est.</span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between gap-4 items-center">
                  <span className="text-[9px] text-green-400 font-bold">Income</span>
                  <span className="text-[10px] font-black text-white">{fmtCurrency(tooltip.income)}</span>
                </div>
                <div className="flex justify-between gap-4 items-center">
                  <span className="text-[9px] text-red-400 font-bold">Expense</span>
                  <span className="text-[10px] font-black text-white">{fmtCurrency(tooltip.expenses)}</span>
                </div>
                <div className="border-t border-white/10 pt-1 flex justify-between gap-4 items-center">
                  <span className="text-[9px] text-blue-300 font-bold">Net</span>
                  <span className={`text-[10px] font-black ${tooltip.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tooltip.net >= 0 ? '+' : ''}{fmtCurrency(tooltip.net)}
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45 rounded-sm" />
            </div>
          )}

          {/* X-axis labels */}
          <div className="absolute left-10 right-0 bottom-0 flex text-[8px] font-black text-gray-400 pointer-events-none uppercase tracking-widest overflow-hidden h-6 items-end">
            {config.points.map((pt, i) => (
              <span
                key={i}
                className={`flex-1 text-center truncate pb-0.5 ${pt.isForecast ? 'text-blue-400/70' : ''}`}
              >
                {pt.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};



export const SubpageShell = ({ children, onBack, title, subtitle, actions }: { children?: React.ReactNode, onBack: () => void, title: string, subtitle?: string, actions?: React.ReactNode }) => (
  <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12 px-4 md:px-8">
    <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm sticky top-4 z-20 backdrop-blur-md bg-white/90">
      <div className="flex items-center gap-3">
         <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
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



export const Sidebar = ({
  activeTab,
  setActiveTab,
  onLogout,
  userProfile
}: {
  activeTab: string;
  setActiveTab: (id: string) => void;
  onLogout: () => void;
  userProfile?: UserProfile;
}) => {
  const navItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutGrid },
    { id: 'BUDGET', label: 'Budget', icon: Wallet },
    { id: 'TAXES', label: 'Taxes', icon: Calculator },
    { id: 'INVOICING', label: 'Invoicing', icon: FileText },
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 h-screen fixed left-0 top-0 hidden md:flex flex-col z-50 transition-colors duration-200">
      <div className="p-8 flex items-center gap-2">
        <div className="bg-opex-teal rounded-xl p-2 text-white">
          <Hexagon size={24} fill="currentColor" />
        </div>
        <span className="text-2xl font-bold text-opex-teal dark:text-teal-400 tracking-tight">opex</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id || (item.id === 'DASHBOARD' && ['INCOME', 'EXPENSES', '[]', 'QUICK_INCOME', 'QUICK_EXPENSE', 'QUICK_INVOICE'].includes(activeTab)) || (item.id === 'BUDGET' && ['INSIGHTS'].includes(activeTab)) || (item.id === 'SETTINGS' && activeTab.startsWith('SETTINGS_'));

          return (
            <button
              key={item.id}
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
               {userProfile?.logo
                 ? <img src={userProfile.logo} alt="User" className="w-full h-full object-cover" />
                 : <span className="text-sm font-black text-opex-teal select-none">
                     {(userProfile?.name ?? '?').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?'}
                   </span>
               }
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
};

export const TopBar = ({ title }: { title: string }) => (
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
