import type { ReactNode } from 'react';
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
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card } from '../../../shared/ui';
import { formatDateForLanguage, useAppLanguage } from '../../../i18n';
import { UserProfile } from '../../../shared/types';
import { VerificationEmailActionState } from '../types';
import { ProfileEditorForm } from './ProfileEditorForm';

type SettingsProfileSectionProps = {
  userProfile: UserProfile;
  isEditingProfile: boolean;
  onEditingProfileChange: (isEditing: boolean) => void;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
  verificationEmailAction: VerificationEmailActionState;
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
  onSaveProfile,
  verificationEmailAction
}: SettingsProfileSectionProps) => {
  const { t } = useTranslation('settings');
  const { language } = useAppLanguage();
  const registrationDateLabel = formatRegistrationDate(userProfile.registrationDate, language);
  const accountVerified = Boolean(userProfile.emailVerified);
  const birthDateLabel = formatBirthDate(userProfile.dob, language, t);
  const timeZoneLabel = getTimeZoneLabel();
  const managedByGoogle = userProfile.identityProvider?.toLowerCase() === 'google';
  const displayName = userProfile.displayName?.trim() || userProfile.name;
  const occupationLabel = userProfile.occupation?.trim() || t('profile.missing');
  const initials = displayName.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card
        title={t('profile.title')}
        action={isEditingProfile
          ? <Button variant="ghost" size="sm" onClick={() => onEditingProfileChange(false)}>{t('profile.cancel')}</Button>
          : <Button variant="ghost" size="sm" icon={Edit2} onClick={() => onEditingProfileChange(true)}>{t('profile.edit')}</Button>
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
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">{t('profile.personalProfile')}</p>
                      <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{displayName}</h2>
                      <p className="text-sm font-medium text-gray-500 max-w-2xl">
                        {managedByGoogle
                          ? t('profile.managedByGoogleDescription')
                          : t('profile.managedByOpexDescription')}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant={accountVerified ? 'success' : 'warning'}>
                        {accountVerified ? t('profile.accountVerified') : t('profile.verificationPending')}
                      </Badge>
                      <Badge variant="info">
                        {managedByGoogle ? t('profile.googleManagedIdentity') : t('profile.managedInOpex')}
                      </Badge>
                      {registrationDateLabel && <Badge variant="neutral">{registrationDateLabel}</Badge>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:w-[440px]">
                  <SummaryTile
                    label={t('profile.profileOwner')}
                    value={displayName}
                    detail={managedByGoogle ? t('profile.syncedFromGoogle') : t('profile.localWorkspaceIdentity')}
                    icon={UserRound}
                  />
                  <SummaryTile
                    label={t('profile.emailStatus')}
                    value={accountVerified ? t('profile.verified') : t('profile.pending')}
                    detail={userProfile.email}
                    icon={accountVerified ? ShieldCheck : AtSign}
                    action={!accountVerified ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full rounded-xl border-gray-200 px-3 py-2 text-xs font-black"
                        onClick={() => void verificationEmailAction.requestVerificationEmail()}
                        disabled={verificationEmailAction.actionDisabled}
                      >
                        {verificationEmailAction.cta}
                      </Button>
                    ) : null}
                  />
                  <SummaryTile
                    label={t('profile.occupation')}
                    value={occupationLabel}
                    detail={birthDateLabel === t('profile.notProvidedYet') ? t('profile.birthDateMissing') : birthDateLabel}
                    icon={BriefcaseBusiness}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1.2fr_0.9fr] gap-5">
              <div className="rounded-[1.75rem] border border-gray-100 bg-gray-50/80 p-5 space-y-5">
                <SectionHeading
                  icon={UserRound}
                  title={t('profile.identity')}
                  description={t('profile.identityDescription')}
                />
                <div className="grid grid-cols-1 gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ProfileDetailItem
                      label={t('profile.firstName')}
                      value={userProfile.firstName?.trim() || t('profile.notProvidedYet')}
                      isMuted={!userProfile.firstName?.trim()}
                    />
                    <ProfileDetailItem
                      label={t('profile.lastName')}
                      value={userProfile.lastName?.trim() || t('profile.notProvidedYet')}
                      isMuted={!userProfile.lastName?.trim()}
                    />
                  </div>
                  <ProfileDetailItem
                    label={t('profile.email')}
                    value={userProfile.email || t('profile.notProvidedYet')}
                    icon={AtSign}
                    isMuted={!userProfile.email}
                  />
                </div>
                {managedByGoogle && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 flex items-start gap-3">
                    <Lock size={16} className="mt-0.5 text-amber-600 shrink-0" />
                    <p className="text-sm font-medium text-amber-800">
                      {t('profile.managedIdentityNotice')}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-[1.75rem] border border-gray-100 bg-gray-50/80 p-5 space-y-5">
                <SectionHeading
                  icon={Globe}
                  title={t('profile.personalDetails')}
                  description={t('profile.personalDetailsDescription')}
                />
                <div className="grid grid-cols-1 gap-5">
                  <ProfileDetailItem
                    label={t('profile.displayName')}
                    value={displayName || t('profile.notProvidedYet')}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ProfileDetailItem
                      label={t('profile.birthDate')}
                      value={birthDateLabel}
                      icon={CalendarDays}
                      isMuted={birthDateLabel === t('profile.notProvidedYet')}
                    />
                    <ProfileDetailItem
                      label={t('profile.occupation')}
                      value={userProfile.occupation?.trim() || t('profile.notProvidedYet')}
                      isMuted={!userProfile.occupation?.trim()}
                    />
                  </div>
                  <ProfileDetailItem
                    label={t('profile.timeZone')}
                    value={timeZoneLabel}
                    isMuted={!timeZoneLabel}
                  />
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-gray-100 bg-white p-5 space-y-5 shadow-sm">
                <SectionHeading
                  icon={BadgeCheck}
                  title={t('profile.accountStatus')}
                  description={t('profile.accountStatusDescription')}
                />
                <div className="space-y-4">
                  <StatusRow
                    label={t('profile.verification')}
                    value={accountVerified ? t('profile.completed') : t('profile.pending')}
                    variant={accountVerified ? 'success' : 'warning'}
                  />
                  <StatusRow
                    label={t('profile.identitySource')}
                    value={managedByGoogle ? 'Google' : 'Opex'}
                    variant="info"
                  />
                  <StatusRow
                    label={t('profile.registration')}
                    value={registrationDateLabel ?? t('profile.notAvailable')}
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
  icon: Icon,
  action
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Globe;
  action?: ReactNode;
}) => (
  <div className="min-w-0 rounded-[1.5rem] border border-white/80 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-sm">
    <div className="flex items-center gap-2 text-gray-400">
      <Icon size={14} className="shrink-0" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-snug break-words [overflow-wrap:anywhere]">{label}</p>
    </div>
    <p className="mt-3 min-w-0 text-sm font-black text-gray-900 leading-tight break-words [overflow-wrap:anywhere]">{value}</p>
    <p className="mt-1 min-w-0 text-xs font-medium text-gray-500 leading-relaxed break-words [overflow-wrap:anywhere]">{detail}</p>
    {action}
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

const formatRegistrationDate = (value: string | null | undefined, language: string): string | null => {
  if (!value?.trim()) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return formatDateForLanguage(language, parsed, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatBirthDate = (
  value: string | null | undefined,
  language: string,
  t: (key: string) => string
): string => {
  if (!value?.trim()) {
    return t('profile.notProvidedYet');
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return formatDateForLanguage(language, parsed, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
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
