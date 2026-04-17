import { UserProfile } from '../../../../shared/types';
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

  deleteUserProfile: () => request<void>('/api/users/profile', { method: 'DELETE' })
};
