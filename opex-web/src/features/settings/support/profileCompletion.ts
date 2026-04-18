import { UserProfile } from '../../../shared/types';

export const getAdultBirthDateMax = (): string => {
  const today = new Date();
  const latestAllowedBirthDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return latestAllowedBirthDate.toISOString().slice(0, 10);
};

export const isAdultBirthDate = (value: string | null | undefined): boolean => {
  if (!value?.trim()) {
    return false;
  }

  const birthDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) {
    return false;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 18;
};

export const hasCompleteProfileDetails = (userProfile: UserProfile): boolean =>
  Boolean(userProfile.displayName?.trim())
  && Boolean(userProfile.firstName?.trim())
  && Boolean(userProfile.lastName?.trim())
  && Boolean(userProfile.email?.trim())
  && (
    Boolean((userProfile.country ?? '').trim())
    || Boolean((userProfile.residence ?? '').trim())
  )
  && Boolean(userProfile.occupation?.trim())
  && isAdultBirthDate(userProfile.dob);
