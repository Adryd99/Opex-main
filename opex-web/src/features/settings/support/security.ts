import type { UserSecurityStatus } from '../../../shared/types/user';

type SecurityActionType = 'totp' | 'webauthn' | 'recovery';

const METHOD_LABELS: Record<SecurityActionType, string> = {
  totp: 'Authenticator app',
  webauthn: 'Passkey or security key',
  recovery: 'Recovery codes'
};

export const getSecurityMethodLabel = (method?: string | null): string => {
  if (!method) {
    return 'Not configured';
  }

  const normalizedMethod = method.trim().toLowerCase();
  if (normalizedMethod === 'totp') {
    return METHOD_LABELS.totp;
  }
  if (normalizedMethod === 'webauthn' || normalizedMethod === 'passkey' || normalizedMethod === 'security-key') {
    return METHOD_LABELS.webauthn;
  }
  if (normalizedMethod.startsWith('recovery')) {
    return METHOD_LABELS.recovery;
  }

  return method;
};

export const getAvailableMethodLabels = (status: UserSecurityStatus): string[] =>
  status.availableSecondFactorMethods.map(getSecurityMethodLabel);

export const getRecommendedActionLabel = (status: UserSecurityStatus): string => {
  if (!status.totpConfigured) {
    return 'Add an authenticator app';
  }
  if (!status.webauthnConfigured) {
    return 'Add a passkey or security key';
  }
  if (!status.recoveryCodesAvailable) {
    return 'Generate recovery codes';
  }

  return 'Review your security setup';
};

export const getRecoverySummary = (status: UserSecurityStatus): string => {
  if (status.recoveryCodesSetupPending) {
    return 'Setup started but not completed yet.';
  }
  if (!status.recoveryCodesConfigured) {
    return 'No recovery codes generated yet.';
  }
  if (!status.recoveryCodesAvailable) {
    return 'Generated, but all codes are exhausted.';
  }
  if (status.recoveryCodesRemainingCount === 1) {
    return '1 code remaining.';
  }

  return `${status.recoveryCodesRemainingCount} codes remaining.`;
};

export const formatConfiguredAt = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(parsedDate);
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
