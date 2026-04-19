import { Landmark } from 'lucide-react';
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
}: SettingsTaxesSectionProps) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
    <Card title="Taxes">
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-gray-100 bg-gradient-to-br from-white via-gray-50 to-amber-50/60 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-opex-dark text-white shadow-lg shadow-slate-900/10">
              <Landmark size={22} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">Tax Profile</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900">
                Configure the details behind your tax workspace
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-gray-500">
                These values are used to unlock the Taxes area and drive tax estimates, filing cadence and compliance guidance.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <TaxProfileSetupForm
            userProfile={userProfile}
            onSave={onSaveProfile}
            title="Tax profile"
            description="Choose your fiscal residence, regime and activity type. You can update these values here whenever your situation changes."
            saveLabel="Save tax profile"
            footerNote="These settings are used by the Taxes section and can be updated any time."
          />
        </div>
      </div>
    </Card>
  </div>
);
