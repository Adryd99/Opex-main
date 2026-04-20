import { useEffect, useState, type ReactNode } from 'react';
import { BadgeCheck, KeyRound, Loader2, RefreshCw, ShieldCheck, ShieldOff, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { UserSecurityStatus } from '../../../shared/types/user';
import { userClient } from '../../../services/api/opex/clients/userClient';
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
type PrimaryMethodKind = 'totp' | 'webauthn';
type PendingAction = ActionKind | `primary-${PrimaryMethodKind}`;

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
  statusLabel: string;
  preparingLabel: string;
  savingLabel: string;
  onClick: () => void;
  secondaryButtonLabel?: string;
  onSecondaryClick?: () => void;
  isSecondaryLoading?: boolean;
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
  statusLabel,
  preparingLabel,
  savingLabel,
  onClick,
  secondaryButtonLabel,
  onSecondaryClick,
  isSecondaryLoading = false
}: SecurityActionCardProps) => (
  <Card className="h-full rounded-[2rem]">
    <div className="flex h-full flex-col justify-between gap-6">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-app-muted text-opex-dark dark:bg-opex-teal/15 dark:text-opex-teal transition-colors duration-200">
              {icon}
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-app-primary leading-tight">{title}</h3>
              <p className="text-sm text-app-secondary leading-relaxed">{description}</p>
            </div>
          </div>
          {statusBadges ? (
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              {statusBadges}
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.5rem] border border-app-border bg-app-muted px-4 py-4 transition-colors duration-200">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-app-tertiary">{statusLabel}</p>
          <p className="mt-2 text-sm font-semibold text-app-primary leading-relaxed">{statusSummary}</p>
        </div>
      </div>

      <div className="space-y-3">
        <Button fullWidth variant="outline" onClick={onClick} disabled={isLoading}>
          {isLoading ? preparingLabel : buttonLabel}
        </Button>
        {secondaryButtonLabel && onSecondaryClick ? (
          <Button
            fullWidth
            variant="ghost"
            onClick={onSecondaryClick}
            disabled={isSecondaryLoading}
          >
            {isSecondaryLoading ? savingLabel : secondaryButtonLabel}
          </Button>
        ) : null}
        <p className="text-xs text-app-secondary leading-relaxed">{helperText}</p>
      </div>
    </div>
  </Card>
);

const SecurityStatusSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-36 rounded-3xl border border-app-border bg-app-surface transition-colors duration-200" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="h-80 rounded-3xl border border-app-border bg-app-surface transition-colors duration-200" />
      <div className="h-80 rounded-3xl border border-app-border bg-app-surface transition-colors duration-200" />
      <div className="h-80 rounded-3xl border border-app-border bg-app-surface transition-colors duration-200" />
    </div>
  </div>
);

export const SecurityWorkspace = ({
  redirectPath = '/',
  returnToSettingsSection = null,
  containerClassName = '',
  description,
  onStartTotpSetup,
  onStartWebAuthnSetup,
  onManageRecoveryCodes
}: SecurityWorkspaceProps) => {
  const { t } = useTranslation('settings');
  const resolvedDescription = description ?? t('securityWorkspace.descriptionDefault');
  const { data, isLoading, errorMessage, refresh } = useUserSecurityStatus();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    const actionResult = readKeycloakActionResult();
    if (!actionResult.status) {
      return;
    }

    if (actionResult.status === 'success') {
      setActionMessage(resolveActionStatusMessage(actionResult.action, actionResult.status, t));
      void refresh();
    } else if (actionResult.status === 'cancelled') {
      setActionMessage(resolveActionStatusMessage(actionResult.action, actionResult.status, t));
    } else {
      setActionMessage(resolveActionStatusMessage(actionResult.action, 'error', t));
    }

    if (returnToSettingsSection) {
      clearPendingSettingsReturnSection();
    }

    clearKeycloakActionResult();
  }, [refresh, t]);

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
      setActionMessage(error instanceof Error ? error.message : t('securityWorkspace.actionError'));
    } finally {
      setPendingAction(null);
    }
  };

  const setPrimaryMethod = async (method: PrimaryMethodKind) => {
    setPendingAction(`primary-${method}`);
    setActionMessage(null);

    try {
      await userClient.setPrimarySecondFactor(method);
      setActionMessage(
        method === 'totp'
          ? t('securityWorkspace.setPrimaryTotpSuccess')
          : t('securityWorkspace.setPrimaryWebauthnSuccess')
      );
      await refresh();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : t('securityWorkspace.setPrimaryError'));
    } finally {
      setPendingAction(null);
    }
  };

  const renderLoadedState = (status: UserSecurityStatus) => {
    const overview = resolveSecurityOverview(status, t);
    const primaryMethodLabel = getSecurityMethodLabel(status.secondFactorMethod, t);
    const recommendedAction = getRecommendedActionLabel(status, t);
    const recoveryStatusLabel = status.recoveryCodesAvailable
      ? t('securityWorkspace.available')
      : status.recoveryCodesConfigured
        ? t('securityWorkspace.exhausted')
        : t('profile.missing');
    const normalizedPrimaryMethod = normalizeSecurityMethod(status.secondFactorMethod);
    const canChooseBetweenInteractiveMethods = status.totpConfigured && status.webauthnConfigured;

    return (
      <div className={containerClassName || undefined}>
        <div className="space-y-6">
          <Card className="rounded-[2rem]">
            <div className="space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${overview.tone === 'success' ? 'bg-green-500 text-white dark:bg-emerald-500 dark:text-slate-950' : 'bg-opex-dark text-white dark:bg-opex-teal dark:text-slate-950'} transition-colors duration-200`}>
                      {status.hasFallbackSecondFactor ? <ShieldCheck size={22} /> : <ShieldOff size={22} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-app-tertiary">{t('securityWorkspace.security')}</p>
                      <h1 className="text-2xl md:text-3xl font-black text-app-primary">{t('securityWorkspace.accountProtection')}</h1>
                    </div>
                  </div>
                  <p className="max-w-2xl text-sm leading-relaxed text-app-secondary">
                    {resolvedDescription}
                  </p>
                </div>
                <div className="flex items-start lg:justify-end">
                  <Button variant="ghost" size="sm" onClick={() => void refresh()} icon={isLoading ? Loader2 : RefreshCw}>
                    {t('securityWorkspace.refresh')}
                  </Button>
                </div>
              </div>

              <div className={`rounded-[1.75rem] border px-5 py-5 transition-colors duration-200 ${overview.tone === 'success' ? 'border-green-100 bg-green-50/70 dark:border-emerald-400/20 dark:bg-emerald-500/10' : 'border-yellow-100 bg-yellow-50/80 dark:border-amber-400/20 dark:bg-amber-500/10'}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-lg font-black text-app-primary">{overview.title}</p>
                    <p className="max-w-2xl text-sm leading-relaxed text-app-secondary">{overview.description}</p>
                    <p className="text-sm font-semibold text-opex-dark dark:text-opex-teal">
                      {t('securityWorkspace.recommendedNextStep', { action: recommendedAction })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
                    <Badge variant={status.secondFactorMethod ? 'success' : 'warning'}>{primaryMethodLabel}</Badge>
                    <Badge variant={status.hasFallbackSecondFactor ? 'success' : 'warning'}>
                      {status.hasFallbackSecondFactor ? t('securityWorkspace.backupReady') : t('securityWorkspace.backupMissing')}
                    </Badge>
                    {status.recoveryCodesSetupPending ? <Badge variant="info">{t('securityWorkspace.setupPending')}</Badge> : null}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {actionMessage && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-medium text-blue-800 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200 transition-colors duration-200">
              {actionMessage}
            </div>
          )}
          {errorMessage && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200 transition-colors duration-200">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SecurityActionCard
              title={t('securityWorkspace.actionCard.totpTitle')}
              description={t('securityWorkspace.actionCard.totpDescription')}
              icon={<Smartphone size={22} />}
              statusLabel={t('securityWorkspace.status')}
              preparingLabel={t('securityWorkspace.preparing')}
              savingLabel={t('securityWorkspace.saving')}
              statusBadges={(
                <>
                  <Badge variant={status.totpConfigured ? 'success' : 'neutral'}>
                    {status.totpConfigured ? t('securityWorkspace.configured') : t('securityWorkspace.notSet')}
                  </Badge>
                  {normalizedPrimaryMethod === 'totp' ? <Badge variant="info">{t('securityWorkspace.primary')}</Badge> : null}
                </>
              )}
              statusSummary={
                status.totpConfigured
                  ? t('securityWorkspace.actionCard.totpStatusReady')
                  : t('securityWorkspace.actionCard.totpStatusMissing')
              }
              buttonLabel={status.totpConfigured ? t('securityWorkspace.actionCard.totpButtonReconfigure') : t('securityWorkspace.actionCard.totpButtonSetUp')}
              helperText={t('securityWorkspace.actionCard.totpHelper')}
              isLoading={pendingAction === 'totp'}
              secondaryButtonLabel={
                canChooseBetweenInteractiveMethods && normalizedPrimaryMethod !== 'totp'
                  ? t('securityWorkspace.actionCard.setAsPrimary')
                  : undefined
              }
              isSecondaryLoading={pendingAction === 'primary-totp'}
              onSecondaryClick={() => void setPrimaryMethod('totp')}
              onClick={() => void runAction('totp', onStartTotpSetup)}
            />
            <SecurityActionCard
              title={t('securityWorkspace.actionCard.webauthnTitle')}
              description={t('securityWorkspace.actionCard.webauthnDescription')}
              icon={<KeyRound size={22} />}
              statusLabel={t('securityWorkspace.status')}
              preparingLabel={t('securityWorkspace.preparing')}
              savingLabel={t('securityWorkspace.saving')}
              statusBadges={(
                <>
                  <Badge variant={status.webauthnConfigured ? 'success' : 'neutral'}>
                    {status.webauthnConfigured ? t('securityWorkspace.actionCard.webauthnCredentialsSaved', { count: status.webauthnCredentialCount }) : t('securityWorkspace.notSet')}
                  </Badge>
                  {normalizedPrimaryMethod === 'webauthn' ? <Badge variant="info">{t('securityWorkspace.primary')}</Badge> : null}
                </>
              )}
              statusSummary={
                status.webauthnConfigured
                  ? t('securityWorkspace.actionCard.webauthnCredentialsSaved', { count: status.webauthnCredentialCount })
                  : t('securityWorkspace.actionCard.webauthnStatusMissing')
              }
              buttonLabel={status.webauthnConfigured ? t('securityWorkspace.actionCard.webauthnButtonAddAnother') : t('securityWorkspace.actionCard.webauthnButtonSetUp')}
              helperText={t('securityWorkspace.actionCard.webauthnHelper')}
              isLoading={pendingAction === 'webauthn'}
              secondaryButtonLabel={
                canChooseBetweenInteractiveMethods && normalizedPrimaryMethod !== 'webauthn'
                  ? t('securityWorkspace.actionCard.setAsPrimary')
                  : undefined
              }
              isSecondaryLoading={pendingAction === 'primary-webauthn'}
              onSecondaryClick={() => void setPrimaryMethod('webauthn')}
              onClick={() => void runAction('webauthn', onStartWebAuthnSetup)}
            />
            <SecurityActionCard
              title={t('securityWorkspace.actionCard.recoveryTitle')}
              description={t('securityWorkspace.actionCard.recoveryDescription')}
              icon={<BadgeCheck size={22} />}
              statusLabel={t('securityWorkspace.status')}
              preparingLabel={t('securityWorkspace.preparing')}
              savingLabel={t('securityWorkspace.saving')}
              statusBadges={(
                <>
                  <Badge variant={status.recoveryCodesAvailable ? 'success' : status.recoveryCodesConfigured ? 'warning' : 'neutral'}>
                    {recoveryStatusLabel}
                  </Badge>
                  {status.recoveryCodesSetupPending ? <Badge variant="info">{t('securityWorkspace.setupPending')}</Badge> : null}
                </>
              )}
              statusSummary={getRecoverySummary(status, t)}
              buttonLabel={status.recoveryCodesConfigured ? t('securityWorkspace.actionCard.recoveryButtonRegenerate') : t('securityWorkspace.actionCard.recoveryButtonGenerate')}
              helperText={t('securityWorkspace.actionCard.recoveryHelper')}
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
              <p className="text-lg font-black text-app-primary">{t('securityWorkspace.loadingTitle')}</p>
              <p className="text-sm text-app-secondary">{errorMessage}</p>
              <div className="flex justify-center">
                <Button onClick={() => void refresh()}>{t('securityWorkspace.loadingRetry')}</Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
};

const resolveSecurityOverview = (
  status: UserSecurityStatus,
  t: (key: string, options?: Record<string, unknown>) => string
): { tone: 'success' | 'warning'; title: string; description: string } => {
  if (!status.secondFactorMethod) {
    return {
      tone: 'warning',
      title: t('securityWorkspace.overview.missingAllTitle'),
      description: t('securityWorkspace.overview.missingAllDescription')
    };
  }

  if (!status.hasFallbackSecondFactor) {
    return {
      tone: 'warning',
      title: t('securityWorkspace.overview.missingFallbackTitle'),
      description: t('securityWorkspace.overview.missingFallbackDescription')
    };
  }

  if (!status.recoveryCodesAvailable) {
    return {
      tone: 'warning',
      title: t('securityWorkspace.overview.missingRecoveryTitle'),
      description: t('securityWorkspace.overview.missingRecoveryDescription')
    };
  }

  return {
    tone: 'success',
    title: t('securityWorkspace.overview.successTitle'),
    description: t('securityWorkspace.overview.successDescription')
  };
};

const resolveActionStatusMessage = (
  action: string | null,
  status: 'success' | 'cancelled' | 'error',
  t: (key: string, options?: Record<string, unknown>) => string
): string => {
  const actionLabel = resolveActionLabel(action, t);

  if (status === 'success') {
    return t('securityWorkspace.actionStatus.success', { label: actionLabel });
  }

  if (status === 'cancelled') {
    return t('securityWorkspace.actionStatus.cancelled', { label: actionLabel });
  }

  return t('securityWorkspace.actionStatus.error', { label: actionLabel });
};

const resolveActionLabel = (
  action: string | null,
  t: (key: string, options?: Record<string, unknown>) => string
): string => {
  switch (action) {
    case KEYCLOAK_ACTIONS.totp:
      return t('securityWorkspace.actionLabels.totp');
    case KEYCLOAK_ACTIONS.webauthn:
      return t('securityWorkspace.actionLabels.webauthn');
    case KEYCLOAK_ACTIONS.recovery:
      return t('securityWorkspace.actionLabels.recovery');
    case UPDATE_PASSWORD_ACTION:
    case OPEX_UPDATE_PASSWORD_ACTION:
      return t('securityWorkspace.actionLabels.password');
    default:
      return t('securityWorkspace.actionLabels.requestedAction');
  }
};

const normalizeSecurityMethod = (method: string | null | undefined): 'totp' | 'webauthn' | 'recovery' | null => {
  if (!method) {
    return null;
  }

  switch (method.trim().toLowerCase()) {
    case 'totp':
      return 'totp';
    case 'webauthn':
    case 'passkey':
    case 'security-key':
      return 'webauthn';
    case 'recovery':
    case 'recovery-codes':
    case 'recovery-authn-codes':
      return 'recovery';
    default:
      return null;
  }
};
