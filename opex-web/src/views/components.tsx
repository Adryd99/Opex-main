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
  Receipt,
  ArrowLeft,
  Calculator,
  FileText,
  Check,
  RefreshCw,
  ChevronDown,
  Bell
} from 'lucide-react';
import { TimeAggregatedRecord } from '../models/types';

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

  const unreadCount = [].filter(n => n.unread).length;

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
            <button className="text-[10px] font-black text-opex-teal uppercase tracking-widest hover:underline">Mark as read</button>
          </div>
          <div className="max-h-[400px] overflow-y-auto no-scrollbar px-2">
            {[].map((notif) => (
              <div key={notif.id} className={`p-4 flex gap-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group ${notif.unread ? 'bg-opex-teal/[0.02]' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  notif.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                  notif.type === 'danger' ? 'bg-red-100 text-red-600' :
                  notif.type === 'success' ? 'bg-green-100 text-green-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <notif.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm font-bold leading-none mb-1 ${notif.unread ? 'text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{notif.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed truncate-2-lines">{notif.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 pt-4 border-t border-gray-50 mt-2">
            <button className="w-full py-3 bg-gray-50 rounded-xl text-xs font-black text-gray-400 hover:text-opex-teal transition-colors">View all notifications</button>
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
    className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className} overflow-hidden flex flex-col h-full ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200 transition-all active:scale-[0.99]' : ''}`}
  >
    {(title || action) && (
      <div className="flex justify-between items-center px-6 py-2.5 border-b border-gray-50">
        {title && <h3 className="font-black text-gray-900 text-[10px] uppercase tracking-widest">{title}</h3>}
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
  <button 
    onClick={onClick}
    className="flex flex-col text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-opex-teal/30 hover:bg-gray-50/30 active:scale-[0.98] group w-full h-full"
  >
    <div className="flex justify-between items-start mb-4 w-full">
      <div className="p-2 bg-gray-50 rounded-xl text-gray-600 group-hover:bg-opex-teal group-hover:text-white transition-colors">
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
      <div className="text-opex-teal group-hover:translate-x-1 transition-transform shrink-0">
        <ArrowRight size={14} />
      </div>
    </div>
  </button>
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
    { label: 'Add Invoice', icon: Receipt, color: 'text-blue-500', bg: 'bg-blue-50', id: 'QUICK_INVOICE' },
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


export const ForecastCompactWidget = ({ timeAggregatedSummary }: { timeAggregatedSummary: TimeAggregatedRecord }) => {
  const [period, setPeriod] = useState('Month');
  const [hoveredBar, setHoveredBar] = useState<{ label: string, value: string, color: string, x: string, y: string } | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string, value: string, x: number, y: number } | null>(null);

  const config = useMemo(() => {
    const pointsByPeriod =
      period === 'Quarter'
        ? timeAggregatedSummary.byQuarter
        : period === 'Year'
          ? timeAggregatedSummary.byYear
          : timeAggregatedSummary.byMonth;

    const points = pointsByPeriod.length > 0
      ? pointsByPeriod
      : [{ key: 'empty', label: 'No data', income: 0, expenses: 0 }];

    const labels = points.map((point) => point.label);
    const inEuros = points.map((point) => Math.max(Number(point.income || 0), 0));
    const outEuros = points.map((point) => Math.abs(Number(point.expenses || 0)));
    const rawIn = inEuros.map((value) =>
      new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
    );
    const rawOut = outEuros.map((value) =>
      new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
    );
    const netEuros = inEuros.map((v, i) => v - outEuros[i]);
    const maxE = Math.max(...inEuros, ...outEuros, 0);
    const minNet = Math.min(...netEuros, 0);
    const padding = Math.max(maxE * 0.1, 1);
    const yMin = minNet < 0 ? minNet - padding : 0;
    const yMax = maxE + padding;
    const yRange = yMax - yMin;

    const getY = (euro: number) => {
      if (yRange <= 0) {
        return 100;
      }
      return 100 * (1 - (euro - yMin) / yRange);
    };

    const getBarY = (value: number) => {
      const baseY = getY(0);
      const valueY = getY(value);
      return Math.min(baseY, valueY);
    };

    const getBarHeight = (value: number) => {
      const baseY = getY(0);
      const valueY = getY(value);
      return Math.max(Math.abs(baseY - valueY), 0.6);
    };

    const lineData = inEuros.map((_e, i) => {
      const netValue = netEuros[i];
      return {
        label: labels[i],
        net: netValue,
        y: getY(netValue)
      };
    });

    const yStep = yRange / 4;
    const yLabels = Array.from({ length: 5 }).map((_, i) => {
      const val = yMax - (i * yStep);
      const absVal = Math.abs(val);
      if (absVal >= 1_000_000) return `${val < 0 ? '-' : ''}${Math.round(absVal / 1_000_000)}M`;
      if (absVal >= 1000) return `${val < 0 ? '-' : ''}${Math.round(absVal / 1000)}K`;
      return `${Math.round(val)}`;
    });

    return {
      labels,
      inEuros,
      outEuros,
      netEuros,
      raw: { in: rawIn, out: rawOut },
      yLabels,
      projectionIndex: Math.max(labels.length - 1, 0),
      lineData,
      getY,
      getBarY,
      getBarHeight
    };
  }, [period, timeAggregatedSummary]);

  return (
    <Card 
      title="6-Month Sustainability Forecast" 
      noPadding
      action={
        <div className="flex items-center gap-4 scale-90 origin-right">
          <ToggleFilter 
            options={['Month', 'Quarter', 'Year']} 
            active={period} 
            onChange={setPeriod} 
          />
          <div className="hidden sm:flex items-center gap-3 mr-3">
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div><span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Income</span></div>
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div><span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Expense</span></div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col p-4">
        <div className="relative h-36 w-full group">
          {/* Y-axis labels */}
          <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-[8px] font-black text-gray-300 pb-5 pointer-events-none w-8">
            {config.yLabels.map((l, i) => <span key={i}>{l}</span>)}
          </div>

          {/* Grid lines */}
          <div className="absolute left-10 right-0 inset-y-0 flex flex-col justify-between pb-5 pointer-events-none">
            {[0, 1, 2, 3].map(i => <div key={i} className="w-full border-t border-gray-100"></div>)}
            <div className="w-full border-t border-gray-200"></div>
          </div>

          {/* Forecast Area Shading (only covering the last bar) */}
          <div 
            className="absolute top-0 right-0 bottom-5 bg-gray-50/40 border-l border-dashed border-gray-200 pointer-events-none transition-all duration-500"
            style={{ width: `${(1 / config.labels.length) * 100}%` }}
          ></div>

          {/* Chart Content SVG */}
          <div className="absolute left-10 right-0 bottom-5 h-[calc(100%-1.25rem)] w-[calc(100%-2.5rem)]">
            <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" preserveAspectRatio="none">
              {config.labels.map((label, i) => {
                const barWidthPercent = 100 / config.labels.length;
                const xPos = i * barWidthPercent;
                const isForecast = i === config.projectionIndex;
                
                return (
                  <g key={i}>
                    {/* Income Bar */}
                    <rect 
                      x={xPos + barWidthPercent * 0.1} 
                      y={config.getBarY(config.inEuros[i])} 
                      width={barWidthPercent * 0.35} 
                      height={config.getBarHeight(config.inEuros[i])} 
                      rx="2" 
                      fill="#22C55E" 
                      opacity={isForecast ? 0.3 : 0.8} 
                      className="transition-all duration-500 ease-out cursor-pointer hover:opacity-100"
                      onMouseEnter={() => setHoveredBar({ label, value: config.raw.in[i], color: 'text-green-600', x: `${xPos + barWidthPercent * 0.25}%`, y: `${config.getY(config.inEuros[i])}%` })}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                    {/* Expense Bar */}
                    <rect 
                      x={xPos + barWidthPercent * 0.5} 
                      y={config.getBarY(config.outEuros[i])} 
                      width={barWidthPercent * 0.35} 
                      height={config.getBarHeight(config.outEuros[i])} 
                      rx="2" 
                      fill="#EF4444" 
                      opacity={isForecast ? 0.3 : 0.8} 
                      className="transition-all duration-500 ease-out cursor-pointer hover:opacity-100"
                      onMouseEnter={() => setHoveredBar({ label, value: config.raw.out[i], color: 'text-red-600', x: `${xPos + barWidthPercent * 0.65}%`, y: `${config.getY(config.outEuros[i])}%` })}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                  </g>
                );
              })}

              {/* Trend Line (Net Result per Period) */}
              {(() => {
                const barWidthPercent = 100 / config.labels.length;
                const points = config.lineData.map((p, i) => ({
                  x: i * barWidthPercent + barWidthPercent / 2,
                  y: p.y,
                  label: p.label,
                  net: p.net
                }));
                
                const actualPoints = points.slice(0, config.projectionIndex);
                const forecastPoints = points.slice(config.projectionIndex - 1);
                
                const actualPath = actualPoints.length > 0 ? `M ${actualPoints.map(p => `${p.x} ${p.y}`).join(' L ')}` : '';
                const forecastPath = forecastPoints.length > 0 ? `M ${forecastPoints.map(p => `${p.x} ${p.y}`).join(' L ')}` : '';
                
                const lineColor = "#2F6FED"; // Professional blue
                const lineWeight = "2.15"; // Refined elegant weight
                const separatorX = config.projectionIndex * barWidthPercent;
                
                return (
                  <>
                    {/* Vertical Separator before Forecast */}
                    <line 
                      x1={separatorX} 
                      y1="0" 
                      x2={separatorX} 
                      y2="100" 
                      stroke="#F3F4F6" 
                      strokeWidth="0.8"
                      className="transition-all duration-500"
                    />

                    {/* Actual Segment */}
                    {actualPath && (
                      <path 
                        d={actualPath} 
                        fill="none" 
                        stroke={lineColor} 
                        strokeWidth={lineWeight} 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="transition-all duration-500" 
                        style={{ opacity: 0.91 }}
                      />
                    )}
                    
                    {/* Forecast Segment */}
                    {forecastPath && (
                      <path 
                        d={forecastPath} 
                        fill="none" 
                        stroke={lineColor} 
                        strokeWidth={lineWeight} 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        strokeDasharray="3 6"
                        vectorEffect="non-scaling-stroke"
                        className="transition-all duration-500" 
                        style={{ opacity: 1 }}
                      />
                    )}
                  </>
                );
              })()}
            </svg>

            {/* Markers rendered as divs to ensure perfect 1:1 circularity */}
            {(() => {
              const barWidthPercent = 100 / config.labels.length;
              const lineColor = "#2F6FED";
              return config.lineData.map((p, i) => (
                <div 
                  key={i} 
                  className="absolute w-[10px] h-[10px] rounded-full border-2 shadow-sm cursor-pointer hover:scale-125 transition-all duration-200 z-10"
                  style={{ 
                    left: `${i * barWidthPercent + barWidthPercent / 2}%`, 
                    top: `${p.y}%`,
                    backgroundColor: 'white',
                    borderColor: lineColor,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onMouseEnter={() => setHoveredPoint({ 
                    label: p.label, 
                    value: `Net: ${p.net >= 0 ? '+' : ''}€${Math.round(p.net).toLocaleString()}`, 
                    x: i * barWidthPercent + barWidthPercent / 2, 
                    y: p.y 
                  })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ));
            })()}
          </div>

          {/* Hover Tooltip (Bars) */}
          {hoveredBar && (
            <div 
              className="absolute bg-white px-3 py-2 rounded-xl shadow-2xl border border-gray-100 pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-200"
              style={{ left: hoveredBar.x, top: hoveredBar.y, transform: 'translate(-50%, -120%)' }}
            >
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{hoveredBar.label}</p>
               <p className={`text-sm font-black ${hoveredBar.color} leading-none`}>{hoveredBar.value}</p>
               <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-gray-100 rotate-45"></div>
            </div>
          )}

          {/* Hover Tooltip (Line Points) */}
          {hoveredPoint && (
            <div 
              className="absolute bg-gray-900 text-white px-3 py-2 rounded-xl shadow-2xl pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-200"
              style={{ left: `${hoveredPoint.x}%`, top: `${hoveredPoint.y}%`, transform: 'translate(-50%, -120%)' }}
            >
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{hoveredPoint.label}</p>
               <p className="text-sm font-black leading-none">{hoveredPoint.value}</p>
               <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          )}

          {/* X-axis labels */}
          <div className="absolute left-10 right-0 bottom-0 flex justify-between text-[8px] font-black text-gray-400 pt-2 pointer-events-none uppercase tracking-widest overflow-hidden">
            {config.labels.map((l, i) => (
              <span key={i} className="flex-1 text-center truncate px-1 transition-all duration-300">
                {l}
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
  onLogout
}: {
  activeTab: string;
  setActiveTab: (id: string) => void;
  onLogout: () => void;
}) => {
  const navItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutGrid },
    { id: 'BUDGET', label: 'Budget', icon: Wallet },
    { id: 'TAXES', label: 'Taxes', icon: Calculator },
    { id: 'INVOICING', label: 'Invoicing', icon: FileText },
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-100 h-screen fixed left-0 top-0 hidden md:flex flex-col z-50">
      <div className="p-8 flex items-center gap-2">
        <div className="bg-opex-teal rounded-xl p-2 text-white">
          <Hexagon size={24} fill="currentColor" />
        </div>
        <span className="text-2xl font-bold text-opex-teal tracking-tight">opex</span>
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
                  ? 'bg-opex-dark text-white shadow-md shadow-blue-900/10' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-50">
         <button
           type="button"
           onClick={onLogout}
           className="w-full bg-gray-50 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors text-left"
         >
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
               <img src="https://i.pravatar.cc/150?img=12" alt="User" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 text-left">
               <p className="text-sm font-bold text-gray-900 truncate">Post Malone</p>
               <p className="text-xs text-gray-500 truncate">malone@opex.com</p>
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
