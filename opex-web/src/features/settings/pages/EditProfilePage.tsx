import React, { useState } from 'react';
import { Camera, Check, X } from 'lucide-react';
import { SubpageShell } from '../../../app/layout';
import { Button, Card } from '../../../shared/ui';
import { UserProfile } from '../../../shared/types';
import { resizeImageToBase64 } from '../utils';

export const EditProfilePage = ({
  userProfile,
  setUserProfile,
  onBack,
  onSaveProfile
}: {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  onBack: () => void;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
}) => {
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [residence, setResidence] = useState(userProfile.residence);
  const [vatFrequency, setVatFrequency] = useState(userProfile.vatFrequency);
  const [logo, setLogo] = useState<string | null>(userProfile.logo ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeImageToBase64(file);
      setLogo(base64);
      setSaveError(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not process the image. Try a different file.');
    }
    // reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleSave = async () => {
    setIsSaving(true);
    const nextProfile: UserProfile = { ...userProfile, name, email, residence, vatFrequency, logo };
    setSaveError(null);

    try {
      setUserProfile(nextProfile);
      await onSaveProfile(nextProfile);
      onBack();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <SubpageShell onBack={onBack} title="Edit Profile">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card title="Account Details">
          <div className="space-y-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-opex-teal/10 flex items-center justify-center">
                  {logo
                    ? <img src={logo} alt="Avatar" className="w-full h-full object-cover" />
                    : <span className="text-3xl font-black text-opex-teal select-none">{initials}</span>
                  }
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-opex-teal text-white p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"
                >
                  <Camera size={20} />
                </button>
                {logo && (
                  <button
                    type="button"
                    onClick={() => setLogo(null)}
                    className="absolute -top-2 -right-2 bg-white border border-gray-200 text-gray-400 hover:text-red-500 p-1.5 rounded-xl shadow-md hover:scale-110 active:scale-95 transition-all"
                    title="Remove photo"
                  >
                    <X size={14} />
                  </button>
                )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => void handleAvatarChange(e)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Display Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Legal Residence</label>
                <select value={residence} onChange={e => setResidence(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none appearance-none">
                  <option>Netherlands (NL)</option>
                  <option>Italy (IT)</option>
                  <option>Germany (DE)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">VAT Return Frequency</label>
                <select
                  value={vatFrequency}
                  onChange={e => setVatFrequency(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none appearance-none"
                >
                  <option>Monthly</option>
                  <option>Quarterly</option>
                  <option>Yearly</option>
                </select>
                <p className="text-xs text-gray-400 font-medium">Used to generate Dutch VAT deadlines in Taxes.</p>
              </div>
            </div>
            <div className="pt-4">
              <Button fullWidth size="lg" icon={Check} onClick={() => void handleSave()} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              {saveError && <p className="mt-3 text-sm text-red-600 font-medium">{saveError}</p>}
            </div>
          </div>
        </Card>
      </div>
    </SubpageShell>
  );
};


