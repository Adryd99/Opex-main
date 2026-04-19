import { AlertCircle, type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

type SettingsSectionNoticeProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  tone?: 'warning' | 'info';
  action?: ReactNode;
};

export const SettingsSectionNotice = ({
  title,
  description,
  icon: Icon = AlertCircle,
  tone = 'warning',
  action
}: SettingsSectionNoticeProps) => {
  const toneClasses = tone === 'warning'
    ? {
        shell: 'border-amber-100 bg-amber-50/80',
        icon: 'bg-white text-amber-700 border-amber-100',
        title: 'text-amber-950',
        description: 'text-amber-800/80'
      }
    : {
        shell: 'border-blue-100 bg-blue-50/80',
        icon: 'bg-white text-blue-700 border-blue-100',
        title: 'text-slate-900',
        description: 'text-slate-600'
      };

  return (
    <div className={`rounded-[1.75rem] border px-5 py-4 ${toneClasses.shell}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${toneClasses.icon}`}>
            <Icon size={18} />
          </div>
          <div className="space-y-1">
            <p className={`text-sm font-black ${toneClasses.title}`}>{title}</p>
            <p className={`max-w-2xl text-sm font-medium leading-relaxed ${toneClasses.description}`}>
              {description}
            </p>
          </div>
        </div>
        {action ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
};
