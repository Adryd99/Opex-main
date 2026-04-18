export type LegalDocumentSlug = 'privacy' | 'terms' | 'cookies' | 'open-banking';

export const getLegalDocumentPath = (slug?: LegalDocumentSlug | null) => {
  if (!slug) {
    return '/legal';
  }

  return `/legal/${slug}`;
};

export const openLegalDocument = (slug: LegalDocumentSlug) => {
  window.location.assign(getLegalDocumentPath(slug));
};

export { DEFAULT_LEGAL_PUBLIC_INFO } from './defaultPublicInfo';
export {
  clearStoredLegalConsents,
  mergeStoredLegalConsents,
  persistOpenBankingConsentLocally,
  persistRequiredLegalConsentsLocally,
  syncStoredLegalConsents
} from './localConsentStorage';
