import { HelpCircle, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { LegalPublicInfoRecord } from '../../../shared/types';
import { Button, Card } from '../../../shared/ui';

const FAQ_ITEMS = ['foreignBank', 'excelExport', 'taxBuffer', 'dataSafety'] as const;

type SettingsHelpSectionProps = {
  legalPublicInfo: LegalPublicInfoRecord | null;
};

export const SettingsHelpSection = ({
  legalPublicInfo
}: SettingsHelpSectionProps) => {
  const { t } = useTranslation('settings');
  const supportEmail = legalPublicInfo?.controller.supportEmail ?? '';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card title={t('help.title')}>
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-app-border bg-app-muted px-5 py-6 transition-colors duration-200">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-app-border bg-app-surface text-opex-teal shadow-sm transition-colors duration-200">
                <HelpCircle size={20} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black text-app-primary">{t('help.summaryTitle')}</p>
                <p className="text-sm leading-relaxed text-app-secondary">
                  {t('help.summaryDescription')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-app-primary">{t('help.faq.title')}</p>
                  <p className="mt-1 text-sm text-app-secondary">{t('help.faq.description')}</p>
                </div>
              </div>

              <div className="space-y-3">
                {FAQ_ITEMS.map((itemKey) => (
                  <div
                    key={itemKey}
                    className="rounded-[1.6rem] border border-app-border bg-app-muted px-5 py-4 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-black text-app-primary">
                        {t(`help.faq.items.${itemKey}.question`)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-app-secondary">
                      {t('help.faq.placeholderAnswer')}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="space-y-4">
              <div className="rounded-[1.8rem] border border-app-border bg-app-surface px-5 py-5 shadow-sm transition-colors duration-200">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-app-muted text-opex-teal">
                    <Mail size={18} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-black text-app-primary">{t('help.support.title')}</p>
                    <p className="text-sm leading-relaxed text-app-secondary">
                      {t('help.support.description')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.4rem] border border-app-border bg-app-muted px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-app-tertiary">
                    {t('help.support.emailLabel')}
                  </p>
                  <p className="mt-2 text-sm font-bold text-app-primary break-all">
                    {supportEmail || t('help.support.emailUnavailable')}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    icon={Mail}
                    onClick={() => {
                      if (!supportEmail) {
                        return;
                      }

                      window.location.href = `mailto:${supportEmail}`;
                    }}
                    disabled={!supportEmail}
                  >
                    {t('help.support.cta')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
