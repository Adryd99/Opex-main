import type { UserProfile } from '../../../../shared/types/user';
import { request } from '../http';
import { normalizeUserProfile } from '../normalizers/user';
import { UserProfilePatchPayload } from '../types';

type NotificationSettingsPatch = {
  notificationBalanceThreshold?: number;
  notifyCriticalBalance?: boolean;
  notifySignificantIncome?: boolean;
  notifyAbnormalOutflow?: boolean;
  notifyConsentExpiration?: boolean;
  notifySyncErrors?: boolean;
  notifyQuarterlyVat?: boolean;
  notifyMonthlyAnalysis?: boolean;
};

type EmailVerificationStatusResponse = {
  emailVerified: boolean;
  verificationEmailSent: boolean;
  cooldownRemainingSeconds: number;
};

export const userClient = {
  syncUser: async (fallback?: Partial<UserProfile>) =>
    normalizeUserProfile(await request<unknown>('/api/users/sync', { method: 'POST' }), fallback),

  patchUserProfile: async (payload: UserProfilePatchPayload, fallback?: Partial<UserProfile>) =>
    normalizeUserProfile(
      await request<unknown>('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),
      fallback
    ),

  updateNotificationSettings: async (payload: NotificationSettingsPatch) =>
    normalizeUserProfile(
      await request<unknown>('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })
    ),

  sendVerificationEmail: () =>
    request<EmailVerificationStatusResponse>('/api/users/profile/send-verification-email', { method: 'POST' }),

  deleteUserProfile: () => request<void>('/api/users/profile', { method: 'DELETE' })
};
