import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, ChevronDown, Check, Bell, ArrowUp, Plus, ArrowDownRight, Receipt, Building2, Hexagon, ArrowLeft } from 'lucide-react';
import { ACCOUNTS, MOCK_NOTIFICATIONS } from '../../models/mockData';

export const AccountSelector = ({ compact = false }: { compact?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('all');
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

  const selectedAccount = ACCOUNTS.find(a => a.id === selectedAccountId) || ACCOUNTS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`${compact ? 'h-8 px-2 rounded-lg' : 'h-12 px-4 rounded-2xl'} bg-white border border-gray-100 shadow-sm hover:border-opex-teal/30 hover:shadow-md transition-all flex items-center gap-3 group active:scale-95`}
      >
        <div className={`w-6 h-6 rounded-lg ${selectedAccount.color} text-white flex items-center justify-center text-[10px] font-black shadow-sm`}>
          {selectedAccountId === 'all' ? <LayoutGrid size={12} /> : selectedAccount.icon}
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
          {ACCOUNTS.map((acc) => (
            <button 
              key={acc.id}
              onClick={() => {
                setSelectedAccountId(acc.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group ${selectedAccountId === acc.id ? 'bg-gray-50' : ''}`}
            >
              <div className={`w-8 h-8 ${acc.color} text-white rounded-lg flex items-center justify-center font-black text-xs transition-transform group-hover:scale-110`}>
                {acc.id === 'all' ? <LayoutGrid size={16} /> : acc.icon}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-700 leading-none">{acc.name}</p>
                <p className="text-[10px] text-gray-400 font-medium mt-1">{acc.type}</p>
              </div>
              {selectedAccountId === acc.id && (
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

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => n.unread).length;

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
            {MOCK_NOTIFICATIONS.map((notif) => (
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
