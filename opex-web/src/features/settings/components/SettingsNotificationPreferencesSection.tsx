import { Loader2, Sliders } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../../shared/ui';
import type { UserProfile } from '../../../shared/types';

type SettingsNotificationPreferencesSectionProps = {
  userProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
};

type NotificationPreferenceDraft = {
  notificationBalanceThreshold: string;
  notifyCriticalBalance: boolean;
  notifySignificantIncome: boolean;
  notifyAbnormalOutflow: boolean;
  notifyConsentExpiration: boolean;
  notifySyncErrors: boolean;
  notifyQuarterlyVat: boolean;
  notifyMonthlyAnalysis: boolean;
};

const toDraft = (profile: UserProfile): NotificationPreferenceDraft => ({
  notificationBalanceThreshold: String(profile.notificationBalanceThreshold ?? 500),
  notifyCriticalBalance: profile.notifyCriticalBalance ?? true,
  notifySignificantIncome: profile.notifySignificantIncome ?? true,
  notifyAbnormalOutflow: profile.notifyAbnormalOutflow ?? true,
  notifyConsentExpiration: profile.notifyConsentExpiration ?? true,
  notifySyncErrors: profile.notifySyncErrors ?? false,
  notifyQuarterlyVat: profile.notifyQuarterlyVat ?? true,
  notifyMonthlyAnalysis: profile.notifyMonthlyAnalysis ?? false
});

export const SettingsNotificationPreferencesSection = ({
  userProfile,
  onSaveProfile
}: SettingsNotificationPreferencesSectionProps) => {
  const { t } = useTranslation('settings');
  const [draft, setDraft] = useState<NotificationPreferenceDraft>(() => toDraft(userProfile));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(toDraft(userProfile));
  }, [userProfile]);

  const sections = useMemo(() => ([
    {
      title: t('settings:preferences.notifications.sections.transactions'),
      items: [
        {
          key: 'notifyCriticalBalance' as const,
          label: t('settings:preferences.notifications.items.criticalBalance.label'),
          description: t('settings:preferences.notifications.items.criticalBalance.description')
        },
        {
          key: 'notifySignificantIncome' as const,
          label: t('settings:preferences.notifications.items.significantIncome.label'),
          description: t('settings:preferences.notifications.items.significantIncome.description')
        },
        {
          key: 'notifyAbnormalOutflow' as const,
          label: t('settings:preferences.notifications.items.abnormalOutflow.label'),
          description: t('settings:preferences.notifications.items.abnormalOutflow.description')
        }
      ]
    },
    {
      title: t('settings:preferences.notifications.sections.banking'),
      items: [
        {
          key: 'notifyConsentExpiration' as const,
          label: t('settings:preferences.notifications.items.consentExpiration.label'),
          description: t('settings:preferences.notifications.items.consentExpiration.description')
        },
        {
          key: 'notifySyncErrors' as const,
          label: t('settings:preferences.notifications.items.syncErrors.label'),
          description: t('settings:preferences.notifications.items.syncErrors.description')
        }
      ]
    },
    {
      title: t('settings:preferences.notifications.sections.tax'),
      items: [
        {
          key: 'notifyQuarterlyVat' as const,
          label: t('settings:preferences.notifications.items.quarterlyVat.label'),
          description: t('settings:preferences.notifications.items.quarterlyVat.description')
        },
        {
          key: 'notifyMonthlyAnalysis' as const,
          label: t('settings:preferences.notifications.items.monthlyAnalysis.label'),
          description: t('settings:preferences.notifications.items.monthlyAnalysis.description')
        }
      ]
    }
  ]), [t]);

  const isDirty = useMemo(() => {
    const current = toDraft(userProfile);
    return JSON.stringify(current) !== JSON.stringify(draft);
  }, [draft, userProfile]);

  const handleToggle = (
    key: Exclude<keyof NotificationPreferenceDraft, 'notificationBalanceThreshold'>
  ) => {
    setDraft((current) => ({
      ...current,
      [key]: !current[key]
    }));
  };

  const handleSave = async () => {
    const parsedThreshold = Number(draft.notificationBalanceThreshold);
    if (!Number.isFinite(parsedThreshold) || parsedThreshold < 0) {
      setSaveError(t('settings:preferences.notifications.invalidThreshold'));
      return;
    }

    setSaveError(null);
    setIsSaving(true);

    try {
      await onSaveProfile({
        ...userProfile,
        notificationBalanceThreshold: parsedThreshold,
        notifyCriticalBalance: draft.notifyCriticalBalance,
        notifySignificantIncome: draft.notifySignificantIncome,
        notifyAbnormalOutflow: draft.notifyAbnormalOutflow,
        notifyConsentExpiration: draft.notifyConsentExpiration,
        notifySyncErrors: draft.notifySyncErrors,
        notifyQuarterlyVat: draft.notifyQuarterlyVat,
        notifyMonthlyAnalysis: draft.notifyMonthlyAnalysis
      });
    } catch {
      setSaveError(t('settings:preferences.notifications.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-app-border bg-app-muted p-5 transition-colors duration-200">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-app-surface border border-app-border shadow-sm flex items-center justify-center text-opex-teal transition-colors duration-200">
                <Sliders size={18} />
              </div>
              <span className="text-sm font-bold text-app-primary">
                {t('settings:preferences.notifications.thresholdTitle')}
              </span>
            </div>
            <div className="space-y-1 pl-11">
              <p className="text-sm text-app-secondary">
                {t('settings:preferences.notifications.thresholdDescription')}
              </p>
            </div>
          </div>
          <div className="shrink-0 rounded-xl border border-app-border bg-app-surface px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="1"
                value={draft.notificationBalanceThreshold}
                onChange={(event) => setDraft((current) => ({
                  ...current,
                  notificationBalanceThreshold: event.target.value
                }))}
                className="w-24 border-none bg-transparent text-right text-base font-black text-opex-teal outline-none focus:ring-0"
              />
              <span className="text-xs font-bold uppercase tracking-wider text-app-tertiary">EUR</span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-app-tertiary">
          {t('settings:preferences.notifications.thresholdHelper')}
        </p>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="space-y-3">
          <h3 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-app-tertiary">
            {section.title}
          </h3>
          <div className="overflow-hidden rounded-[2rem] border border-app-border bg-app-surface divide-y divide-app-border shadow-sm transition-colors duration-200">
            {section.items.map((item) => {
              const isEnabled = draft[item.key];
              return (
                <div key={item.key} className="flex items-center justify-between gap-4 p-5">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-app-primary">{item.label}</p>
                    <p className="max-w-xl text-xs leading-relaxed text-app-secondary">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle(item.key)}
                    className={`relative h-7 w-14 shrink-0 rounded-full transition-all ${
                      isEnabled
                        ? 'bg-opex-teal shadow-lg shadow-teal-900/20'
                        : 'bg-app-border'
                    }`}
                    aria-pressed={isEnabled}
                  >
                    <div
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                        isEnabled ? 'left-8' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {saveError ? (
        <p className="text-sm font-medium text-red-600 dark:text-red-300">{saveError}</p>
      ) : null}

      <div className="flex justify-end">
        <Button
          size="lg"
          icon={isSaving ? Loader2 : undefined}
          disabled={!isDirty || isSaving}
          onClick={() => void handleSave()}
        >
          {isSaving
            ? t('settings:preferences.notifications.saving')
            : t('settings:preferences.notifications.save')}
        </Button>
      </div>
    </div>
  );
};
