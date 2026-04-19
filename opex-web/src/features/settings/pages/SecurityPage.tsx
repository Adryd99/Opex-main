import { useEffect, useState, type ReactNode } from 'react';
import {
  BadgeCheck,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Smartphone
} from 'lucide-react';

import { SubpageShell } from '../../../app/layout';
import type { UserSecurityStatus } from '../../../shared/types/user';
import { Badge, Button, Card } from '../../../shared/ui';
import {
  clearKeycloakActionResult,
  readKeycloakActionResult,
  redirectToKeycloakAction
} from '../../../services/auth/keycloak/client';
import { useUserSecurityStatus } from '../hooks/useUserSecurityStatus';
import {
  formatConfiguredAt,
  getAvailableMethodLabels,
  getRecommendedActionLabel,
  getRecoverySummary,
  getSecurityMethodLabel
} from '../support/security';

type SecurityPageProps = {
  onBack: () => void;
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

type SecurityActionCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  buttonLabel: string;
  helperText: string;
  isLoading: boolean;
  onClick: () => void;
};

const SecurityActionCard = ({
  title,
  description,
  icon,
  buttonLabel,
  helperText,
  isLoading,
  onClick
}: SecurityActionCardProps) => (
  <Card className="h-full">
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 text-opex-dark flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>
      </div>
      <Button fullWidth variant="outline" onClick={onClick} disabled={isLoading}>
        {isLoading ? 'Preparing...' : buttonLabel}
      </Button>
      <p className="text-xs text-gray-500 leading-relaxed">{helperText}</p>
    </div>
  </Card>
);

const SecurityStatusSkeleton = () => (
  <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
    <div className="h-40 bg-white rounded-3xl border border-gray-100" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="h-56 bg-white rounded-3xl border border-gray-100" />
      <div className="h-56 bg-white rounded-3xl border border-gray-100" />
      <div className="h-56 bg-white rounded-3xl border border-gray-100" />
    </div>
  </div>
);

export const SecurityPage = ({
  onBack,
  onStartTotpSetup,
  onStartWebAuthnSetup,
  onManageRecoveryCodes
}: SecurityPageProps) => {
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
        await redirectToKeycloakAction(KEYCLOAK_ACTIONS[action], {
          redirectPath: '/security'
        });
      }
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Unable to start the requested action.');
    } finally {
      setPendingAction(null);
    }
  };

  const renderLoadedState = (status: UserSecurityStatus) => {
    const configuredAt = formatConfiguredAt(status.secondFactorConfiguredAt);
    const availableMethods = getAvailableMethodLabels(status);

    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="rounded-[2rem]">
          <div className="space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-opex-dark text-white flex items-center justify-center">
                    {status.hasFallbackSecondFactor ? <ShieldCheck size={22} /> : <ShieldOff size={22} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em]">Security Workspace</p>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900">Two-factor authentication</h1>
                  </div>
                </div>
                <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
                  This hidden page is the base for the future Settings security area. It already shows the real backend
                  status for your second factor and recovery setup.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={status.secondFactorMethod ? 'success' : 'warning'}>
                  Primary method: {getSecurityMethodLabel(status.secondFactorMethod)}
                </Badge>
                <Badge variant={status.hasFallbackSecondFactor ? 'success' : 'warning'}>
                  {status.hasFallbackSecondFactor ? 'Fallback available' : 'Fallback missing'}
                </Badge>
                {status.recoveryCodesSetupPending && <Badge variant="info">Recovery setup pending</Badge>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Preferred method</p>
                <p className="mt-2 text-lg font-black text-gray-900">{getSecurityMethodLabel(status.preferredSecondFactor)}</p>
                <p className="mt-1 text-sm text-gray-500">
                  Recommended next step: {getRecommendedActionLabel(status)}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Primary configured at</p>
                <p className="mt-2 text-lg font-black text-gray-900">{configuredAt ?? 'Not completed yet'}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {status.secondFactorEnrollmentDeferred ? 'Enrollment was deferred once.' : 'Enrollment was not deferred.'}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Available methods</p>
                <p className="mt-2 text-lg font-black text-gray-900">
                  {availableMethods.length > 0 ? availableMethods.join(', ') : 'None'}
                </p>
                <p className="mt-1 text-sm text-gray-500">Methods that can currently be used as a second factor.</p>
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
          <Card title="Authenticator app">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Use one-time codes from an authenticator app.</p>
                <Badge variant={status.totpConfigured ? 'success' : 'neutral'}>
                  {status.totpConfigured ? 'Configured' : 'Not set'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                Best for users who want a portable second factor across devices, as long as they keep backup or recovery access.
              </p>
            </div>
          </Card>

          <Card title="Passkey or security key">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Use passkeys or hardware keys registered in Keycloak.</p>
                <Badge variant={status.webauthnConfigured ? 'success' : 'neutral'}>
                  {status.webauthnConfigured ? `${status.webauthnCredentialCount} enrolled` : 'Not set'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                Works with synced passkeys and hardware keys. Add more than one credential if you want a safer fallback.
              </p>
            </div>
          </Card>

          <Card title="Recovery codes">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Single-use fallback codes for emergency login.</p>
                <Badge variant={status.recoveryCodesAvailable ? 'success' : status.recoveryCodesConfigured ? 'warning' : 'neutral'}>
                  {status.recoveryCodesAvailable ? 'Available' : status.recoveryCodesConfigured ? 'Exhausted' : 'Missing'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">{getRecoverySummary(status)}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SecurityActionCard
            title="Add authenticator app"
            description="Enroll a TOTP app as a second factor for everyday login."
            icon={<Smartphone size={22} />}
            buttonLabel={status.totpConfigured ? 'Reconfigure authenticator app' : 'Set up authenticator app'}
            helperText="Starts the Keycloak TOTP enrollment flow and returns here when completed."
            isLoading={pendingAction === 'totp'}
            onClick={() => void runAction('totp', onStartTotpSetup)}
          />
          <SecurityActionCard
            title="Add passkey or security key"
            description="Enroll a passkey or a hardware key as an alternative second factor."
            icon={<KeyRound size={22} />}
            buttonLabel={status.webauthnConfigured ? 'Add another credential' : 'Set up passkey or key'}
            helperText="Starts the Keycloak WebAuthn enrollment flow and returns here when completed."
            isLoading={pendingAction === 'webauthn'}
            onClick={() => void runAction('webauthn', onStartWebAuthnSetup)}
          />
          <SecurityActionCard
            title="Generate recovery codes"
            description="Create or rotate emergency recovery codes that can unlock the account if other factors are unavailable."
            icon={<BadgeCheck size={22} />}
            buttonLabel={status.recoveryCodesConfigured ? 'Regenerate recovery codes' : 'Generate recovery codes'}
            helperText="Starts the Keycloak recovery codes flow and returns here when completed."
            isLoading={pendingAction === 'recovery'}
            onClick={() => void runAction('recovery', onManageRecoveryCodes)}
          />
        </div>
      </div>
    );
  };

  return (
    <SubpageShell
      onBack={onBack}
      title="Security"
      subtitle="Hidden route for the future Settings security section."
      actions={(
        <Button variant="ghost" size="sm" onClick={() => void refresh()} icon={isLoading ? Loader2 : RefreshCw}>
          Refresh
        </Button>
      )}
    >
      {isLoading && !data ? <SecurityStatusSkeleton /> : null}
      {!isLoading && data ? renderLoadedState(data) : null}
      {!isLoading && !data && errorMessage ? (
        <div className="max-w-4xl mx-auto">
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
    </SubpageShell>
  );
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
    default:
      return 'Requested action';
  }
};
