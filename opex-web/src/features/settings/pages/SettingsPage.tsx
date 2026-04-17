import React, { useEffect, useState } from 'react';
import { Building2, Globe, HelpCircle, Lock, Palette, ShieldCheck, Users } from 'lucide-react';
import { formatConsentTimestamp } from '../utils';
import { AddBankPage } from '../../banking';
import { SettingsPageProps, SettingsSectionDefinition, SettingsSectionId } from '../types';
import {
  SettingsBrandingSection,
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

  const hasTaxProfile = Boolean((userProfile.residence ?? '').trim()) && Boolean((userProfile.vatFrequency ?? '').trim());
  const privacyPolicyCurrent = Boolean(legalPublicInfo?.privacyPolicy.version) && userProfile.privacyPolicyVersion === legalPublicInfo?.privacyPolicy.version;
  const termsCurrent = Boolean(legalPublicInfo?.termsOfService.version) && userProfile.termsOfServiceVersion === legalPublicInfo?.termsOfService.version;
  const hasCurrentRequiredConsents = Boolean(userProfile.gdprAccepted && privacyPolicyCurrent && termsCurrent);

  const consentAuditItems = [
    {
      label: 'Privacy Notice',
      version: userProfile.privacyPolicyVersion ?? 'Not accepted',
      acceptedAt: formatConsentTimestamp(userProfile.privacyAcceptedAt)
    },
    {
      label: 'Terms of Service',
      version: userProfile.termsOfServiceVersion ?? 'Not accepted',
      acceptedAt: formatConsentTimestamp(userProfile.termsAcceptedAt)
    },
    {
      label: 'Cookie Notice',
      version: userProfile.cookiePolicyVersion ?? 'Not acknowledged',
      acceptedAt: formatConsentTimestamp(userProfile.cookiePolicyAcknowledgedAt)
    },
    {
      label: 'Open Banking Notice',
      version: userProfile.openBankingNoticeVersion ?? 'Not accepted',
      acceptedAt: formatConsentTimestamp(userProfile.openBankingNoticeAcceptedAt)
    }
  ];

  const checklistItems = [
    { id: 1, label: 'Verify Email', completed: true, cta: 'Done', action: null },
    { id: 2, label: 'Link a Bank Account', completed: true, cta: 'Manage', action: () => setActiveSection('BANKING') },
    { id: 3, label: 'Set Base Currency', completed: true, cta: 'Change', action: () => setActiveSection('PREFERENCES') },
    { id: 4, label: 'Define Tax Profile', completed: hasTaxProfile, cta: hasTaxProfile ? 'Done' : 'Set Now', action: hasTaxProfile ? null : () => onNavigate('EDIT_PROFILE') },
    { id: 5, label: 'Customize Notifications', completed: false, cta: 'Configure', action: () => onNavigate('NOTIFICATIONS') }
  ];

  const sections: SettingsSectionDefinition[] = [
    { id: 'PROFILE', label: 'Profile & Account', icon: Users },
    { id: 'BRANDING', label: 'Branding', icon: Palette },
    { id: 'BANKING', label: 'Open Banking', icon: Building2 },
    { id: 'PREFERENCES', label: 'Preferences', icon: Globe },
    { id: 'SECURITY', label: 'Security', icon: Lock },
    { id: 'PRIVACY', label: 'Data & Privacy', icon: ShieldCheck },
    { id: 'HELP', label: 'Help & Legal', icon: HelpCircle }
  ];

  const completedCount = checklistItems.filter((item) => item.completed).length;
  const progressPercent = (completedCount / checklistItems.length) * 100;

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
            checklistItems={checklistItems}
            progressPercent={progressPercent}
            completedCount={completedCount}
            onNavigate={onNavigate}
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
        return <SettingsSecuritySection onNavigate={onNavigate} />;
      case 'PRIVACY':
        return (
          <SettingsPrivacySection
            userProfile={userProfile}
            legalPublicInfo={legalPublicInfo}
            hasCurrentRequiredConsents={hasCurrentRequiredConsents}
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
      <SettingsTabs sections={sections} activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="flex flex-col gap-8">
        <div className="flex-1 w-full space-y-8">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};
