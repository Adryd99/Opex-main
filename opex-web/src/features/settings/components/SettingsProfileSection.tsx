import {
  AtSign,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Edit2,
  Globe,
  Lock,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import { Badge, Button, Card } from '../../../shared/ui';
import { UserProfile } from '../../../shared/types';
import { ProfileEditorForm } from './ProfileEditorForm';

type SettingsProfileSectionProps = {
  userProfile: UserProfile;
  isEditingProfile: boolean;
  onEditingProfileChange: (isEditing: boolean) => void;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
};

type ProfileDetailItemProps = {
  label: string;
  value: string;
  icon?: typeof Globe;
  isMuted?: boolean;
};

export const SettingsProfileSection = ({
  userProfile,
  isEditingProfile,
  onEditingProfileChange,
  onSaveProfile
}: SettingsProfileSectionProps) => {
  const registrationDateLabel = formatRegistrationDate(userProfile.registrationDate);
  const accountVerified = Boolean(userProfile.emailVerified);
  const birthDateLabel = formatBirthDate(userProfile.dob);
  const timeZoneLabel = getTimeZoneLabel();
  const managedByGoogle = userProfile.identityProvider?.toLowerCase() === 'google';
  const displayName = userProfile.displayName?.trim() || userProfile.name;
  const occupationLabel = userProfile.occupation?.trim() || 'Missing';
  const initials = displayName.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card
        title="Profile"
        action={isEditingProfile
          ? <Button variant="ghost" size="sm" onClick={() => onEditingProfileChange(false)}>Cancel</Button>
          : <Button variant="ghost" size="sm" icon={Edit2} onClick={() => onEditingProfileChange(true)}>Edit</Button>
        }
      >
        {isEditingProfile ? (
          <ProfileEditorForm
            userProfile={userProfile}
            onSaveProfile={onSaveProfile}
            onCancel={() => onEditingProfileChange(false)}
            onSaved={() => onEditingProfileChange(false)}
          />
        ) : (
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-gray-100 bg-gradient-to-br from-white via-gray-50 to-opex-teal/5 p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  <div className="shrink-0">
                    <div className="w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-opex-teal/10 flex items-center justify-center">
                      {userProfile.logo
                        ? <img src={userProfile.logo} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        : <span className="text-3xl font-black text-opex-teal select-none">{initials}</span>
                      }
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">Personal Profile</p>
                      <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{displayName}</h2>
                      <p className="text-sm font-medium text-gray-500 max-w-2xl">
                        {managedByGoogle
                          ? 'Your Google identity manages email, first name and last name. The rest of your workspace details stay editable in Opex.'
                          : 'This section groups the personal, residency and tax details that drive your Opex workspace.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant={accountVerified ? 'success' : 'warning'}>
                        {accountVerified ? 'Account verified' : 'Verification pending'}
                      </Badge>
                      <Badge variant="info">
                        {managedByGoogle ? 'Google-managed identity' : 'Managed in Opex'}
                      </Badge>
                      {registrationDateLabel && <Badge variant="neutral">{registrationDateLabel}</Badge>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:w-[440px]">
                  <SummaryTile
                    label="Profile owner"
                    value={displayName}
                    detail={managedByGoogle ? 'Synced from Google' : 'Local workspace identity'}
                    icon={UserRound}
                  />
                  <SummaryTile
                    label="Email status"
                    value={accountVerified ? 'Verified' : 'Pending'}
                    detail={userProfile.email}
                    icon={accountVerified ? ShieldCheck : AtSign}
                  />
                  <SummaryTile
                    label="Occupation"
                    value={occupationLabel}
                    detail={birthDateLabel === 'Not provided yet' ? 'Birth date missing' : birthDateLabel}
                    icon={BriefcaseBusiness}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1.2fr_0.9fr] gap-5">
              <div className="rounded-[1.75rem] border border-gray-100 bg-gray-50/80 p-5 space-y-5">
                <SectionHeading
                  icon={UserRound}
                  title="Identity"
                  description="Core profile fields used across the application."
                />
                <div className="grid grid-cols-1 gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ProfileDetailItem
                      label="First Name"
                      value={userProfile.firstName?.trim() || 'Not provided yet'}
                      isMuted={!userProfile.firstName?.trim()}
                    />
                    <ProfileDetailItem
                      label="Last Name"
                      value={userProfile.lastName?.trim() || 'Not provided yet'}
                      isMuted={!userProfile.lastName?.trim()}
                    />
                  </div>
                  <ProfileDetailItem
                    label="Email"
                    value={userProfile.email || 'Not provided yet'}
                    icon={AtSign}
                    isMuted={!userProfile.email}
                  />
                </div>
                {managedByGoogle && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 flex items-start gap-3">
                    <Lock size={16} className="mt-0.5 text-amber-600 shrink-0" />
                    <p className="text-sm font-medium text-amber-800">
                      Email, first name and last name are managed by Google and cannot be changed here.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-[1.75rem] border border-gray-100 bg-gray-50/80 p-5 space-y-5">
                <SectionHeading
                  icon={Globe}
                  title="Personal Details"
                  description="Personal details used across your workspace and onboarding state."
                />
                <div className="grid grid-cols-1 gap-5">
                  <ProfileDetailItem
                    label="Display Name"
                    value={displayName || 'Not provided yet'}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ProfileDetailItem
                      label="Birth Date"
                      value={birthDateLabel}
                      icon={CalendarDays}
                      isMuted={birthDateLabel === 'Not provided yet'}
                    />
                    <ProfileDetailItem
                      label="Occupation"
                      value={userProfile.occupation?.trim() || 'Not provided yet'}
                      isMuted={!userProfile.occupation?.trim()}
                    />
                  </div>
                  <ProfileDetailItem
                    label="Time Zone"
                    value={timeZoneLabel}
                    isMuted={!timeZoneLabel}
                  />
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-gray-100 bg-white p-5 space-y-5 shadow-sm">
                <SectionHeading
                  icon={BadgeCheck}
                  title="Account Status"
                  description="High-level account and profile state."
                />
                <div className="space-y-4">
                  <StatusRow
                    label="Verification"
                    value={accountVerified ? 'Completed' : 'Pending'}
                    variant={accountVerified ? 'success' : 'warning'}
                  />
                  <StatusRow
                    label="Identity source"
                    value={managedByGoogle ? 'Google' : 'Opex'}
                    variant="info"
                  />
                  <StatusRow
                    label="Registration"
                    value={registrationDateLabel ?? 'Not available'}
                    variant="neutral"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const SectionHeading = ({
  icon: Icon,
  title,
  description
}: {
  icon: typeof Globe;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-2xl bg-white text-opex-teal flex items-center justify-center border border-gray-100 shadow-sm">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-sm font-black text-gray-900">{title}</p>
      <p className="text-xs font-medium text-gray-500">{description}</p>
    </div>
  </div>
);

const SummaryTile = ({
  label,
  value,
  detail,
  icon: Icon
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Globe;
}) => (
  <div className="min-w-0 rounded-[1.5rem] border border-white/80 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-sm">
    <div className="flex items-center gap-2 text-gray-400">
      <Icon size={14} className="shrink-0" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-snug break-words [overflow-wrap:anywhere]">{label}</p>
    </div>
    <p className="mt-3 min-w-0 text-sm font-black text-gray-900 leading-tight break-words [overflow-wrap:anywhere]">{value}</p>
    <p className="mt-1 min-w-0 text-xs font-medium text-gray-500 leading-relaxed break-words [overflow-wrap:anywhere]">{detail}</p>
  </div>
);

const ProfileDetailItem = ({
  label,
  value,
  icon: Icon,
  isMuted = false
}: ProfileDetailItemProps) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <p className={`min-h-[24px] flex items-center gap-2 text-sm font-bold ${isMuted ? 'text-gray-400' : 'text-gray-800'}`}>
      {Icon && <Icon size={14} className="shrink-0" />}
      <span>{value}</span>
    </p>
  </div>
);

const StatusRow = ({
  label,
  value,
  variant
}: {
  label: string;
  value: string;
  variant: 'neutral' | 'success' | 'warning' | 'info';
}) => (
  <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-gray-800">{value}</p>
    </div>
    <Badge variant={variant}>{value}</Badge>
  </div>
);

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
