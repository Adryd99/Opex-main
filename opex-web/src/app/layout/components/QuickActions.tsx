import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

import { QUICK_ACTION_ITEMS } from '../support';

type QuickActionsProps = {
  compact?: boolean;
  onNavigate?: (tab: string) => void;
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
