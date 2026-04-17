import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Cookie,
  ExternalLink,
  FileText,
  Loader2,
  ShieldCheck
} from 'lucide-react';

import { LegalDocumentRecord, LegalPublicInfoRecord } from '../../shared/types';
import { opexApi } from '../../services/api/opexApi';

export type LegalDocumentSlug = 'privacy' | 'terms' | 'cookies' | 'open-banking';

const LEGAL_DOCUMENT_LABELS: Record<LegalDocumentSlug, { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  privacy: { label: 'Privacy Notice', icon: ShieldCheck },
  terms: { label: 'Terms', icon: FileText },
  cookies: { label: 'Cookies', icon: Cookie },
  'open-banking': { label: 'Open Banking', icon: Building2 }
};

const resolveDocument = (info: LegalPublicInfoRecord | null, slug: LegalDocumentSlug): LegalDocumentRecord | null => {
  if (!info) {
    return null;
  }

  if (slug === 'privacy') {
    return info.privacyPolicy;
  }
  if (slug === 'terms') {
    return info.termsOfService;
  }
  if (slug === 'cookies') {
    return info.cookiePolicy;
  }
  return info.openBankingNotice;
};

export const resolveLegalDocumentSlug = (pathname: string): LegalDocumentSlug | null => {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  switch (normalizedPath) {
    case '/legal/privacy':
      return 'privacy';
    case '/legal/terms':
      return 'terms';
    case '/legal/cookies':
      return 'cookies';
    case '/legal/open-banking':
      return 'open-banking';
    default:
      return null;
  }
};

export const LegalDocumentPage = ({ slug }: { slug: LegalDocumentSlug }) => {
  const [legalInfo, setLegalInfo] = useState<LegalPublicInfoRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load legal documents.');
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

  const activeDocument = useMemo(() => resolveDocument(legalInfo, slug), [legalInfo, slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f7f3] flex items-center justify-center px-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
          <Loader2 size={28} className="mx-auto animate-spin text-opex-dark" />
          <p className="mt-4 text-sm font-bold text-slate-500">Loading legal document...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !activeDocument || !legalInfo) {
    return (
      <div className="min-h-screen bg-[#f7f7f3] flex items-center justify-center px-6">
        <div className="max-w-lg rounded-[2rem] border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
          <p className="text-lg font-black text-slate-900">Legal document unavailable</p>
          <p className="mt-3 text-sm font-medium text-slate-500">{errorMessage ?? 'The requested document could not be found.'}</p>
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
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Legal Center</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-opex-dark md:text-4xl">{activeDocument.title}</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">{activeDocument.summary}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span>Version {activeDocument.version || 'n/a'}</span>
              <span>Updated {activeDocument.lastUpdated || 'n/a'}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="px-3 pb-3 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Documents</p>
            <div className="space-y-2">
              {(Object.keys(LEGAL_DOCUMENT_LABELS) as LegalDocumentSlug[]).map((documentSlug) => {
                const documentLabel = LEGAL_DOCUMENT_LABELS[documentSlug];
                const isActive = slug === documentSlug;

                return (
                  <button
                    key={documentSlug}
                    type="button"
                    onClick={() => window.location.assign(`/legal/${documentSlug}`)}
                    className={`flex w-full items-center gap-3 rounded-[1.2rem] px-4 py-3 text-left text-sm font-black transition-all ${
                      isActive
                        ? 'bg-opex-dark text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <documentLabel.icon size={18} />
                    {documentLabel.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Controller</p>
              <p className="mt-2 text-sm font-black text-slate-900">{legalInfo.controller.name}</p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">{legalInfo.controller.address}</p>
            </div>
          </aside>

          <main className="space-y-4">
            {activeDocument.sections.map((section) => (
              <section key={section.title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
                <h2 className="text-xl font-black tracking-tight text-slate-900">{section.title}</h2>
                <div className="mt-5 space-y-3">
                  {section.bullets.map((bullet, index) => (
                    <div key={`${section.title}-${index}`} className="flex items-start gap-3">
                      <div className="mt-2 h-2 w-2 rounded-full bg-opex-dark/70" />
                      <p className="text-sm font-medium leading-relaxed text-slate-600">{bullet}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </main>
        </div>
      </div>
    </div>
  );
};
