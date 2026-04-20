import { Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../shared/ui';
import { UserProfile } from '../../../shared/types';
import { TaxProfileSetupForm } from '../../tax-profile';

type SettingsTaxesSectionProps = {
  userProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
};

export const SettingsTaxesSection = ({
  userProfile,
  onSaveProfile
}: SettingsTaxesSectionProps) => {
  const { t } = useTranslation('settings');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card title={t('taxesSection.title')}>
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-app-border bg-gradient-to-br from-app-surface via-app-muted to-amber-100/50 p-6 md:p-8 dark:to-amber-500/10 transition-colors duration-200">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-opex-dark text-white shadow-lg shadow-slate-900/10 dark:bg-opex-teal dark:text-slate-950 transition-colors duration-200">
              <Landmark size={22} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-app-tertiary">{t('taxesSection.badge')}</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-app-primary">
                {t('taxesSection.heroTitle')}
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-app-secondary">
                {t('taxesSection.heroDescription')}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-app-border bg-app-surface p-6 shadow-sm transition-colors duration-200 md:p-8">
          <TaxProfileSetupForm
            userProfile={userProfile}
            onSave={onSaveProfile}
            title={t('taxesSection.formTitle')}
            description={t('taxesSection.formDescription')}
            saveLabel={t('taxesSection.saveLabel')}
            footerNote={t('taxesSection.footerNote')}
          />
        </div>
      </div>
      </Card>
    </div>
  );
};
