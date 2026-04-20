import type { ComponentType } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

type ClickableStatProps = {
  title: string;
  amount: string;
  currencySymbol?: string;
  trend?: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  trendUp?: boolean;
  onClick: () => void;
};

export const ClickableStat = ({
  title,
  amount,
  currencySymbol = '€',
  trend,
  icon: Icon,
  trendUp = true,
  onClick
}: ClickableStatProps) => (
  <button
    onClick={onClick}
    className="group flex w-full flex-col justify-center overflow-hidden rounded-2xl border border-app-border bg-app-surface p-5 text-left shadow-sm transition-all duration-200 hover:border-opex-teal/30 hover:bg-app-muted/80 hover:shadow-md active:scale-[0.98]"
  >
    <div className="flex justify-between items-start mb-3 w-full">
      <div className="rounded-xl bg-app-muted p-2 text-app-secondary transition-colors group-hover:bg-opex-teal group-hover:text-white dark:group-hover:text-slate-950">
        <Icon size={18} />
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${trendUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />} {trend}
        </span>
      )}
    </div>
    <p className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-app-tertiary">{title}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-bold text-app-tertiary">{currencySymbol}</span>
      <span className="text-xl font-bold tracking-tight text-app-primary">{amount}</span>
    </div>
  </button>
);
