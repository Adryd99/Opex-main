import { ArrowRight, Lock, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const RecurringWidget = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation('dashboard');

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl pointer-events-auto select-none">
        <div className="flex flex-col items-center gap-2 text-center px-4">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Lock size={16} className="text-gray-400" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-700 tracking-tight">{t('recurring.comingSoon')}</p>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">{t('recurring.inDevelopment')}</p>
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

        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t('recurring.title')}</p>

        <div className="space-y-1 mb-4 w-full">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('recurring.income')}</span>
            <span className="text-sm font-black text-emerald-600">€2,400</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('recurring.expenses')}</span>
            <span className="text-sm font-bold text-gray-900">€340</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between w-full">
          <p className="text-[9px] font-bold text-gray-400 truncate">
            {t('recurring.next')}: <span className="text-gray-900">Figma €15 · 2d</span>
          </p>
          <div className="text-opex-teal shrink-0">
            <ArrowRight size={14} />
          </div>
        </div>
      </button>
    </div>
  );
};
