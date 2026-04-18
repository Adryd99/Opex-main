import type {
  LegalPublicInfoRecord,
  OpenBankingConsentPayload,
  RequiredLegalConsentPayload
} from '../types/legal';
import type { UserProfile } from '../types/user';

const LEGAL_STORAGE_PREFIX = 'opex_legal_consents';

type StoredLegalConsents = {
  gdprAccepted?: boolean;
  privacyPolicyVersion?: string | null;
  privacyAcceptedAt?: string | null;
  termsOfServiceVersion?: string | null;
  termsAcceptedAt?: string | null;
  cookiePolicyVersion?: string | null;
  cookiePolicyAcknowledgedAt?: string | null;
  openBankingNoticeVersion?: string | null;
  openBankingNoticeAcceptedAt?: string | null;
  openBankingConsentScopes?: string[];
};

const getStorageKey = (email: string | null | undefined) => {
  const normalizedEmail = (email ?? 'anonymous').trim().toLowerCase() || 'anonymous';
  return `${LEGAL_STORAGE_PREFIX}:${normalizedEmail}`;
};

const readStoredConsents = (email: string | null | undefined): StoredLegalConsents | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(email));
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as StoredLegalConsents;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const writeStoredConsents = (email: string | null | undefined, value: StoredLegalConsents) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getStorageKey(email), JSON.stringify(value));
};

export const mergeStoredLegalConsents = (
  profile: UserProfile,
  legalInfo: LegalPublicInfoRecord
): UserProfile => {
  const stored = readStoredConsents(profile.email);
  if (!stored) {
    return profile;
  }

  const nextProfile: UserProfile = {
    ...profile,
    gdprAccepted: Boolean(stored.gdprAccepted ?? profile.gdprAccepted),
    privacyPolicyVersion: stored.privacyPolicyVersion ?? profile.privacyPolicyVersion ?? null,
    privacyAcceptedAt: stored.privacyAcceptedAt ?? profile.privacyAcceptedAt ?? null,
    termsOfServiceVersion: stored.termsOfServiceVersion ?? profile.termsOfServiceVersion ?? null,
    termsAcceptedAt: stored.termsAcceptedAt ?? profile.termsAcceptedAt ?? null,
    cookiePolicyVersion: stored.cookiePolicyVersion ?? profile.cookiePolicyVersion ?? null,
    cookiePolicyAcknowledgedAt: stored.cookiePolicyAcknowledgedAt ?? profile.cookiePolicyAcknowledgedAt ?? null,
    openBankingNoticeVersion: stored.openBankingNoticeVersion ?? profile.openBankingNoticeVersion ?? null,
    openBankingNoticeAcceptedAt: stored.openBankingNoticeAcceptedAt ?? profile.openBankingNoticeAcceptedAt ?? null,
    openBankingConsentScopes: stored.openBankingConsentScopes ?? profile.openBankingConsentScopes ?? []
  };

  const hasCurrentRequiredConsents =
    nextProfile.privacyPolicyVersion === legalInfo.privacyPolicy.version &&
    nextProfile.termsOfServiceVersion === legalInfo.termsOfService.version &&
    Boolean(nextProfile.privacyAcceptedAt) &&
    Boolean(nextProfile.termsAcceptedAt);

  return {
    ...nextProfile,
    gdprAccepted: hasCurrentRequiredConsents || Boolean(nextProfile.gdprAccepted)
  };
};

export const syncStoredLegalConsents = (
  profile: UserProfile,
  legalInfo: LegalPublicInfoRecord
): UserProfile => {
  const hasCurrentRequiredConsents =
    profile.privacyPolicyVersion === legalInfo.privacyPolicy.version &&
    profile.termsOfServiceVersion === legalInfo.termsOfService.version &&
    Boolean(profile.privacyAcceptedAt) &&
    Boolean(profile.termsAcceptedAt);

  const hasConsentMetadata = Boolean(
    profile.privacyPolicyVersion ||
      profile.privacyAcceptedAt ||
      profile.termsOfServiceVersion ||
      profile.termsAcceptedAt ||
      profile.cookiePolicyVersion ||
      profile.cookiePolicyAcknowledgedAt ||
      profile.openBankingNoticeVersion ||
      profile.openBankingNoticeAcceptedAt ||
      (profile.openBankingConsentScopes ?? []).length > 0
  );

  if (!hasConsentMetadata || !hasCurrentRequiredConsents) {
    clearStoredLegalConsents(profile.email);
    return profile;
  }

  writeStoredConsents(profile.email, {
    gdprAccepted: Boolean(profile.gdprAccepted),
    privacyPolicyVersion: profile.privacyPolicyVersion ?? null,
    privacyAcceptedAt: profile.privacyAcceptedAt ?? null,
    termsOfServiceVersion: profile.termsOfServiceVersion ?? null,
    termsAcceptedAt: profile.termsAcceptedAt ?? null,
    cookiePolicyVersion: profile.cookiePolicyVersion ?? null,
    cookiePolicyAcknowledgedAt: profile.cookiePolicyAcknowledgedAt ?? null,
    openBankingNoticeVersion: profile.openBankingNoticeVersion ?? null,
    openBankingNoticeAcceptedAt: profile.openBankingNoticeAcceptedAt ?? null,
    openBankingConsentScopes: profile.openBankingConsentScopes ?? []
  });

  return profile;
};

export const persistRequiredLegalConsentsLocally = (
  profile: UserProfile,
  legalInfo: LegalPublicInfoRecord,
  payload: RequiredLegalConsentPayload
): UserProfile => {
  const now = new Date().toISOString();
  const stored: StoredLegalConsents = {
    gdprAccepted: true,
    privacyPolicyVersion: payload.privacyPolicyVersion,
    privacyAcceptedAt: now,
    termsOfServiceVersion: payload.termsOfServiceVersion,
    termsAcceptedAt: now,
    cookiePolicyVersion: payload.cookiePolicyVersion,
    cookiePolicyAcknowledgedAt: payload.acknowledgeCookiePolicy ? now : null,
    openBankingNoticeVersion: profile.openBankingNoticeVersion ?? null,
    openBankingNoticeAcceptedAt: profile.openBankingNoticeAcceptedAt ?? null,
    openBankingConsentScopes: profile.openBankingConsentScopes ?? []
  };

  writeStoredConsents(profile.email, stored);

  return mergeStoredLegalConsents(
    {
      ...profile,
      gdprAccepted: true
    },
    legalInfo
  );
};

export const persistOpenBankingConsentLocally = (
  profile: UserProfile,
  legalInfo: LegalPublicInfoRecord,
  payload: OpenBankingConsentPayload
): UserProfile => {
  const existing = readStoredConsents(profile.email) ?? {};
  const nextValue: StoredLegalConsents = {
    ...existing,
    gdprAccepted: existing.gdprAccepted ?? profile.gdprAccepted ?? true,
    privacyPolicyVersion:
      existing.privacyPolicyVersion ?? profile.privacyPolicyVersion ?? legalInfo.privacyPolicy.version,
    privacyAcceptedAt: existing.privacyAcceptedAt ?? profile.privacyAcceptedAt ?? null,
    termsOfServiceVersion:
      existing.termsOfServiceVersion ?? profile.termsOfServiceVersion ?? legalInfo.termsOfService.version,
    termsAcceptedAt: existing.termsAcceptedAt ?? profile.termsAcceptedAt ?? null,
    cookiePolicyVersion:
      existing.cookiePolicyVersion ?? profile.cookiePolicyVersion ?? legalInfo.cookiePolicy.version,
    cookiePolicyAcknowledgedAt: existing.cookiePolicyAcknowledgedAt ?? profile.cookiePolicyAcknowledgedAt ?? null,
    openBankingNoticeVersion: payload.openBankingNoticeVersion,
    openBankingNoticeAcceptedAt: new Date().toISOString(),
    openBankingConsentScopes: payload.scopes
  };

  writeStoredConsents(profile.email, nextValue);
  return mergeStoredLegalConsents(profile, legalInfo);
};

export const clearStoredLegalConsents = (email: string | null | undefined) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(getStorageKey(email));
};
