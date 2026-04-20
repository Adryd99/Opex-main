import { Key } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '../../../shared/ui';
import { redirectToKeycloakAction } from '../../../services/auth/keycloak/client';
import { SecurityWorkspace } from './SecurityWorkspace';
import { writePendingSettingsReturnSection } from '../support/securityNavigation';

const OPEX_UPDATE_PASSWORD_ACTION = 'OPEX_UPDATE_PASSWORD';

export const SettingsSecuritySection = () => {
  const { t } = useTranslation('settings');
  const [passwordActionError, setPasswordActionError] = useState<string | null>(null);

  const handlePasswordUpdate = async () => {
    setPasswordActionError(null);

    try {
      writePendingSettingsReturnSection('SECURITY');
      await redirectToKeycloakAction(OPEX_UPDATE_PASSWORD_ACTION, {
        redirectPath: '/'
      });
    } catch (error) {
      setPasswordActionError(error instanceof Error ? error.message : t('securitySection.passwordFlowError'));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card title={t('securitySection.password')}>
        <div className="flex flex-col gap-5 rounded-[2rem] border border-app-border bg-app-muted px-5 py-5 sm:flex-row sm:items-center sm:justify-between transition-colors duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-app-surface flex items-center justify-center text-app-tertiary shadow-sm border border-app-border shrink-0 transition-colors duration-200">
              <Key size={24} />
            </div>
            <div>
              <p className="text-base font-black text-app-primary">{t('securitySection.changePasswordTitle')}</p>
              <p className="text-sm text-app-secondary font-medium">
                {t('securitySection.changePasswordDescription')}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-2xl border-2 font-black px-6"
            onClick={() => void handlePasswordUpdate()}
          >
            {t('securitySection.changePassword')}
          </Button>
        </div>
        {passwordActionError ? (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {passwordActionError}
          </div>
        ) : null}
      </Card>

        <SecurityWorkspace
          redirectPath="/"
          returnToSettingsSection="SECURITY"
          description={t('securityWorkspace.descriptionDefault')}
        />
      </div>
  );
};
