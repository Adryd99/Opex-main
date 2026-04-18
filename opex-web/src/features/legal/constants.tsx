import type { ComponentType } from 'react';
import { Building2, Cookie, FileText, ShieldCheck } from 'lucide-react';

import type { LegalDocumentSlug } from '../../shared/legal';

type LegalDocumentIcon = ComponentType<{
  size?: number;
  className?: string;
}>;

export type LegalDocumentDefinition = {
  slug: LegalDocumentSlug;
  label: string;
  eyebrow: string;
  helper: string;
  icon: LegalDocumentIcon;
};

export const LEGAL_DOCUMENT_DEFINITIONS: Record<LegalDocumentSlug, LegalDocumentDefinition> = {
  privacy: {
    slug: 'privacy',
    label: 'Privacy Notice',
    eyebrow: 'Privacy',
    helper: 'How Opex collects, stores, and protects account and workspace data.',
    icon: ShieldCheck
  },
  terms: {
    slug: 'terms',
    label: 'Terms of Service',
    eyebrow: 'Terms',
    helper: 'The contractual rules for using Opex and its connected services.',
    icon: FileText
  },
  cookies: {
    slug: 'cookies',
    label: 'Cookie Notice',
    eyebrow: 'Cookies',
    helper: 'Browser storage, consent preferences, and essential runtime keys.',
    icon: Cookie
  },
  'open-banking': {
    slug: 'open-banking',
    label: 'Open Banking Notice',
    eyebrow: 'Open Banking',
    helper: 'What happens when banking connections are created through Salt Edge.',
    icon: Building2
  }
};

export const LEGAL_DOCUMENT_ORDER = Object.keys(LEGAL_DOCUMENT_DEFINITIONS) as LegalDocumentSlug[];
