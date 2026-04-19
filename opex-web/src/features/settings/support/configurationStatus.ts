import { BankAccountRecord, LegalPublicInfoRecord, UserProfile, UserSecurityStatus } from '../../../shared/types';
import { getMissingTaxProfileFields, hasTaxProfileConfigured } from '../../tax-profile';
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
  bankAccounts: BankAccountRecord[];
  verificationEmailAction: VerificationEmailActionState;
  securityStatus?: UserSecurityStatus | null;
};

const isSecuritySetupComplete = (securityStatus?: UserSecurityStatus | null): boolean =>
  Boolean(
    securityStatus?.secondFactorMethod
    && securityStatus.hasFallbackSecondFactor
    && securityStatus.recoveryCodesAvailable
  );

const getSecurityChecklistDetail = (securityStatus?: UserSecurityStatus | null): string | undefined => {
  if (!securityStatus?.secondFactorMethod) {
    return undefined;
  }

  if (!securityStatus.hasFallbackSecondFactor) {
    return 'Backup access missing';
  }

  if (!securityStatus.recoveryCodesAvailable) {
    return 'Recovery codes still missing';
  }

  return '2FA and recovery ready';
};

const getTaxProfileChecklistDetail = (userProfile: UserProfile): string | undefined => {
  if (hasTaxProfileConfigured(userProfile)) {
    return 'Tax profile ready';
  }

  const missingFields = getMissingTaxProfileFields(userProfile);
  if (missingFields.length === 0) {
    return undefined;
  }

  if (missingFields.length === 1) {
    return `Missing ${missingFields[0]}`;
  }

  if (missingFields.length === 2) {
    return `Missing ${missingFields[0]} and ${missingFields[1]}`;
  }

  return 'Missing fiscal residence, tax regime and activity type';
};

const hasConfiguredBankAccount = (bankAccounts: BankAccountRecord[]): boolean =>
  bankAccounts.length > 0;

const getBankingChecklistDetail = (bankAccounts: BankAccountRecord[]): string | undefined => {
  if (bankAccounts.length === 0) {
    return 'No bank or manual account yet';
  }

  const liveAccountsCount = bankAccounts.filter((account) => account.isSaltedge).length;
  const manualAccountsCount = bankAccounts.length - liveAccountsCount;

  if (liveAccountsCount > 0 && manualAccountsCount > 0) {
    return `${liveAccountsCount} live and ${manualAccountsCount} manual accounts ready`;
  }

  if (liveAccountsCount > 0) {
    return liveAccountsCount === 1
      ? '1 live bank account connected'
      : `${liveAccountsCount} live bank accounts connected`;
  }

  return manualAccountsCount === 1
    ? '1 manual account ready'
    : `${manualAccountsCount} manual accounts ready`;
};

export const buildConfigurationChecklist = ({
  userProfile,
  bankAccounts,
  verificationEmailAction,
  securityStatus
}: BuildConfigurationChecklistArgs): SettingsChecklistItem[] => [
  {
    id: 1,
    label: 'Complete profile details',
    completed: hasCompleteProfileDetails(userProfile),
    cta: 'Review',
    targetSection: 'PROFILE',
    opensProfileEditor: true,
    action: null
  },
  {
    id: 2,
    label: 'Verify email',
    completed: Boolean(userProfile.emailVerified),
    cta: verificationEmailAction.cta,
    targetSection: 'PROFILE',
    detail: verificationEmailAction.detail,
    actionDisabled: verificationEmailAction.actionDisabled,
    action: verificationEmailAction.requestVerificationEmail
  },
  {
    id: 3,
    label: 'Set up 2FA and recovery',
    completed: isSecuritySetupComplete(securityStatus),
    cta: 'Open',
    targetSection: 'SECURITY',
    detail: getSecurityChecklistDetail(securityStatus),
    action: null
  },
  {
    id: 4,
    label: 'Connect first bank account',
    completed: hasConfiguredBankAccount(bankAccounts),
    cta: 'Open',
    detail: getBankingChecklistDetail(bankAccounts),
    targetSection: 'BANKING',
    action: null
  },
  {
    id: 5,
    label: 'Define tax profile',
    completed: hasTaxProfileConfigured(userProfile),
    cta: 'Open',
    detail: getTaxProfileChecklistDetail(userProfile),
    targetSection: 'TAXES',
    action: null
  }
];
