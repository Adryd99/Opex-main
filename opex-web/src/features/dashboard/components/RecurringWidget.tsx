import { ArrowRight, Lock, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const RecurringWidget = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation('dashboard');

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-app-surface/75 backdrop-blur-sm pointer-events-auto select-none">
        <div className="flex flex-col items-center gap-2 px-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-muted">
            <Lock size={16} className="text-app-tertiary" />
          </div>
          <div>
            <p className="text-xs font-black tracking-tight text-app-primary">{t('recurring.comingSoon')}</p>
            <p className="mt-0.5 text-[10px] font-medium text-app-tertiary">{t('recurring.inDevelopment')}</p>
          </div>
        </div>
      </div>

      <button
        onClick={onClick}
        className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-app-border bg-app-surface p-5 text-left shadow-sm transition-all duration-200 pointer-events-none select-none"
        style={{ filter: 'blur(2px)', opacity: 0.5 }}
        disabled
      >
        <div className="mb-4 flex w-full items-start justify-between">
          <div className="rounded-xl bg-app-muted p-2 text-app-secondary">
            <RefreshCw size={18} />
          </div>
        </div>

        <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-app-tertiary">{t('recurring.title')}</p>

        <div className="mb-4 w-full space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-app-tertiary">{t('recurring.income')}</span>
            <span className="text-sm font-black text-emerald-600">EUR 2,400</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-app-tertiary">{t('recurring.expenses')}</span>
            <span className="text-sm font-bold text-app-primary">EUR 340</span>
          </div>
        </div>

        <div className="mt-auto flex w-full items-center justify-between">
          <p className="truncate text-[9px] font-bold text-app-tertiary">
            {t('recurring.next')}: <span className="text-app-primary">Figma EUR 15 · 2d</span>
          </p>
          <div className="shrink-0 text-opex-teal">
            <ArrowRight size={14} />
          </div>
        </div>
      </button>
    </div>
  );
};
