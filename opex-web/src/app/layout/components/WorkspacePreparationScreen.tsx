import { useTranslation } from 'react-i18next';
import { BrandLogo } from '../../../shared/branding';

const LoadingDot = ({ delayMs }: { delayMs: number }) => (
  <span
    className="h-2.5 w-2.5 rounded-full bg-opex-teal/80 animate-bounce"
    style={{ animationDelay: `${delayMs}ms`, animationDuration: '1.1s' }}
  />
);

export const WorkspacePreparationScreen = () => {
  const { t } = useTranslation('app');

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-app-base transition-colors duration-200"
      style={{
        backgroundImage:
          'radial-gradient(circle at top, rgb(var(--boot-glow-top) / 0.18), transparent 38%), linear-gradient(180deg, rgb(var(--boot-background-start)) 0%, rgb(var(--boot-background-end)) 100%)'
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-[16%] h-64 w-64 -translate-x-1/2 rounded-full bg-opex-teal/10 blur-3xl" />
        <div className="absolute bottom-[12%] right-[14%] h-56 w-56 rounded-full bg-app-primary/5 blur-3xl" />
        <div className="absolute left-[10%] top-[55%] h-40 w-40 rounded-full bg-emerald-200/30 dark:bg-emerald-300/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto flex w-fit flex-col items-center gap-8">
            <div className="rounded-[2.5rem] border border-white/10 bg-app-surface/80 px-10 py-8 shadow-[0_24px_80px_rgba(11,36,53,0.08)] backdrop-blur-sm transition-colors duration-200">
              <BrandLogo variant="large" className="h-24 w-auto object-contain sm:h-28" />
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.38em] text-app-tertiary">{t('workspacePreparation.badge')}</p>
              <h1 className="text-3xl font-black tracking-tight text-app-primary sm:text-4xl">
                {t('workspacePreparation.title')}
              </h1>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-app-secondary sm:text-base">
                {t('workspacePreparation.description')}
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-app-surface/75 px-5 py-3 shadow-sm backdrop-blur-sm transition-colors duration-200">
              <LoadingDot delayMs={0} />
              <LoadingDot delayMs={120} />
              <LoadingDot delayMs={240} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
