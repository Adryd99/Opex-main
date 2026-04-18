export interface LegalSectionRecord {
  title: string;
  bullets: string[];
}

export interface LegalDocumentRecord {
  slug: string;
  title: string;
  version: string;
  lastUpdated: string;
  summary: string;
  sections: LegalSectionRecord[];
}

export interface LegalControllerContactRecord {
  name: string;
  address: string;
  privacyEmail: string;
  dpoEmail: string;
  supportEmail: string;
  supervisoryAuthority: string;
}

export interface LegalProcessorRecord {
  name: string;
  purpose: string;
  dataCategories: string;
  region: string;
}

export interface LegalStorageTechnologyRecord {
  name: string;
  key: string;
  purpose: string;
  duration: string;
  essential: boolean;
}

export interface LegalPublicInfoRecord {
  controller: LegalControllerContactRecord;
  processors: LegalProcessorRecord[];
  storageTechnologies: LegalStorageTechnologyRecord[];
  privacyPolicy: LegalDocumentRecord;
  termsOfService: LegalDocumentRecord;
  cookiePolicy: LegalDocumentRecord;
  openBankingNotice: LegalDocumentRecord;
}

export interface RequiredLegalConsentPayload {
  acceptPrivacyPolicy: boolean;
  privacyPolicyVersion: string;
  acceptTermsOfService: boolean;
  termsOfServiceVersion: string;
  acknowledgeCookiePolicy: boolean;
  cookiePolicyVersion: string;
}

export interface OpenBankingConsentPayload {
  acceptOpenBankingNotice: boolean;
  openBankingNoticeVersion: string;
  scopes: string[];
}
