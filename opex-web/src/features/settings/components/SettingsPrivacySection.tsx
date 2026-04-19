import { Download, Mail, ShieldCheck, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { openLegalDocument } from '../../../shared/legal';
import { Badge, Button, Card } from '../../../shared/ui';
import { LegalPublicInfoRecord, UserProfile } from '../../../shared/types';
import { ConsentAuditItem } from '../types';

type SettingsPrivacySectionProps = {
  userProfile: UserProfile;
  legalPublicInfo: LegalPublicInfoRecord | null;
  hasCurrentRequiredConsents: boolean;
  consentAuditItems: ConsentAuditItem[];
  isExportingData: boolean;
  isDeletingAccount: boolean;
  onDownloadDataExport: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onExportingDataChange: (value: boolean) => void;
  onDeletingAccountChange: (value: boolean) => void;
};

export const SettingsPrivacySection = ({
  userProfile,
  legalPublicInfo,
  hasCurrentRequiredConsents,
  consentAuditItems,
  isExportingData,
  isDeletingAccount,
  onDownloadDataExport,
  onDeleteAccount,
  onExportingDataChange,
  onDeletingAccountChange
}: SettingsPrivacySectionProps) => {
  const { t } = useTranslation('settings');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card title={t('privacy.title')}>
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-gray-100 bg-gray-50 p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border ${hasCurrentRequiredConsents ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-base font-black text-gray-900">{t('privacy.consentStatus')}</p>
                <p className="text-xs text-gray-500 font-medium">
                  {hasCurrentRequiredConsents ? t('privacy.consentCurrent') : t('privacy.consentMissing')}
                </p>
              </div>
            </div>
            <Badge variant={hasCurrentRequiredConsents ? 'success' : 'warning'}>
              {hasCurrentRequiredConsents ? t('privacy.current') : t('privacy.updateRequired')}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => openLegalDocument('privacy')}
              className="rounded-[1.75rem] border border-gray-100 bg-white px-5 py-5 text-left transition-all hover:border-opex-teal/20 hover:shadow-sm"
            >
              <p className="text-sm font-black text-gray-900">{t('privacy.privacyNotice')}</p>
              <p className="mt-2 text-xs font-medium leading-relaxed text-gray-500">
                {t('privacy.privacyNoticeDescription', { version: legalPublicInfo?.privacyPolicy.version || 'n/a' })}
              </p>
            </button>
            <button
              type="button"
              onClick={() => openLegalDocument('terms')}
              className="rounded-[1.75rem] border border-gray-100 bg-white px-5 py-5 text-left transition-all hover:border-opex-teal/20 hover:shadow-sm"
            >
              <p className="text-sm font-black text-gray-900">{t('privacy.termsOfService')}</p>
              <p className="mt-2 text-xs font-medium leading-relaxed text-gray-500">
                {t('privacy.termsDescription', { version: legalPublicInfo?.termsOfService.version || 'n/a' })}
              </p>
            </button>
            <button
              type="button"
              onClick={() => openLegalDocument('cookies')}
              className="rounded-[1.75rem] border border-gray-100 bg-white px-5 py-5 text-left transition-all hover:border-opex-teal/20 hover:shadow-sm"
            >
              <p className="text-sm font-black text-gray-900">{t('privacy.cookieNotice')}</p>
              <p className="mt-2 text-xs font-medium leading-relaxed text-gray-500">
                {t('privacy.cookieDescription', { version: legalPublicInfo?.cookiePolicy.version || 'n/a' })}
              </p>
            </button>
            <button
              type="button"
              onClick={() => openLegalDocument('open-banking')}
              className="rounded-[1.75rem] border border-gray-100 bg-white px-5 py-5 text-left transition-all hover:border-opex-teal/20 hover:shadow-sm"
            >
              <p className="text-sm font-black text-gray-900">{t('privacy.openBankingNotice')}</p>
              <p className="mt-2 text-xs font-medium leading-relaxed text-gray-500">
                {t('privacy.openBankingDescription', { version: legalPublicInfo?.openBankingNotice.version || 'n/a' })}
              </p>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2rem] border border-gray-100 bg-white p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-black text-gray-900">{t('privacy.consentAudit')}</p>
                  <p className="mt-1 text-xs font-medium text-gray-500">{t('privacy.consentAuditDescription')}</p>
                </div>
                <Badge variant="info">{t('privacy.entries', { count: consentAuditItems.length })}</Badge>
              </div>
              <div className="mt-5 space-y-3">
                {consentAuditItems.map((item) => (
                  <div key={item.label} className="rounded-[1.4rem] border border-gray-100 bg-gray-50 px-4 py-4">
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm font-black text-gray-900">{item.label}</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">{item.version}</p>
                    </div>
                    <p className="mt-2 text-xs font-medium text-gray-500">{item.acceptedAt}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-gray-100 bg-white p-6">
              <p className="text-base font-black text-gray-900">{t('privacy.dataRights')}</p>
              <p className="mt-1 text-xs font-medium text-gray-500">
                {t('privacy.dataRightsDescription')}
              </p>

              <div className="mt-5 space-y-3">
                <Button
                  fullWidth
                  variant="outline"
                  icon={Download}
                  className="py-5 rounded-[1.5rem]"
                  disabled={isExportingData}
                  onClick={() => {
                    onExportingDataChange(true);
                    void onDownloadDataExport()
                      .catch(() => undefined)
                      .finally(() => onExportingDataChange(false));
                  }}
                >
                  {isExportingData ? t('privacy.preparingExport') : t('privacy.downloadMyData')}
                </Button>
                <Button
                  fullWidth
                  variant="outline"
                  icon={Mail}
                  className="py-5 rounded-[1.5rem]"
                  onClick={() => {
                    const privacyEmail = legalPublicInfo?.controller.privacyEmail;
                    if (privacyEmail) {
                      window.location.href = `mailto:${privacyEmail}`;
                    }
                  }}
                >
                  {t('privacy.contactPrivacyTeam')}
                </Button>
                <Button
                  fullWidth
                  variant="danger"
                  icon={Trash2}
                  className="py-5 rounded-[1.5rem]"
                  disabled={isDeletingAccount}
                  onClick={() => {
                    const confirmed = window.confirm(t('privacy.deleteAccountConfirm'));
                    if (!confirmed) {
                      return;
                    }

                    onDeletingAccountChange(true);
                    void onDeleteAccount()
                      .catch(() => undefined)
                      .finally(() => onDeletingAccountChange(false));
                  }}
                >
                  {isDeletingAccount ? t('privacy.closingAccount') : t('privacy.deleteAccount')}
                </Button>
              </div>

              <div className="mt-6 rounded-[1.5rem] bg-gray-50 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">{t('privacy.openBankingScopes')}</p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
                  {(userProfile.openBankingConsentScopes ?? []).length > 0
                    ? (userProfile.openBankingConsentScopes ?? []).join(', ')
                    : t('privacy.noScopes')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
