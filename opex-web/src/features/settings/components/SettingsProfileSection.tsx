import { Camera, Check, CircleDashed, Edit2, Globe, Receipt } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card } from '../../../shared/ui';
import { UserProfile } from '../../../shared/types';
import { SettingsChecklistItem } from '../types';
import { ProfileEditorForm } from './ProfileEditorForm';

type SettingsProfileSectionProps = {
  userProfile: UserProfile;
  checklistItems: SettingsChecklistItem[];
  completedCount: number;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
};

type ProfileRow = {
  label: string;
  value: string;
  icon?: typeof Globe;
};

export const SettingsProfileSection = ({
  userProfile,
  checklistItems,
  completedCount,
  onSaveProfile
}: SettingsProfileSectionProps) => {
  const totalItems = checklistItems.length;
  const registrationDateLabel = formatRegistrationDate(userProfile.registrationDate);
  const accountVerified = Boolean(userProfile.emailVerified);
  const birthDateLabel = formatBirthDate(userProfile.dob);
  const timeZoneLabel = getTimeZoneLabel();
  const managedByGoogle = userProfile.identityProvider?.toLowerCase() === 'google';
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const profileRows: ProfileRow[] = [
    {
      label: 'Display Name',
      value: userProfile.displayName?.trim() || userProfile.name || 'Not provided yet'
    },
    {
      label: 'First Name',
      value: userProfile.firstName?.trim() || 'Not provided yet'
    },
    {
      label: 'Last Name',
      value: userProfile.lastName?.trim() || 'Not provided yet'
    },
    {
      label: 'Email',
      value: userProfile.email || 'Not provided yet'
    },
    {
      label: 'Legal Residence',
      value: userProfile.residence || 'Not provided yet',
      icon: Globe
    },
    {
      label: 'Birth Date',
      value: birthDateLabel
    },
    {
      label: 'Occupation',
      value: userProfile.occupation?.trim() || 'Not provided yet'
    },
    {
      label: 'Time Zone',
      value: timeZoneLabel
    },
    {
      label: 'VAT Return Frequency',
      value: userProfile.vatFrequency,
      icon: Receipt
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card title="Configuration Status" action={<Badge variant="info">{completedCount}/{totalItems} Completed</Badge>}>
        <div className="py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {checklistItems.map((item) => (
              <div key={item.id} className={`flex min-h-[132px] flex-col justify-between gap-5 p-5 rounded-[1.75rem] border transition-all ${item.completed ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {item.completed ? <Check size={18} /> : <CircleDashed size={18} className="animate-spin-slow" />}
                  </div>
                  <div className="space-y-2">
                    <p className={`text-sm font-black leading-tight ${item.completed ? 'text-green-800' : 'text-gray-700'}`}>{item.label}</p>
                    <p className="text-xs font-medium text-gray-400">
                      {item.completed ? 'Completed' : 'Pending'}
                    </p>
                    {item.detail && (
                      <p className="text-xs font-medium text-opex-teal">{item.detail}</p>
                    )}
                  </div>
                </div>
                {!item.completed && (item.action || item.opensProfileEditor) && (
                  <button
                    type="button"
                    onClick={item.opensProfileEditor ? () => setIsEditingProfile(true) : () => void item.action?.()}
                    disabled={item.actionDisabled}
                    className="self-start text-[10px] font-black text-opex-teal uppercase tracking-widest hover:underline px-2 py-1 disabled:text-gray-300 disabled:no-underline"
                  >
                    {item.cta}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card
        title="Profile Details"
        action={isEditingProfile
          ? <Button variant="ghost" size="sm" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
          : <Button variant="ghost" size="sm" icon={Edit2} onClick={() => setIsEditingProfile(true)}>Edit</Button>
        }
      >
        {isEditingProfile ? (
          <ProfileEditorForm
            userProfile={userProfile}
            onSaveProfile={onSaveProfile}
            onCancel={() => setIsEditingProfile(false)}
            onSaved={() => setIsEditingProfile(false)}
          />
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-10">
              <div className="relative group shrink-0">
                <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl transition-transform group-hover:scale-[1.02] cursor-pointer bg-opex-teal/10 flex items-center justify-center" onClick={() => setIsEditingProfile(true)}>
                  {userProfile.logo
                    ? <img src={userProfile.logo} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    : <span className="text-3xl font-black text-opex-teal select-none">
                      {userProfile.name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || '?'}
                    </span>
                  }
                </div>
                <button type="button" className="absolute -bottom-2 -right-2 bg-opex-dark text-white p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all" onClick={() => setIsEditingProfile(true)}>
                  <Camera size={16} />
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-center gap-3">
                <div className="space-y-1">
                  <p className="text-xl font-black text-gray-900 tracking-tight">{userProfile.displayName?.trim() || userProfile.name}</p>
                  <p className="text-sm font-semibold text-gray-500">
                    {managedByGoogle ? 'Email, first name and last name are managed by Google.' : 'Profile information is managed directly inside Opex.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={accountVerified ? 'success' : 'neutral'}>
                    {accountVerified ? 'Account Verified' : 'Verification Pending'}
                  </Badge>
                  {registrationDateLabel && <Badge variant="info">{registrationDateLabel}</Badge>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-6 pt-2">
              {profileRows.map((row) => {
                const Icon = row.icon;

                return (
                  <div key={row.label} className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{row.label}</label>
                    <p className="font-bold text-gray-700 flex items-center gap-2 min-h-[24px]">
                      {Icon && <Icon size={14} className="shrink-0" />}
                      <span>{row.value}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const formatRegistrationDate = (value: string | null | undefined): string | null => {
  if (!value?.trim()) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(parsed);
};

const formatBirthDate = (value: string | null | undefined): string => {
  if (!value?.trim()) {
    return 'Not provided yet';
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(parsed);
};

const getTimeZoneLabel = (): string => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const minutesOffset = -new Date().getTimezoneOffset();
  const sign = minutesOffset >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(minutesOffset);
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0');
  const minutes = String(absoluteOffset % 60).padStart(2, '0');

  return `${timeZone} (UTC${sign}${hours}:${minutes})`;
};
