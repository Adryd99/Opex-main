import { describe, expect, it } from 'vitest';
import type { UserProfile } from '../../../../shared/types/user';
import { normalizeUserProfile, toUserProfilePatchPayload } from './user';

describe('user normalizer', () => {
  it('builds a usable fallback profile from sparse payload data', () => {
    const profile = normalizeUserProfile({
      email: 'daniele.caporaletti@gmail.com'
    });

    expect(profile.name).toBe('daniele.caporaletti');
    expect(profile.displayName).toBe('daniele.caporaletti');
    expect(profile.vatFrequency).toBe('Yearly');
    expect(profile.notificationBalanceThreshold).toBe(500);
    expect(profile.openBankingConsentScopes).toEqual([]);
  });

  it('merges payload data with the fallback profile where the backend is partial', () => {
    const fallback: Partial<UserProfile> = {
      name: 'Existing User',
      email: 'existing@example.com',
      displayName: 'Existing User',
      connectionId: 'connection-1',
      notifyQuarterlyVat: false
    };

    const profile = normalizeUserProfile(
      {
        emailVerified: true,
        firstName: 'Daniele',
        lastName: 'Caporaletti',
        openBankingConsentScopes: 'balances, transactions'
      },
      fallback
    );

    expect(profile.email).toBe('existing@example.com');
    expect(profile.connectionId).toBe('connection-1');
    expect(profile.displayName).toBe('Existing User');
    expect(profile.firstName).toBe('Daniele');
    expect(profile.lastName).toBe('Caporaletti');
    expect(profile.openBankingConsentScopes).toEqual(['balances', 'transactions']);
    expect(profile.notifyQuarterlyVat).toBe(false);
  });

  it('serializes a profile patch payload with trimmed values and derived answers', () => {
    const payload = toUserProfilePatchPayload({
      name: 'Daniele Caporaletti',
      displayName: '  Daniele C.  ',
      email: 'daniele@example.com',
      residence: 'Italy (IT)',
      vatFrequency: 'Yearly',
      logo: null,
      gdprAccepted: true,
      firstName: ' Daniele ',
      lastName: ' Caporaletti ',
      occupation: '   ',
      customerId: null,
      connectionId: null,
      dob: '1990-04-18',
      answer1: null,
      answer2: null,
      answer3: null,
      answer4: null,
      answer5: null
    });

    expect(payload.displayName).toBe('Daniele C.');
    expect(payload.firstName).toBe('Daniele');
    expect(payload.lastName).toBe('Caporaletti');
    expect(payload.occupation).toBeNull();
    expect(payload.answer1).toBe('Daniele C.');
    expect(payload.answer2).toBe('Italy (IT)');
    expect(payload.answer3).toBeNull();
  });
});
