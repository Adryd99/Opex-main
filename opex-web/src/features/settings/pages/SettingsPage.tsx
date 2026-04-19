import React, { useEffect, useState } from 'react';
import { AddBankPage } from '../../banking';
import { useEmailVerificationState } from '../hooks/useEmailVerificationState';
import { useUserSecurityStatus } from '../hooks/useUserSecurityStatus';
import { buildConfigurationChecklist, buildConsentAuditItems, hasCurrentRequiredConsents } from '../support/configurationStatus';
import { SETTINGS_SECTIONS } from '../support/sections';
import { SettingsPageProps, SettingsSectionId } from '../types';
import {
  SettingsBrandingSection,
  SettingsConfigurationStatus,
  SettingsHeader,
  SettingsHelpSection,
  SettingsPreferencesSection,
  SettingsPrivacySection,
  SettingsProfileSection,
  SettingsSecuritySection,
  SettingsTabs
} from '../components';

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
  const consentAuditItems = buildConsentAuditItems(userProfile);
  const checklistItems = buildConfigurationChecklist({
    userProfile,
    verificationEmailAction,
    securityStatus
  });

  const completedCount = checklistItems.filter((item) => item.completed).length;
  const [isConfigurationCollapsed, setIsConfigurationCollapsed] = useState(true);

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

  const handleChecklistItemSelect = (item: typeof checklistItems[number]) => {
    if (item.opensProfileEditor) {
      setActiveSection('PROFILE');
      setIsEditingProfile(true);
      return;
    }

    if (item.action) {
      void item.action();
      return;
    }

    if (item.targetSection) {
      setActiveSection(item.targetSection);
    }
  };

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
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <AddBankPage
              embeddedInSettings
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
          </div>
        );
      case 'PREFERENCES':
        return (
          <SettingsPreferencesSection
            theme={theme}
            onThemeChange={setTheme}
            onNavigate={onNavigate}
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
      <SettingsTabs sections={SETTINGS_SECTIONS} activeSection={activeSection} onSectionChange={setActiveSection} />
      <SettingsConfigurationStatus
        checklistItems={checklistItems}
        completedCount={completedCount}
        isCollapsed={isConfigurationCollapsed}
        onToggleCollapsed={() => setIsConfigurationCollapsed((current) => !current)}
        onSelectItem={handleChecklistItemSelect}
      />

      <div className="flex flex-col gap-8">
        <div className="flex-1 w-full space-y-8">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};
