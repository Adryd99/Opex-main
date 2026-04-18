import type { LegalDocumentRecord, LegalPublicInfoRecord } from '../../../../shared/types/legal';
import { toRecord, toRecordList, toStringList, toStringValue } from './support';

const normalizeLegalDocument = (
  payload: unknown,
  fallbackSlug: string,
  fallbackTitle: string
): LegalDocumentRecord => {
  const item = toRecord(payload);

  return {
    slug: toStringValue(item.slug, fallbackSlug),
    title: toStringValue(item.title, fallbackTitle),
    version: toStringValue(item.version),
    lastUpdated: toStringValue(item.lastUpdated),
    summary: toStringValue(item.summary),
    sections: toRecordList(item.sections).map((section) => ({
      title: toStringValue(section.title),
      bullets: toStringList(section.bullets)
    }))
  };
};

export const normalizeLegalPublicInfo = (payload: unknown): LegalPublicInfoRecord => {
  const raw = toRecord(payload);
  const controller = toRecord(raw.controller);

  return {
    controller: {
      name: toStringValue(controller.name),
      address: toStringValue(controller.address),
      privacyEmail: toStringValue(controller.privacyEmail),
      dpoEmail: toStringValue(controller.dpoEmail),
      supportEmail: toStringValue(controller.supportEmail),
      supervisoryAuthority: toStringValue(controller.supervisoryAuthority)
    },
    processors: toRecordList(raw.processors).map((item) => ({
      name: toStringValue(item.name),
      purpose: toStringValue(item.purpose),
      dataCategories: toStringValue(item.dataCategories),
      region: toStringValue(item.region)
    })),
    storageTechnologies: toRecordList(raw.storageTechnologies).map((item) => ({
      name: toStringValue(item.name),
      key: toStringValue(item.key),
      purpose: toStringValue(item.purpose),
      duration: toStringValue(item.duration),
      essential: Boolean(item.essential)
    })),
    privacyPolicy: normalizeLegalDocument(raw.privacyPolicy, 'privacy', 'Privacy Notice'),
    termsOfService: normalizeLegalDocument(raw.termsOfService, 'terms', 'Terms of Service'),
    cookiePolicy: normalizeLegalDocument(raw.cookiePolicy, 'cookies', 'Cookie And Storage Notice'),
    openBankingNotice: normalizeLegalDocument(
      raw.openBankingNotice,
      'open-banking',
      'Open Banking Data Notice'
    )
  };
};
