import { Sparkles } from 'lucide-react';

export const TaxReserveSuggestion = ({
  title,
  description,
  actionLabel,
  onAccept
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAccept: () => void;
}) => {
  return (
    <div className="rounded-[1.5rem] border border-amber-200/80 bg-amber-50/80 px-5 py-4 shadow-sm dark:border-amber-300/20 dark:bg-amber-400/10">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-300/15 dark:text-amber-200">
          <Sparkles size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-app-primary">{title}</p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-app-secondary">
            {description}
          </p>
          <button
            type="button"
            onClick={onAccept}
            className="mt-3 inline-flex h-9 items-center justify-center rounded-[0.9rem] border border-amber-300/80 bg-white px-4 text-xs font-black text-amber-800 transition-colors hover:bg-amber-100/60 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100 dark:hover:bg-amber-300/20"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
