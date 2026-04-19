import type { UserSecurityStatus } from '../../../../shared/types/user';
import {
  toBooleanValue,
  toNumber,
  toRecord,
  toStringList,
  toStringOrNull
} from './support';

export const normalizeUserSecurityStatus = (payload: unknown): UserSecurityStatus => {
  const item = toRecord(payload);

  return {
    preferredSecondFactor: toStringOrNull(item.preferredSecondFactor) ?? null,
    secondFactorEnrollmentDeferred: toBooleanValue(item.secondFactorEnrollmentDeferred, false),
    secondFactorMethod: toStringOrNull(item.secondFactorMethod) ?? null,
    secondFactorConfiguredAt: toStringOrNull(item.secondFactorConfiguredAt) ?? null,
    totpConfigured: toBooleanValue(item.totpConfigured, false),
    webauthnConfigured: toBooleanValue(item.webauthnConfigured, false),
    webauthnCredentialCount: toNumber(item.webauthnCredentialCount),
    recoveryCodesConfigured: toBooleanValue(item.recoveryCodesConfigured, false),
    recoveryCodesAvailable: toBooleanValue(item.recoveryCodesAvailable, false),
    recoveryCodesRemainingCount: toNumber(item.recoveryCodesRemainingCount),
    recoveryCodesSetupPending: toBooleanValue(item.recoveryCodesSetupPending, false),
    hasFallbackSecondFactor: toBooleanValue(item.hasFallbackSecondFactor, false),
    availableSecondFactorMethods: toStringList(item.availableSecondFactorMethods)
  };
};
