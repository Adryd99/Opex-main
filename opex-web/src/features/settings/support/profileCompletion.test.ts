import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UserProfile } from '../../../shared/types/user';
import { hasCompleteProfileDetails, isAdultBirthDate } from './profileCompletion';

const buildProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  name: 'Daniele Caporaletti',
  displayName: 'Daniele Caporaletti',
  email: 'daniele@example.com',
  residence: '',
  vatFrequency: 'Yearly',
  logo: null,
  gdprAccepted: true,
  firstName: 'Daniele',
  lastName: 'Caporaletti',
  country: 'Italy (IT)',
  occupation: 'Consultant',
  dob: '1990-04-18',
  ...overrides
});

describe('profileCompletion', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('recognizes an adult birth date using the current day boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-18T12:00:00Z'));

    expect(isAdultBirthDate('2008-04-18')).toBe(true);
    expect(isAdultBirthDate('2008-04-19')).toBe(false);
    expect(isAdultBirthDate('')).toBe(false);
  });

  it('requires the minimum profile details to consider the profile complete', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-18T12:00:00Z'));

    expect(hasCompleteProfileDetails(buildProfile())).toBe(true);
    expect(hasCompleteProfileDetails(buildProfile({ occupation: null }))).toBe(false);
    expect(hasCompleteProfileDetails(buildProfile({ country: null, residence: '' }))).toBe(false);
    expect(hasCompleteProfileDetails(buildProfile({ dob: '2010-01-01' }))).toBe(false);
  });
});
