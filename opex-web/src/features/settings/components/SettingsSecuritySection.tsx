import { Key } from 'lucide-react';
import { Button, Card } from '../../../shared/ui';

type SettingsSecuritySectionProps = {
  onNavigate: (view: string) => void;
};

export const SettingsSecuritySection = ({ onNavigate }: SettingsSecuritySectionProps) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card title="Authentication">
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 gap-6">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400 shadow-sm border border-gray-100">
              <Key size={24} />
            </div>
            <div>
              <p className="text-base font-black text-gray-900">Access Credentials</p>
              <p className="text-xs text-gray-500 font-medium">Update your access key.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-2xl border-2 font-black px-6" onClick={() => onNavigate('CHANGE_PASSWORD')}>
            Change Password
          </Button>
        </div>
      </Card>
    </div>
  );
};
