import { ExternalLink, X } from 'lucide-react';

import { getLegalDocumentPath, type LegalDocumentSlug } from '../../shared/legal';
import type { LegalPublicInfoRecord } from '../../shared/types';
import { LEGAL_DOCUMENT_DEFINITIONS } from './constants';
import { LegalDocumentArticle } from './LegalDocumentArticle';
import { resolveLegalDocument } from './support';

export const LegalDocumentModal = ({
  legalInfo,
  slug,
  onClose
}: {
  legalInfo: LegalPublicInfoRecord | null;
  slug: LegalDocumentSlug | null;
  onClose: () => void;
}) => {
  const activeDocument = slug ? resolveLegalDocument(legalInfo, slug) : null;

  if (!slug || !activeDocument) {
    return null;
  }

  const definition = LEGAL_DOCUMENT_DEFINITIONS[slug];
  const Icon = definition.icon;

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-[8px]">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2.5rem] border border-white/70 bg-[#f7f7f3] shadow-[0_36px_90px_-34px_rgba(15,23,42,0.55)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 bg-white/80 px-6 py-5 backdrop-blur-sm md:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-opex-dark text-white shadow-lg shadow-slate-900/10">
              <Icon size={20} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                {definition.eyebrow}
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-opex-dark">
                {definition.label}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={getLegalDocumentPath(slug)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition-colors hover:border-slate-300 hover:text-opex-dark"
            >
              Open full page
              <ExternalLink size={16} />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-opex-dark"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-4 py-4 md:px-6 md:py-6">
          <LegalDocumentArticle document={activeDocument} />
        </div>
      </div>
    </div>
  );
};
