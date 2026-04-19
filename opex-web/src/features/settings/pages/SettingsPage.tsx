import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppLanguage } from '../../../i18n';
import { Button } from '../../../shared/ui';
import { useEmailVerificationState } from '../hooks/useEmailVerificationState';
import { useUserSecurityStatus } from '../hooks/useUserSecurityStatus';
import { buildConsentAuditItems, hasCurrentRequiredConsents } from '../support/configurationStatus';
import { hasCompleteProfileDetails } from '../support/profileCompletion';
import { buildSettingsSections } from '../support/sections';
import { SettingsPageProps, SettingsSectionId } from '../types';
import {
  SettingsBrandingSection,
  SettingsHeader,
  SettingsBankingSection,
  SettingsHelpSection,
  SettingsPreferencesSection,
  SettingsPrivacySection,
  SettingsProfileSection,
  SettingsSectionNotice,
  SettingsSecuritySection,
  SettingsTaxesSection,
  SettingsTabs
} from '../components';
import { hasTaxProfileConfigured } from '../../tax-profile';

export const SettingsPage = ({
  userProfile,
  setUserProfile,
  onSaveProfile,
  onRequestEmailVerification,
  onNavigate,
  bankAccounts,
  taxBufferProviders,
  legalPublicInfo,
  onBankSelect,
  onConnectionSelect,
  onCreateOpenBankConnection,
  onRemoveOpenBankConnection,
  onUpdateBankAccount,
  onDownloadDataExport,
  onDeleteAccount,
  isConnectingOpenBank = false,
  openBankErrorMessage = null,
  initialSection = 'PROFILE'
}: SettingsPageProps) => {
  const { t } = useTranslation('settings');
  const { language } = useAppLanguage();
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(initialSection as SettingsSectionId);
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'light');
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const { data: securityStatus } = useUserSecurityStatus();
  const { verificationEmailAction } = useEmailVerificationState({
    emailVerified: Boolean(userProfile.emailVerified),
    onRequestEmailVerification
  });
  const requiredConsentsCurrent = hasCurrentRequiredConsents(userProfile, legalPublicInfo);
  const consentAuditItems = buildConsentAuditItems(userProfile, language, t);
  const isProfileDetailsComplete = hasCompleteProfileDetails(userProfile);
  const isProfileSetupComplete = isProfileDetailsComplete && Boolean(userProfile.emailVerified);
  const isSecuritySetupComplete = Boolean(
    securityStatus?.secondFactorMethod
    && securityStatus.hasFallbackSecondFactor
    && securityStatus.recoveryCodesAvailable
  );
  const isTaxProfileComplete = hasTaxProfileConfigured(userProfile);
  const isBankingSetupComplete = bankAccounts.length > 0;
  const settingsSections = buildSettingsSections(t);
  const sectionAttentionById: Partial<Record<SettingsSectionId, boolean>> = {
    PROFILE: !isProfileSetupComplete,
    SECURITY: !isSecuritySetupComplete,
    TAXES: !isTaxProfileComplete,
    BANKING: !isBankingSetupComplete
  };
  const activeSectionNotice = (() => {
    switch (activeSection) {
      case 'PROFILE':
        if (isProfileSetupComplete) {
          return null;
        }

        return {
          title: !isProfileDetailsComplete && !userProfile.emailVerified
            ? t('notices.profile.finishSetupTitle')
            : !isProfileDetailsComplete
              ? t('notices.profile.completeDetailsTitle')
              : t('notices.profile.verifyEmailTitle'),
          description: !isProfileDetailsComplete && !userProfile.emailVerified
            ? t('notices.profile.finishSetupDescription')
            : !isProfileDetailsComplete
              ? t('notices.profile.completeDetailsDescription')
              : verificationEmailAction.detail,
          action: !isProfileDetailsComplete ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
              {t('notices.profile.completeDetailsAction')}
            </Button>
          ) : undefined
        };
      case 'SECURITY':
        if (isSecuritySetupComplete) {
          return null;
        }

        return {
          title: t('notices.security.title'),
          description: !securityStatus?.secondFactorMethod
            ? t('notices.security.noSecondFactor')
            : !securityStatus.hasFallbackSecondFactor
              ? t('notices.security.noFallback')
              : t('notices.security.noRecovery')
        };
      case 'TAXES':
        if (isTaxProfileComplete) {
          return null;
        }

        return {
          title: t('notices.taxes.title'),
          description: t('notices.taxes.description')
        };
      case 'BANKING':
        if (isBankingSetupComplete) {
          return null;
        }

        return {
          title: t('notices.banking.title'),
          description: t('notices.banking.description')
        };
      default:
        return null;
    }
  })();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    setActiveSection(initialSection as SettingsSectionId);
  }, [initialSection]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUserProfile({ ...userProfile, logo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'PROFILE':
        return (
          <SettingsProfileSection
            userProfile={userProfile}
            isEditingProfile={isEditingProfile}
            onEditingProfileChange={setIsEditingProfile}
            onSaveProfile={onSaveProfile}
            verificationEmailAction={verificationEmailAction}
          />
        );
      case 'BRANDING':
        return (
          <SettingsBrandingSection
            userProfile={userProfile}
            onLogoUpload={handleLogoUpload}
            onRemoveLogo={() => setUserProfile({ ...userProfile, logo: null })}
          />
        );
      case 'BANKING':
        return (
          <SettingsBankingSection
            onNavigate={onNavigate}
            onBankSelect={onBankSelect}
            onConnectionSelect={onConnectionSelect}
            onUpdateBankAccount={onUpdateBankAccount}
            bankAccounts={bankAccounts}
            taxBufferProviders={taxBufferProviders}
            onCreateOpenBankConnection={onCreateOpenBankConnection}
            onRemoveOpenBankConnection={onRemoveOpenBankConnection}
            legalPublicInfo={legalPublicInfo}
            openBankingNoticeVersion={legalPublicInfo?.openBankingNotice.version ?? null}
            isConnectingOpenBank={isConnectingOpenBank}
            openBankErrorMessage={openBankErrorMessage}
          />
        );
      case 'TAXES':
        return (
          <SettingsTaxesSection
            userProfile={userProfile}
            onSaveProfile={onSaveProfile}
          />
        );
      case 'PREFERENCES':
        return (
          <SettingsPreferencesSection
            theme={theme}
            onThemeChange={setTheme}
            onNavigate={onNavigate}
            userProfile={userProfile}
            onSaveProfile={onSaveProfile}
          />
        );
      case 'SECURITY':
        return <SettingsSecuritySection />;
      case 'PRIVACY':
        return (
          <SettingsPrivacySection
            userProfile={userProfile}
            legalPublicInfo={legalPublicInfo}
            hasCurrentRequiredConsents={requiredConsentsCurrent}
            consentAuditItems={consentAuditItems}
            isExportingData={isExportingData}
            isDeletingAccount={isDeletingAccount}
            onDownloadDataExport={onDownloadDataExport}
            onDeleteAccount={onDeleteAccount}
            onExportingDataChange={setIsExportingData}
            onDeletingAccountChange={setIsDeletingAccount}
          />
        );
      case 'HELP':
        return <SettingsHelpSection onNavigate={onNavigate} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <SettingsHeader onNavigate={onNavigate} />
      <SettingsTabs
        sections={settingsSections}
        activeSection={activeSection}
        attentionBySection={sectionAttentionById}
        onSectionChange={setActiveSection}
      />
      {activeSectionNotice ? (
        <SettingsSectionNotice
          title={activeSectionNotice.title}
          description={activeSectionNotice.description}
          tone="warning"
          action={activeSectionNotice.action}
        />
      ) : null}

      <div className="flex flex-col gap-8">
        <div className="flex-1 w-full space-y-8">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};
