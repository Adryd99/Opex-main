import { Key } from 'lucide-react';
import { useState } from 'react';
import { Button, Card } from '../../../shared/ui';
import { redirectToKeycloakAction } from '../../../services/auth/keycloak/client';
import { SecurityWorkspace } from './SecurityWorkspace';
import { writePendingSettingsReturnSection } from '../support/securityNavigation';

const OPEX_UPDATE_PASSWORD_ACTION = 'OPEX_UPDATE_PASSWORD';

export const SettingsSecuritySection = () => {
  const [passwordActionError, setPasswordActionError] = useState<string | null>(null);

  const handlePasswordUpdate = async () => {
    setPasswordActionError(null);

    try {
      writePendingSettingsReturnSection('SECURITY');
      await redirectToKeycloakAction(OPEX_UPDATE_PASSWORD_ACTION, {
        redirectPath: '/'
      });
    } catch (error) {
      setPasswordActionError(error instanceof Error ? error.message : 'Unable to start the password update flow.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card title="Password">
        <div className="flex flex-col gap-5 rounded-[2rem] border border-gray-100 bg-gray-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 shrink-0">
              <Key size={24} />
            </div>
            <div>
              <p className="text-base font-black text-gray-900">Change your password</p>
              <p className="text-sm text-gray-500 font-medium">
                Update the password you use to sign in to your account.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-2xl border-2 font-black px-6"
            onClick={() => void handlePasswordUpdate()}
          >
            Change Password
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
        description="Protect your account with a second factor and keep a backup way back in."
      />
    </div>
  );
};
