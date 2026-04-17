import { Info, Lock } from 'lucide-react';
import { SubpageShell } from '../../../app/layout';
import { Button, Card } from '../../../shared/ui';

export const ChangePasswordPage = ({ onBack }: { onBack: () => void; }) => {
  return (
    <SubpageShell onBack={onBack} title="Change Password">
      <div className="max-w-lg mx-auto space-y-8">
        <Card title="Account Security">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Password</label>
              <input type="password" placeholder="••••••••" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Password</label>
              <input type="password" placeholder="Minimum 8 characters" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirm New Password</label>
              <input type="password" placeholder="Repeat password" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none" />
            </div>
            <div className="pt-4 flex flex-col gap-4">
              <Button fullWidth size="lg" icon={Lock} onClick={onBack}>Update Password</Button>
              <div className="p-4 bg-blue-50 rounded-xl flex gap-3 items-start">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700 leading-relaxed font-medium">You will be logged out from all other devices after changing your password.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </SubpageShell>
  );
};


