import { Bell, ChevronRight, HelpCircle, Languages, Layers, Lock, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '../../../shared/ui';
import { useAppLanguage } from '../../../i18n';
import type { UserProfile } from '../../../shared/types';
import type { AppLanguage } from '../../../i18n/constants';

type SettingsPreferencesSectionProps = {
  theme: string;
  onThemeChange: (theme: string) => void;
  onNavigate: (view: string) => void;
  userProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
};

export const SettingsPreferencesSection = ({
  theme,
  onThemeChange,
  onNavigate,
  userProfile,
  onSaveProfile
}: SettingsPreferencesSectionProps) => {
  const { t } = useTranslation(['settings', 'common']);
  const { language, options: languageOptions, setLanguage } = useAppLanguage();
  const [isLanguageSaving, setIsLanguageSaving] = useState(false);

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
        title={t('settings:preferences.quickManagement')}
        action={(
          <Button size="sm" variant="ghost" icon={HelpCircle} onClick={() => onNavigate('SUPPORT')}>
            {t('settings:preferences.support')}
          </Button>
        )}
      >
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 mb-2">
            {t('settings:preferences.fastSettings')}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
              onClick={() => onNavigate('CATEGORIES')}
              className="w-full flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md hover:border-opex-teal/20 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-opex-teal group-hover:bg-opex-teal/5 transition-colors">
                  <Layers size={24} />
                </div>
                <span className="font-black text-gray-800 text-lg tracking-tight">
                  {t('settings:preferences.categoryManagement')}
                </span>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-opex-teal transition-all" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('NOTIFICATIONS')}
              className="w-full flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md hover:border-opex-teal/20 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-opex-teal group-hover:bg-opex-teal/5 transition-colors">
                  <Bell size={24} />
                </div>
                <span className="font-black text-gray-800 text-lg tracking-tight">
                  {t('settings:preferences.notificationDetails')}
                </span>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-opex-teal transition-all" />
            </button>
          </div>
        </div>
      </Card>

      <Card title={t('settings:preferences.appPreferences')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {t('settings:preferences.display')}
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                <span className="text-sm font-bold text-gray-700">{t('settings:preferences.appTheme')}</span>
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                  <button
                    type="button"
                    onClick={() => onThemeChange('light')}
                    aria-label={t('settings:preferences.lightTheme')}
                    title={t('settings:preferences.lightTheme')}
                    className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-opex-teal text-white shadow-md' : 'text-gray-400'}`}
                  >
                    <Sun size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onThemeChange('dark')}
                    aria-label={t('settings:preferences.darkTheme')}
                    title={t('settings:preferences.darkTheme')}
                    className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-opex-teal text-white shadow-md' : 'text-gray-400'}`}
                  >
                    <Moon size={18} />
                  </button>
                </div>
              </div>
              <div className="flex items-start justify-between gap-4 p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-opex-teal">
                      <Languages size={18} />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{t('settings:preferences.languageLabel')}</span>
                  </div>
                  <div className="space-y-1 pl-11">
                    <p className="text-sm text-gray-600">{t('settings:preferences.languageDescription')}</p>
                    <p className="text-xs font-medium text-gray-400">{t('settings:preferences.languageHint')}</p>
                  </div>
                </div>
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 shrink-0">
                  {languageOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => void handleLanguageChange(option.value)}
                      disabled={isLanguageSaving}
                      className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                        language === option.value
                          ? 'bg-opex-teal text-white shadow-md'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative flex items-center justify-between p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-[2rem] pointer-events-auto select-none">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Lock size={12} className="text-gray-400" />
                    </div>
                    <p className="text-[10px] font-black text-gray-700 tracking-tight">
                      {t('settings:preferences.comingSoon')}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-700 pointer-events-none select-none" style={{ filter: 'blur(1px)', opacity: 0.5 }}>
                  {t('settings:preferences.businessMode')}
                </span>
                <button type="button" disabled className="w-14 h-7 rounded-full relative transition-all bg-gray-200 pointer-events-none select-none" style={{ filter: 'blur(1px)', opacity: 0.5 }}>
                  <div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
