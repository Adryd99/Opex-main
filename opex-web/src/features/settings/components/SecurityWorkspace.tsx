import { useEffect, useState, type ReactNode } from 'react';
import { BadgeCheck, KeyRound, Loader2, RefreshCw, ShieldCheck, ShieldOff, Smartphone } from 'lucide-react';

import type { UserSecurityStatus } from '../../../shared/types/user';
import { Badge, Button, Card } from '../../../shared/ui';
import {
  clearKeycloakActionResult,
  readKeycloakActionResult,
  redirectToKeycloakAction
} from '../../../services/auth/keycloak/client';
import { useUserSecurityStatus } from '../hooks/useUserSecurityStatus';
import {
  clearPendingSettingsReturnSection,
  writePendingSettingsReturnSection
} from '../support/securityNavigation';
import {
  getRecommendedActionLabel,
  getRecoverySummary,
  getSecurityMethodLabel
} from '../support/security';

type SecurityWorkspaceProps = {
  redirectPath?: string;
  returnToSettingsSection?: string | null;
  containerClassName?: string;
  description?: string;
  onStartTotpSetup?: () => Promise<void> | void;
  onStartWebAuthnSetup?: () => Promise<void> | void;
  onManageRecoveryCodes?: () => Promise<void> | void;
};

type ActionKind = 'totp' | 'webauthn' | 'recovery';

const KEYCLOAK_ACTIONS = {
  totp: 'CONFIGURE_TOTP',
  webauthn: 'webauthn-register',
  recovery: 'CONFIGURE_RECOVERY_AUTHN_CODES'
} as const;

const UPDATE_PASSWORD_ACTION = 'UPDATE_PASSWORD';
const OPEX_UPDATE_PASSWORD_ACTION = 'OPEX_UPDATE_PASSWORD';

type SecurityActionCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  buttonLabel: string;
  helperText: string;
  isLoading: boolean;
  statusBadges?: ReactNode;
  statusSummary: string;
  onClick: () => void;
};

const SecurityActionCard = ({
  title,
  description,
  icon,
  buttonLabel,
  helperText,
  isLoading,
  statusBadges,
  statusSummary,
  onClick
}: SecurityActionCardProps) => (
  <Card className="h-full rounded-[2rem]">
    <div className="flex h-full flex-col justify-between gap-6">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 text-opex-dark flex items-center justify-center shrink-0">
              {icon}
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-gray-900 leading-tight">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            </div>
          </div>
          {statusBadges ? (
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              {statusBadges}
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 px-4 py-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Status</p>
          <p className="mt-2 text-sm font-semibold text-gray-700 leading-relaxed">{statusSummary}</p>
        </div>
      </div>

      <div className="space-y-3">
        <Button fullWidth variant="outline" onClick={onClick} disabled={isLoading}>
          {isLoading ? 'Preparing...' : buttonLabel}
        </Button>
        <p className="text-xs text-gray-500 leading-relaxed">{helperText}</p>
      </div>
    </div>
  </Card>
);

const SecurityStatusSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-36 bg-white rounded-3xl border border-gray-100" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="h-80 bg-white rounded-3xl border border-gray-100" />
      <div className="h-80 bg-white rounded-3xl border border-gray-100" />
      <div className="h-80 bg-white rounded-3xl border border-gray-100" />
    </div>
  </div>
);

export const SecurityWorkspace = ({
  redirectPath = '/',
  returnToSettingsSection = null,
  containerClassName = '',
  description = 'Review your second-factor status, recovery readiness and available actions in one place.',
  onStartTotpSetup,
  onStartWebAuthnSetup,
  onManageRecoveryCodes
}: SecurityWorkspaceProps) => {
  const { data, isLoading, errorMessage, refresh } = useUserSecurityStatus();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<ActionKind | null>(null);

  useEffect(() => {
    const actionResult = readKeycloakActionResult();
    if (!actionResult.status) {
      return;
    }

    if (actionResult.status === 'success') {
      setActionMessage(resolveActionStatusMessage(actionResult.action, actionResult.status));
      void refresh();
    } else if (actionResult.status === 'cancelled') {
      setActionMessage(resolveActionStatusMessage(actionResult.action, actionResult.status));
    } else {
      setActionMessage(resolveActionStatusMessage(actionResult.action, 'error'));
    }

    if (returnToSettingsSection) {
      clearPendingSettingsReturnSection();
    }

    clearKeycloakActionResult();
  }, [refresh]);

  const runAction = async (
    action: ActionKind,
    callback: (() => Promise<void> | void) | undefined
  ) => {
    setPendingAction(action);
    setActionMessage(null);

    try {
      if (callback) {
        await callback();
      } else {
        if (returnToSettingsSection) {
          writePendingSettingsReturnSection(returnToSettingsSection);
        }
        await redirectToKeycloakAction(KEYCLOAK_ACTIONS[action], {
          redirectPath
        });
      }
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Unable to start the requested action.');
    } finally {
      setPendingAction(null);
    }
  };

  const renderLoadedState = (status: UserSecurityStatus) => {
    const overview = resolveSecurityOverview(status);
    const primaryMethodLabel = getSecurityMethodLabel(status.secondFactorMethod);
    const recommendedAction = getRecommendedActionLabel(status);
    const recoveryStatusLabel = status.recoveryCodesAvailable
      ? 'Available'
      : status.recoveryCodesConfigured
        ? 'Exhausted'
        : 'Missing';

    return (
      <div className={containerClassName || undefined}>
        <div className="space-y-6">
          <Card className="rounded-[2rem]">
            <div className="space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${overview.tone === 'success' ? 'bg-green-500 text-white' : 'bg-opex-dark text-white'}`}>
                      {status.hasFallbackSecondFactor ? <ShieldCheck size={22} /> : <ShieldOff size={22} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em]">Security</p>
                      <h1 className="text-2xl md:text-3xl font-black text-gray-900">Account protection</h1>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
                    {description}
                  </p>
                </div>
                <div className="flex items-start lg:justify-end">
                  <Button variant="ghost" size="sm" onClick={() => void refresh()} icon={isLoading ? Loader2 : RefreshCw}>
                    Refresh
                  </Button>
                </div>
              </div>

              <div className={`rounded-[1.75rem] border px-5 py-5 ${overview.tone === 'success' ? 'border-green-100 bg-green-50/70' : 'border-yellow-100 bg-yellow-50/80'}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-lg font-black text-gray-900">{overview.title}</p>
                    <p className="max-w-2xl text-sm leading-relaxed text-gray-600">{overview.description}</p>
                    <p className="text-sm font-semibold text-opex-dark">
                      Recommended next step: {recommendedAction}.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
                    <Badge variant={status.secondFactorMethod ? 'success' : 'warning'}>{primaryMethodLabel}</Badge>
                    <Badge variant={status.hasFallbackSecondFactor ? 'success' : 'warning'}>
                      {status.hasFallbackSecondFactor ? 'Backup ready' : 'Backup missing'}
                    </Badge>
                    {status.recoveryCodesSetupPending ? <Badge variant="info">Setup pending</Badge> : null}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {actionMessage && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 text-blue-800 px-5 py-4 text-sm font-medium">
              {actionMessage}
            </div>
          )}
          {errorMessage && (
            <div className="rounded-2xl border border-red-100 bg-red-50 text-red-700 px-5 py-4 text-sm font-medium">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SecurityActionCard
              title="Add authenticator app"
              description="Use one-time codes from an authenticator app on your phone."
              icon={<Smartphone size={22} />}
              statusBadges={(
                <>
                  <Badge variant={status.totpConfigured ? 'success' : 'neutral'}>
                    {status.totpConfigured ? 'Configured' : 'Not set'}
                  </Badge>
                  {status.secondFactorMethod?.toLowerCase() === 'totp' ? <Badge variant="info">Primary</Badge> : null}
                </>
              )}
              statusSummary={
                status.totpConfigured
                  ? 'Ready to use for sign-in.'
                  : 'Not set yet.'
              }
              buttonLabel={status.totpConfigured ? 'Reconfigure authenticator app' : 'Set up authenticator app'}
              helperText="Best if you want a portable second factor that works across devices when you keep backup access."
              isLoading={pendingAction === 'totp'}
              onClick={() => void runAction('totp', onStartTotpSetup)}
            />
            <SecurityActionCard
              title="Add passkey or security key"
              description="Add a synced passkey or a hardware key for fast and secure sign-in."
              icon={<KeyRound size={22} />}
              statusBadges={(
                <>
                  <Badge variant={status.webauthnConfigured ? 'success' : 'neutral'}>
                    {status.webauthnConfigured ? `${status.webauthnCredentialCount} enrolled` : 'Not set'}
                  </Badge>
                  {status.secondFactorMethod?.toLowerCase() === 'webauthn' ? <Badge variant="info">Primary</Badge> : null}
                </>
              )}
              statusSummary={
                status.webauthnConfigured
                  ? `${status.webauthnCredentialCount} credential${status.webauthnCredentialCount === 1 ? '' : 's'} saved.`
                  : 'Not set yet.'
              }
              buttonLabel={status.webauthnConfigured ? 'Add another credential' : 'Set up passkey or key'}
              helperText="Ideal if you want a hardware key or synced passkey as a stronger day-to-day sign-in option."
              isLoading={pendingAction === 'webauthn'}
              onClick={() => void runAction('webauthn', onStartWebAuthnSetup)}
            />
            <SecurityActionCard
              title="Generate recovery codes"
              description="Keep emergency codes ready in case your phone or key is unavailable."
              icon={<BadgeCheck size={22} />}
              statusBadges={(
                <>
                  <Badge variant={status.recoveryCodesAvailable ? 'success' : status.recoveryCodesConfigured ? 'warning' : 'neutral'}>
                    {recoveryStatusLabel}
                  </Badge>
                  {status.recoveryCodesSetupPending ? <Badge variant="info">Setup pending</Badge> : null}
                </>
              )}
              statusSummary={getRecoverySummary(status)}
              buttonLabel={status.recoveryCodesConfigured ? 'Regenerate recovery codes' : 'Generate recovery codes'}
              helperText="Store these offline or in a password manager so you can still sign in if a device is lost."
              isLoading={pendingAction === 'recovery'}
              onClick={() => void runAction('recovery', onManageRecoveryCodes)}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {isLoading && !data ? <SecurityStatusSkeleton /> : null}
      {!isLoading && data ? renderLoadedState(data) : null}
      {!isLoading && !data && errorMessage ? (
        <div className={containerClassName || undefined}>
          <Card>
            <div className="space-y-4 text-center">
              <p className="text-lg font-black text-gray-900">Security status unavailable</p>
              <p className="text-sm text-gray-500">{errorMessage}</p>
              <div className="flex justify-center">
                <Button onClick={() => void refresh()}>Retry</Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
};

const resolveSecurityOverview = (status: UserSecurityStatus): { tone: 'success' | 'warning'; title: string; description: string } => {
  if (!status.secondFactorMethod) {
    return {
      tone: 'warning',
      title: 'Your account is not fully protected yet.',
      description: 'Set up a second sign-in method and then add recovery codes so you do not lose access.'
    };
  }

  if (!status.hasFallbackSecondFactor) {
    return {
      tone: 'warning',
      title: 'Your sign-in is protected, but backup access is still missing.',
      description: 'Add another method or recovery codes so a lost phone or key does not block your sign-in.'
    };
  }

  if (!status.recoveryCodesAvailable) {
    return {
      tone: 'warning',
      title: 'Your main sign-in is set, but recovery is still incomplete.',
      description: 'Generate recovery codes so you keep an emergency way back in.'
    };
  }

  return {
    tone: 'success',
    title: 'Your account is protected and backup access is ready.',
    description: 'You can still get back in if one device becomes unavailable.'
  };
};

const resolveActionStatusMessage = (
  action: string | null,
  status: 'success' | 'cancelled' | 'error'
): string => {
  const actionLabel = resolveActionLabel(action);

  if (status === 'success') {
    return `${actionLabel} completed. The page was refreshed with the latest security status.`;
  }

  if (status === 'cancelled') {
    return `${actionLabel} was cancelled before completion.`;
  }

  return `${actionLabel} did not complete successfully. Please try again.`;
};

const resolveActionLabel = (action: string | null): string => {
  switch (action) {
    case KEYCLOAK_ACTIONS.totp:
      return 'Authenticator app setup';
    case KEYCLOAK_ACTIONS.webauthn:
      return 'Passkey or security key setup';
    case KEYCLOAK_ACTIONS.recovery:
      return 'Recovery codes setup';
    case UPDATE_PASSWORD_ACTION:
    case OPEX_UPDATE_PASSWORD_ACTION:
      return 'Password update';
    default:
      return 'Requested action';
  }
};
