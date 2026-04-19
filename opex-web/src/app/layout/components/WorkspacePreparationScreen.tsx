import opesLargeLogo from '../../../shared/assets/Opes_large.png';

const LoadingDot = ({ delayMs }: { delayMs: number }) => (
  <span
    className="h-2.5 w-2.5 rounded-full bg-opex-teal/80 animate-bounce"
    style={{ animationDelay: `${delayMs}ms`, animationDuration: '1.1s' }}
  />
);

export const WorkspacePreparationScreen = () => (
  <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(17,183,165,0.12),_transparent_38%),linear-gradient(180deg,_#fbfcfd_0%,_#f4f7f8_100%)]">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute left-1/2 top-[16%] h-64 w-64 -translate-x-1/2 rounded-full bg-opex-teal/10 blur-3xl" />
      <div className="absolute bottom-[12%] right-[14%] h-56 w-56 rounded-full bg-opex-dark/5 blur-3xl" />
      <div className="absolute left-[10%] top-[55%] h-40 w-40 rounded-full bg-emerald-200/30 blur-3xl" />
    </div>

    <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto flex w-fit flex-col items-center gap-8">
          <div className="rounded-[2.5rem] border border-white/70 bg-white/80 px-10 py-8 shadow-[0_24px_80px_rgba(11,36,53,0.08)] backdrop-blur-sm">
            <img src={opesLargeLogo} alt="Opex" className="h-24 w-auto object-contain sm:h-28" />
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.38em] text-gray-400">
              Opex Workspace
            </p>
            <h1 className="text-3xl font-black tracking-tight text-opex-dark sm:text-4xl">
              Preparing your workspace
            </h1>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-500 sm:text-base">
              We are syncing your profile, security status and latest banking data before the app opens.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white/75 px-5 py-3 shadow-sm backdrop-blur-sm">
            <LoadingDot delayMs={0} />
            <LoadingDot delayMs={120} />
            <LoadingDot delayMs={240} />
          </div>
        </div>
      </div>
    </div>
  </div>
);
