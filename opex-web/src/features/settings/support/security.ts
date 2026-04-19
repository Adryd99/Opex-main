import type { UserSecurityStatus } from '../../../shared/types/user';
import { formatDateTimeForLanguage } from '../../../i18n/formatting';
type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

type SecurityActionType = 'totp' | 'webauthn' | 'recovery';

export const getSecurityMethodLabel = (method: string | null | undefined, t: TranslateFn): string => {
  if (!method) {
    return t('settings:securityWorkspace.methods.notConfigured');
  }

  const normalizedMethod = method.trim().toLowerCase();
  if (normalizedMethod === 'totp') {
    return t('settings:securityWorkspace.methods.totp');
  }
  if (normalizedMethod === 'webauthn' || normalizedMethod === 'passkey' || normalizedMethod === 'security-key') {
    return t('settings:securityWorkspace.methods.webauthn');
  }
  if (normalizedMethod.startsWith('recovery')) {
    return t('settings:securityWorkspace.methods.recovery');
  }

  return method;
};

export const getAvailableMethodLabels = (status: UserSecurityStatus, t: TranslateFn): string[] =>
  status.availableSecondFactorMethods.map((method) => getSecurityMethodLabel(method, t));

export const getRecommendedActionLabel = (status: UserSecurityStatus, t: TranslateFn): string => {
  if (!status.totpConfigured) {
    return t('settings:securityWorkspace.recommendations.totp');
  }
  if (!status.webauthnConfigured) {
    return t('settings:securityWorkspace.recommendations.webauthn');
  }
  if (!status.recoveryCodesAvailable) {
    return t('settings:securityWorkspace.recommendations.recovery');
  }

  return t('settings:securityWorkspace.recommendations.review');
};

export const getRecoverySummary = (status: UserSecurityStatus, t: TranslateFn): string => {
  if (status.recoveryCodesSetupPending) {
    return t('settings:securityWorkspace.recoverySummary.pending');
  }
  if (!status.recoveryCodesConfigured) {
    return t('settings:securityWorkspace.recoverySummary.none');
  }
  if (!status.recoveryCodesAvailable) {
    return t('settings:securityWorkspace.recoverySummary.exhausted');
  }
  if (status.recoveryCodesRemainingCount === 1) {
    return t('settings:securityWorkspace.recoverySummary.one');
  }

  return t('settings:securityWorkspace.recoverySummary.many', { count: status.recoveryCodesRemainingCount });
};

export const formatConfiguredAt = (value?: string | null, language = 'en'): string | null => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return formatDateTimeForLanguage(language, parsedDate, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

export const getSecurityActionHelper = (action: SecurityActionType): string => {
  switch (action) {
    case 'totp':
      return 'This button is ready for the Keycloak enrollment flow and will be wired in the next step.';
    case 'webauthn':
      return 'This button will start passkey or hardware key enrollment once the auth flow wiring is connected.';
    case 'recovery':
      return 'This button will generate or rotate recovery codes once the auth flow wiring is connected.';
    default:
      return 'Action prepared for the next integration step.';
  }
};
