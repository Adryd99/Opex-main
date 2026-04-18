import { LegalPublicInfoRecord, UserProfile } from '../../../shared/types';
import { ConsentAuditItem, SettingsChecklistItem, VerificationEmailActionState } from '../types';
import { formatConsentTimestamp } from '../utils';
import { hasCompleteProfileDetails } from './profileCompletion';

const isCurrentLegalVersion = (
  currentVersion: string | null | undefined,
  acceptedVersion: string | null | undefined
): boolean => Boolean(currentVersion) && acceptedVersion === currentVersion;

export const hasCurrentRequiredConsents = (
  userProfile: UserProfile,
  legalPublicInfo: LegalPublicInfoRecord | null
): boolean =>
  Boolean(userProfile.gdprAccepted)
  && isCurrentLegalVersion(legalPublicInfo?.privacyPolicy.version, userProfile.privacyPolicyVersion)
  && isCurrentLegalVersion(legalPublicInfo?.termsOfService.version, userProfile.termsOfServiceVersion);

export const buildConsentAuditItems = (userProfile: UserProfile): ConsentAuditItem[] => [
  {
    label: 'Privacy Notice',
    version: userProfile.privacyPolicyVersion ?? 'Not accepted',
    acceptedAt: formatConsentTimestamp(userProfile.privacyAcceptedAt)
  },
  {
    label: 'Terms of Service',
    version: userProfile.termsOfServiceVersion ?? 'Not accepted',
    acceptedAt: formatConsentTimestamp(userProfile.termsAcceptedAt)
  },
  {
    label: 'Cookie Notice',
    version: userProfile.cookiePolicyVersion ?? 'Not acknowledged',
    acceptedAt: formatConsentTimestamp(userProfile.cookiePolicyAcknowledgedAt)
  },
  {
    label: 'Open Banking Notice',
    version: userProfile.openBankingNoticeVersion ?? 'Not accepted',
    acceptedAt: formatConsentTimestamp(userProfile.openBankingNoticeAcceptedAt)
  }
];

type BuildConfigurationChecklistArgs = {
  userProfile: UserProfile;
  verificationEmailAction: VerificationEmailActionState;
};

export const buildConfigurationChecklist = ({
  userProfile,
  verificationEmailAction
}: BuildConfigurationChecklistArgs): SettingsChecklistItem[] => [
  {
    id: 1,
    label: 'Complete profile details',
    completed: hasCompleteProfileDetails(userProfile),
    cta: 'Review',
    opensProfileEditor: true,
    action: null
  },
  {
    id: 2,
    label: 'Verify email',
    completed: Boolean(userProfile.emailVerified),
    cta: verificationEmailAction.cta,
    detail: verificationEmailAction.detail,
    actionDisabled: verificationEmailAction.actionDisabled,
    action: verificationEmailAction.requestVerificationEmail
  },
  {
    id: 3,
    label: 'Connect first bank account',
    completed: false,
    cta: '',
    action: null
  },
  {
    id: 4,
    label: 'Define tax profile',
    completed: false,
    cta: '',
    action: null
  },
  {
    id: 5,
    label: 'Review account security',
    completed: false,
    cta: '',
    action: null
  }
];
