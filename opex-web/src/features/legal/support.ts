import type { LegalDocumentRecord, LegalPublicInfoRecord } from '../../shared/types';
import type { LegalDocumentSlug } from '../../shared/legal';

export const DEFAULT_LEGAL_DOCUMENT_SLUG: LegalDocumentSlug = 'privacy';

export const resolveLegalDocument = (
  info: LegalPublicInfoRecord | null,
  slug: LegalDocumentSlug
): LegalDocumentRecord | null => {
  if (!info) {
    return null;
  }

  switch (slug) {
    case 'privacy':
      return info.privacyPolicy;
    case 'terms':
      return info.termsOfService;
    case 'cookies':
      return info.cookiePolicy;
    case 'open-banking':
      return info.openBankingNotice;
    default:
      return null;
  }
};

export const resolveLegalCenterSlug = (pathname: string): LegalDocumentSlug | null => {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  switch (normalizedPath) {
    case '/legal':
      return DEFAULT_LEGAL_DOCUMENT_SLUG;
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
