import { ArrowLeft, ExternalLink, Loader2, Shield } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { opexApi } from '../../services/api/opexApi';
import { getLegalDocumentPath, type LegalDocumentSlug } from '../../shared/legal';
import type { LegalPublicInfoRecord } from '../../shared/types';
import { LEGAL_DOCUMENT_DEFINITIONS, LEGAL_DOCUMENT_ORDER } from './constants';
import { LegalDocumentArticle } from './LegalDocumentArticle';
import { resolveLegalDocument } from './support';

const updateLegalUrl = (slug: LegalDocumentSlug) => {
  const targetPath = getLegalDocumentPath(slug);
  if (window.location.pathname !== targetPath) {
    window.history.replaceState({}, document.title, targetPath);
  }
};

export const LegalCenterPage = ({ initialSlug }: { initialSlug: LegalDocumentSlug }) => {
  const [legalInfo, setLegalInfo] = useState<LegalPublicInfoRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<LegalDocumentSlug>(initialSlug);

  useEffect(() => {
    setSelectedSlug(initialSlug);
  }, [initialSlug]);

  useEffect(() => {
    let isMounted = true;

    void opexApi.getLegalPublicInfo()
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        setLegalInfo(payload);
        setErrorMessage(null);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : 'Unable to load the legal center.');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeDocument = useMemo(
    () => resolveLegalDocument(legalInfo, selectedSlug),
    [legalInfo, selectedSlug]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f3] px-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
          <Loader2 size={28} className="mx-auto animate-spin text-opex-dark" />
          <p className="mt-4 text-sm font-bold text-slate-500">Loading legal center...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !legalInfo || !activeDocument) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f3] px-6">
        <div className="max-w-lg rounded-[2rem] border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
          <p className="text-lg font-black text-slate-900">Legal center unavailable</p>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
            {errorMessage ?? 'The requested legal document could not be loaded.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-[1rem] bg-opex-dark px-5 text-sm font-black text-white"
          >
            Return to Opex
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f3] px-6 py-8 text-slate-900 md:px-10 md:py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 px-6 py-7 md:grid-cols-[1.2fr_0.8fr] md:px-8 md:py-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
                <Shield size={14} />
                Legal Center
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-opex-dark md:text-5xl">
                One place for privacy, terms, cookies and open banking.
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-slate-500 md:text-base">
                Review every public legal document used across the product. The same content is reused inside onboarding and banking flows, so this page stays the canonical source.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => window.location.assign('/')}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] border border-slate-200 bg-white px-4 text-sm font-black text-slate-500 transition-colors hover:border-slate-300 hover:text-opex-dark"
                >
                  <ArrowLeft size={16} />
                  Back to App
                </button>
                <a
                  href={`mailto:${legalInfo.controller.privacyEmail}`}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] bg-opex-dark px-4 text-sm font-black text-white"
                >
                  Contact Privacy
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {LEGAL_DOCUMENT_ORDER.map((slug) => {
                const definition = LEGAL_DOCUMENT_DEFINITIONS[slug];
                const isSelected = slug === selectedSlug;
                const Icon = definition.icon;

                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => {
                      setSelectedSlug(slug);
                      updateLegalUrl(slug);
                    }}
                    className={`rounded-[1.6rem] border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-opex-dark bg-opex-dark text-white shadow-[0_24px_60px_-30px_rgba(12,33,49,0.55)]'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${isSelected ? 'text-white/65' : 'text-slate-400'}`}>
                          {definition.eyebrow}
                        </p>
                        <p className="mt-2 text-lg font-black">
                          {definition.label}
                        </p>
                      </div>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-[1rem] ${isSelected ? 'bg-white/10 text-white' : 'bg-white text-opex-dark'}`}>
                        <Icon size={18} />
                      </div>
                    </div>
                    <p className={`mt-3 text-sm font-medium leading-relaxed ${isSelected ? 'text-white/75' : 'text-slate-500'}`}>
                      {definition.helper}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <LegalDocumentArticle document={activeDocument} />

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Controller</p>
              <p className="mt-3 text-lg font-black text-slate-900">{legalInfo.controller.name}</p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">{legalInfo.controller.address}</p>
              <div className="mt-5 space-y-2 text-sm font-medium text-slate-600">
                <p><span className="font-black text-slate-900">Privacy:</span> {legalInfo.controller.privacyEmail}</p>
                <p><span className="font-black text-slate-900">Support:</span> {legalInfo.controller.supportEmail}</p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Processors</p>
              <div className="mt-4 space-y-4">
                {legalInfo.processors.map((processor) => (
                  <div key={processor.name} className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                    <p className="text-sm font-black text-slate-900">{processor.name}</p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{processor.purpose}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Essential Storage</p>
              <div className="mt-4 space-y-3">
                {legalInfo.storageTechnologies
                  .filter((technology) => technology.essential)
                  .slice(0, 4)
                  .map((technology) => (
                    <div key={technology.key} className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                      <p className="text-sm font-black text-slate-900">{technology.name}</p>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{technology.purpose}</p>
                    </div>
                  ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};
