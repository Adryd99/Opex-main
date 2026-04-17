export const openLegalDocument = (slug: 'privacy' | 'terms' | 'cookies' | 'open-banking') => {
  window.open(`/legal/${slug}`, '_blank', 'noopener,noreferrer');
};
