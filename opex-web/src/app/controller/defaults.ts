import { UserProfile } from '../../shared/types';

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Opex User',
  email: '',
  residence: '',
  vatFrequency: 'Yearly',
  logo: null,
  gdprAccepted: false,
  fiscalResidence: null,
  taxRegime: null,
  activityType: null,
  openBankingConsentScopes: []
};

export type BankSyncStage = 'idle' | 'opening_widget' | 'waiting_success_redirect' | 'syncing_success';
