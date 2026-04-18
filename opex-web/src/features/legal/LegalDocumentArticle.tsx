import type { LegalDocumentRecord } from '../../shared/types';

export const LegalDocumentArticle = ({
  document,
  className = ''
}: {
  document: LegalDocumentRecord;
  className?: string;
}) => {
  return (
    <article className={`space-y-5 ${className}`}>
      <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
          {document.slug.replace('-', ' ')}
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-opex-dark md:text-3xl">
          {document.title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-slate-500 md:text-[15px]">
          {document.summary}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
          <span>Version {document.version || 'n/a'}</span>
          <span>Updated {document.lastUpdated || 'n/a'}</span>
        </div>
      </header>

      {document.sections.map((section) => (
        <section
          key={`${document.slug}-${section.title}`}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-7"
        >
          <h3 className="text-xl font-black tracking-tight text-slate-900">
            {section.title}
          </h3>
          <div className="mt-5 space-y-3">
            {section.bullets.map((bullet, index) => (
              <div key={`${section.title}-${index}`} className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 rounded-full bg-opex-dark/70" />
                <p className="text-sm font-medium leading-relaxed text-slate-600 md:text-[15px]">
                  {bullet}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </article>
  );
};
