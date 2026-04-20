import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BrandLogo } from '../../../shared/branding';

import { AccountSelector } from './AccountSelector';
import { NotificationButton } from './NotificationButton';

type SubpageShellProps = {
  children?: ReactNode;
  onBack: () => void;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  variant?: 'default' | 'embedded';
};

export const SubpageShell = ({
  children,
  onBack,
  title,
  subtitle,
  actions,
  variant = 'default'
}: SubpageShellProps) => {
  const { t } = useTranslation('app');

  if (variant === 'embedded') {
    return (
      <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12 px-4 md:px-6">
        <div className="flex items-start gap-3 px-1 pt-2">
          <button
            type="button"
            onClick={onBack}
            aria-label={t('subpage.back')}
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-app-border bg-app-surface text-app-secondary transition-colors hover:bg-app-muted"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-app-tertiary">
              {t('pageTitles.settings')}
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-app-primary">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-sm font-medium text-app-secondary">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12 px-4 md:px-8">
      <div className="flex items-center justify-between bg-app-surface/90 p-4 rounded-3xl border border-app-border shadow-sm sticky top-4 z-20 backdrop-blur-md transition-colors duration-200">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} aria-label={t('subpage.back')} className="p-2 hover:bg-app-muted rounded-xl transition-colors text-app-secondary">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <BrandLogo variant="large" className="h-8 w-auto object-contain" />
              <span className="mx-2 text-app-border">/</span>
              <span className="font-bold text-app-primary">{title}</span>
            </div>
            {subtitle && <p className="text-[10px] text-app-secondary font-medium ml-11 -mt-1">{subtitle}</p>}
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
};
