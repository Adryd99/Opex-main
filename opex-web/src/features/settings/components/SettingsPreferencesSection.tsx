import { ChevronDown, Languages, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card } from '../../../shared/ui';
import { useAppLanguage } from '../../../i18n';
import { useAppTheme } from '../../../theme';
import type { UserProfile } from '../../../shared/types';
import type { AppLanguage } from '../../../i18n/constants';
import { SettingsNotificationPreferencesSection } from './SettingsNotificationPreferencesSection';

type SettingsPreferencesSectionProps = {
  userProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
};

export const SettingsPreferencesSection = ({
  userProfile,
  onSaveProfile
}: SettingsPreferencesSectionProps) => {
  const { t } = useTranslation(['settings', 'common']);
  const { language, options: languageOptions, setLanguage } = useAppLanguage();
  const { theme, setTheme } = useAppTheme();
  const [isLanguageSaving, setIsLanguageSaving] = useState(false);
  const [isNotificationsExpanded, setIsNotificationsExpanded] = useState(false);

  const activeNotificationCount = [
    userProfile.notifyCriticalBalance ?? true,
    userProfile.notifySignificantIncome ?? true,
    userProfile.notifyAbnormalOutflow ?? true,
    userProfile.notifyConsentExpiration ?? true,
    userProfile.notifySyncErrors ?? false,
    userProfile.notifyQuarterlyVat ?? true,
    userProfile.notifyMonthlyAnalysis ?? false
  ].filter(Boolean).length;

  const handleLanguageChange = async (nextLanguage: AppLanguage) => {
    if (nextLanguage === language || isLanguageSaving) {
      return;
    }

    const previousLanguage = language;
    await setLanguage(nextLanguage);
    setIsLanguageSaving(true);

    try {
      await onSaveProfile({
        ...userProfile,
        preferredLanguage: nextLanguage
      });
    } catch {
      await setLanguage(previousLanguage);
    } finally {
      setIsLanguageSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card
        title={t('settings:preferences.notificationDetails')}
        action={(
          <Button
            size="sm"
            variant="ghost"
            icon={ChevronDown}
            className={`gap-1 ${isNotificationsExpanded ? 'text-opex-teal' : ''}`}
            onClick={() => setIsNotificationsExpanded((current) => !current)}
            aria-expanded={isNotificationsExpanded}
          >
            {isNotificationsExpanded
              ? t('settings:preferences.notifications.collapse')
              : t('settings:preferences.notifications.expand')}
          </Button>
        )}
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-[1.8rem] border border-app-border bg-app-muted px-4 py-4 transition-colors duration-200 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-bold text-app-primary">
                {t('settings:preferences.notifications.summaryTitle')}
              </p>
              <p className="text-sm text-app-secondary">
                {t('settings:preferences.notifications.summaryDescription')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">
                {t('settings:preferences.notifications.summaryThreshold', {
                  amount: userProfile.notificationBalanceThreshold ?? 500
                })}
              </Badge>
              <Badge variant="neutral">
                {t('settings:preferences.notifications.summaryActiveCount', {
                  count: activeNotificationCount
                })}
              </Badge>
            </div>
          </div>

          <div className={isNotificationsExpanded ? 'block' : 'hidden'}>
            <SettingsNotificationPreferencesSection
              userProfile={userProfile}
              onSaveProfile={onSaveProfile}
            />
          </div>
        </div>
      </Card>

      <Card title={t('settings:preferences.appPreferences')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <p className="text-[10px] font-black text-app-tertiary uppercase tracking-widest">
              {t('settings:preferences.display')}
            </p>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 p-5 bg-app-muted rounded-[2rem] border border-app-border transition-colors duration-200">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-app-surface border border-app-border shadow-sm flex items-center justify-center text-opex-teal transition-colors duration-200">
                      {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                    </div>
                    <span className="text-sm font-bold text-app-primary">{t('settings:preferences.appTheme')}</span>
                  </div>
                  <div className="space-y-1 pl-11">
                    <p className="text-sm text-app-secondary">{t('settings:preferences.appThemeDescription')}</p>
                  </div>
                </div>
                <div className="flex bg-app-surface p-1 rounded-xl shadow-sm border border-app-border shrink-0 transition-colors duration-200">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    aria-label={t('settings:preferences.lightTheme')}
                    title={t('settings:preferences.lightTheme')}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                      theme === 'light'
                        ? 'bg-opex-teal text-white shadow-md'
                        : 'text-app-secondary hover:text-app-primary'
                    }`}
                  >
                    {t('settings:preferences.lightThemeShort')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    aria-label={t('settings:preferences.darkTheme')}
                    title={t('settings:preferences.darkTheme')}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                      theme === 'dark'
                        ? 'bg-opex-teal text-white shadow-md'
                        : 'text-app-secondary hover:text-app-primary'
                    }`}
                  >
                    {t('settings:preferences.darkThemeShort')}
                  </button>
                </div>
              </div>
              <div className="flex items-start justify-between gap-4 p-5 bg-app-muted rounded-[2rem] border border-app-border transition-colors duration-200">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-app-surface border border-app-border shadow-sm flex items-center justify-center text-opex-teal transition-colors duration-200">
                      <Languages size={18} />
                    </div>
                    <span className="text-sm font-bold text-app-primary">{t('settings:preferences.languageLabel')}</span>
                  </div>
                  <div className="space-y-1 pl-11">
                    <p className="text-sm text-app-secondary">{t('settings:preferences.languageDescription')}</p>
                  </div>
                </div>
                <div className="flex bg-app-surface p-1 rounded-xl shadow-sm border border-app-border shrink-0 transition-colors duration-200">
                  {languageOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => void handleLanguageChange(option.value)}
                      disabled={isLanguageSaving}
                      className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                        language === option.value
                          ? 'bg-opex-teal text-white shadow-md'
                          : 'text-app-secondary hover:text-app-primary'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
