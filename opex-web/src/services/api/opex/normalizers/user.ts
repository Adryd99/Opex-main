import type { UserProfile } from '../../../../shared/types/user';
import { UserProfilePatchPayload } from '../types';
import {
  toBooleanValue,
  toNumber,
  toRecord,
  toStringList,
  toStringOrNull,
  toStringValue
} from './support';

export const normalizeUserProfile = (payload: unknown, fallback?: Partial<UserProfile>): UserProfile => {
  const item = toRecord(payload);
  const email = toStringValue(item.email, fallback?.email ?? '');
  const displayName = toStringOrNull(item.displayName) ?? fallback?.displayName ?? null;
  const firstName = toStringOrNull(item.firstName) ?? fallback?.firstName ?? null;
  const lastName = toStringOrNull(item.lastName) ?? fallback?.lastName ?? null;
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const fallbackName = (fallback?.name ?? '').trim();
  const inferredName = email.includes('@') ? email.split('@')[0] : 'Opex User';
  const consentScopes = toStringList(item.openBankingConsentScopes);
  const notificationBalanceThreshold =
    item.notificationBalanceThreshold === undefined || item.notificationBalanceThreshold === null
      ? (fallback?.notificationBalanceThreshold ?? 500)
      : toNumber(item.notificationBalanceThreshold);

  return {
    name: (displayName?.trim() || fullName || fallbackName || inferredName),
    displayName: displayName?.trim() || fullName || fallbackName || inferredName,
    identityProvider: toStringOrNull(item.identityProvider) ?? fallback?.identityProvider ?? null,
    email,
    emailVerified: toBooleanValue(item.emailVerified, fallback?.emailVerified ?? false),
    registrationDate: toStringOrNull(item.registrationDate) ?? fallback?.registrationDate ?? null,
    residence: toStringValue(item.residence, fallback?.residence ?? ''),
    vatFrequency: toStringValue(item.vatFrequency, fallback?.vatFrequency ?? 'Yearly'),
    logo: toStringOrNull(item.profilePicture) ?? fallback?.logo ?? null,
    gdprAccepted: toBooleanValue(item.gdprAccepted, fallback?.gdprAccepted ?? false),
    fiscalResidence: toStringOrNull(item.fiscalResidence) ?? fallback?.fiscalResidence ?? null,
    taxRegime: toStringOrNull(item.taxRegime) ?? fallback?.taxRegime ?? null,
    activityType: toStringOrNull(item.activityType) ?? fallback?.activityType ?? null,
    firstName: firstName ?? undefined,
    lastName: lastName ?? undefined,
    country: toStringOrNull(item.country) ?? fallback?.country ?? null,
    occupation: toStringOrNull(item.occupation) ?? fallback?.occupation ?? null,
    preferredSecondFactor: toStringOrNull(item.preferredSecondFactor) ?? fallback?.preferredSecondFactor ?? null,
    secondFactorEnrollmentDeferred: toBooleanValue(
      item.secondFactorEnrollmentDeferred,
      fallback?.secondFactorEnrollmentDeferred ?? false
    ),
    secondFactorMethod: toStringOrNull(item.secondFactorMethod) ?? fallback?.secondFactorMethod ?? null,
    secondFactorConfiguredAt: toStringOrNull(item.secondFactorConfiguredAt) ?? fallback?.secondFactorConfiguredAt ?? null,
    customerId: toStringOrNull(item.customerId) ?? fallback?.customerId ?? null,
    connectionId: fallback?.connectionId ?? null,
    dob: toStringOrNull(item.dob) ?? fallback?.dob ?? null,
    answer1: toStringOrNull(item.answer1) ?? fallback?.answer1 ?? null,
    answer2: toStringOrNull(item.answer2) ?? fallback?.answer2 ?? null,
    answer3: toStringOrNull(item.answer3) ?? fallback?.answer3 ?? null,
    answer4: toStringOrNull(item.answer4) ?? fallback?.answer4 ?? null,
    answer5: toStringOrNull(item.answer5) ?? fallback?.answer5 ?? null,
    privacyPolicyVersion: toStringOrNull(item.privacyPolicyVersion) ?? fallback?.privacyPolicyVersion ?? null,
    privacyAcceptedAt: toStringOrNull(item.privacyAcceptedAt) ?? fallback?.privacyAcceptedAt ?? null,
    termsOfServiceVersion: toStringOrNull(item.termsOfServiceVersion) ?? fallback?.termsOfServiceVersion ?? null,
    termsAcceptedAt: toStringOrNull(item.termsAcceptedAt) ?? fallback?.termsAcceptedAt ?? null,
    cookiePolicyVersion: toStringOrNull(item.cookiePolicyVersion) ?? fallback?.cookiePolicyVersion ?? null,
    cookiePolicyAcknowledgedAt: toStringOrNull(item.cookiePolicyAcknowledgedAt) ?? fallback?.cookiePolicyAcknowledgedAt ?? null,
    legalVersion: toStringOrNull(item.legalVersion) ?? fallback?.legalVersion ?? null,
    strictlyNecessaryCookiesAcknowledged: toBooleanValue(
      item.strictlyNecessaryCookiesAcknowledged,
      fallback?.strictlyNecessaryCookiesAcknowledged ?? false
    ),
    openBankingNoticeVersion: toStringOrNull(item.openBankingNoticeVersion) ?? fallback?.openBankingNoticeVersion ?? null,
    openBankingNoticeAcceptedAt: toStringOrNull(item.openBankingNoticeAcceptedAt) ?? fallback?.openBankingNoticeAcceptedAt ?? null,
    openBankingConsentScopes: consentScopes.length > 0
      ? consentScopes
      : fallback?.openBankingConsentScopes ?? [],
    notificationBalanceThreshold,
    notifyCriticalBalance: toBooleanValue(item.notifyCriticalBalance, fallback?.notifyCriticalBalance ?? true),
    notifySignificantIncome: toBooleanValue(item.notifySignificantIncome, fallback?.notifySignificantIncome ?? true),
    notifyAbnormalOutflow: toBooleanValue(item.notifyAbnormalOutflow, fallback?.notifyAbnormalOutflow ?? true),
    notifyConsentExpiration: toBooleanValue(item.notifyConsentExpiration, fallback?.notifyConsentExpiration ?? true),
    notifySyncErrors: toBooleanValue(item.notifySyncErrors, fallback?.notifySyncErrors ?? false),
    notifyQuarterlyVat: toBooleanValue(item.notifyQuarterlyVat, fallback?.notifyQuarterlyVat ?? true),
    notifyMonthlyAnalysis: toBooleanValue(item.notifyMonthlyAnalysis, fallback?.notifyMonthlyAnalysis ?? false)
  };
};

export const toUserProfilePatchPayload = (profile: UserProfile): UserProfilePatchPayload => {
  const displayName = (profile.displayName ?? profile.name).trim();
  const occupation = profile.occupation?.trim() || null;
  const residence = profile.residence;

  return {
    displayName,
    email: profile.email,
    firstName: (profile.firstName ?? '').trim(),
    lastName: (profile.lastName ?? '').trim(),
    residence,
    occupation,
    vatFrequency: profile.vatFrequency,
    gdprAccepted: profile.gdprAccepted ?? false,
    fiscalResidence: profile.fiscalResidence ?? null,
    taxRegime: profile.taxRegime ?? null,
    activityType: profile.activityType ?? null,
    customerId: profile.customerId ?? null,
    connectionId: profile.connectionId ?? null,
    dob: profile.dob ?? null,
    answer1: displayName || profile.answer1 || null,
    answer2: residence || profile.answer2 || null,
    answer3: occupation || profile.answer3 || null,
    answer4: profile.answer4 ?? null,
    answer5: profile.answer5 ?? null,
    profilePicture: profile.logo ?? null
  };
};
