import React, { useState } from 'react';
import { BriefcaseBusiness, CalendarDays, Camera, Check, Globe2, Lock, UserRound, X } from 'lucide-react';
import { Badge, Button } from '../../../shared/ui';
import { UserProfile } from '../../../shared/types';
import { getAdultBirthDateMax, isAdultBirthDate } from '../support/profileCompletion';
import { resizeImageToBase64 } from '../utils';

type ProfileEditorFormProps = {
  userProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
  onCancel?: () => void;
  onSaved?: () => void;
  saveLabel?: string;
};

export const ProfileEditorForm = ({
  userProfile,
  onSaveProfile,
  onCancel,
  onSaved,
  saveLabel = 'Save Changes'
}: ProfileEditorFormProps) => {
  const [displayName, setDisplayName] = useState(userProfile.displayName ?? userProfile.name);
  const [firstName, setFirstName] = useState(userProfile.firstName ?? '');
  const [lastName, setLastName] = useState(userProfile.lastName ?? '');
  const [email, setEmail] = useState(userProfile.email);
  const [residence, setResidence] = useState(userProfile.residence ?? '');
  const [dob, setDob] = useState(userProfile.dob ?? '');
  const [occupation, setOccupation] = useState(userProfile.occupation ?? '');
  const [vatFrequency, setVatFrequency] = useState(userProfile.vatFrequency);
  const [logo, setLogo] = useState<string | null>(userProfile.logo ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const maxBirthDate = getAdultBirthDateMax();
  const isGoogleManagedIdentity = userProfile.identityProvider?.toLowerCase() === 'google';

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await resizeImageToBase64(file);
      setLogo(base64);
      setSaveError(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not process the image. Try a different file.');
    }

    event.target.value = '';
  };

  const handleSave = async () => {
    if (dob && !isAdultBirthDate(dob)) {
      setSaveError('Birth date must belong to an adult user (18+).');
      return;
    }

    setIsSaving(true);
    const nextProfile: UserProfile = {
      ...userProfile,
      name: displayName.trim() || userProfile.name,
      displayName: displayName.trim() || userProfile.name,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email,
      residence,
      dob: dob || null,
      occupation: occupation.trim() || null,
      vatFrequency,
      logo
    };
    setSaveError(null);

    try {
      await onSaveProfile(nextProfile);
      onSaved?.();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (displayName.trim() || `${firstName} ${lastName}`.trim()).split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-opex-teal/10 flex items-center justify-center">
                {logo
                  ? <img src={logo} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                onChange={event => void handleAvatarChange(event)}
              />
            </div>

            <div className="space-y-2 text-center md:text-left">
              <div className="space-y-1">
                <p className="text-xl font-black tracking-tight text-gray-900">Edit your profile details</p>
                <p className="text-sm font-medium text-gray-500">
                  Keep your workspace information aligned with your Keycloak identity and your local Opex profile.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Badge variant="info">Inline editing enabled</Badge>
                {isGoogleManagedIdentity && (
                  <Badge variant="neutral">Google-managed identity</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/80 border border-gray-100 px-4 py-3 text-sm text-gray-500 shadow-sm">
            <p className="font-semibold text-gray-700">Profile photo</p>
            <p>Upload a new image or remove the current one directly from this card.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-opex-teal/10 text-opex-teal flex items-center justify-center">
              <UserRound size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">Identity</p>
              <p className="text-xs font-medium text-gray-500">These are the core details shown across your Opex workspace.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Display Name</label>
            <input value={displayName} onChange={event => setDisplayName(event.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">First Name</label>
              <input value={firstName} onChange={event => setFirstName(event.target.value)} disabled={isGoogleManagedIdentity} className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none disabled:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Name</label>
              <input value={lastName} onChange={event => setLastName(event.target.value)} disabled={isGoogleManagedIdentity} className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none disabled:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</label>
            <input value={email} onChange={event => setEmail(event.target.value)} disabled={isGoogleManagedIdentity} className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none disabled:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100" />
          </div>

          {isGoogleManagedIdentity && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 flex items-start gap-3">
              <Lock size={16} className="mt-0.5 text-amber-600 shrink-0" />
              <p className="text-sm font-medium text-amber-800">
                Email, first name and last name are managed by your Google account and cannot be changed here.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-opex-teal/10 text-opex-teal flex items-center justify-center">
              <Globe2 size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">Residence & tax</p>
              <p className="text-xs font-medium text-gray-500">These fields drive fiscal setup, VAT behaviour and profile completion.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Legal Residence</label>
            <select value={residence} onChange={event => setResidence(event.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none appearance-none">
              <option value="">Select your legal residence</option>
              <option>Netherlands (NL)</option>
              <option>Italy (IT)</option>
              <option>Belgium (BE)</option>
              <option>Germany (DE)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Birth Date</label>
              <div className="relative">
                <CalendarDays size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="date" value={dob} max={maxBirthDate} onChange={event => setDob(event.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Occupation</label>
              <div className="relative">
                <BriefcaseBusiness size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={occupation} onChange={event => setOccupation(event.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">VAT Return Frequency</label>
            <select
              value={vatFrequency}
              onChange={event => setVatFrequency(event.target.value)}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none appearance-none"
            >
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Yearly</option>
            </select>
            <p className="text-xs text-gray-400 font-medium">Used to generate Dutch VAT deadlines in Taxes.</p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          {onCancel && (
            <Button fullWidth variant="secondary" size="lg" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
          )}
          <Button fullWidth size="lg" icon={Check} onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? 'Saving...' : saveLabel}
          </Button>
        </div>
        {saveError && <p className="text-sm text-red-600 font-medium">{saveError}</p>}
      </div>
    </div>
  );
};
