import {
  BankAccountRecord,
  BankOption,
  LegalPublicInfoRecord,
  OpenBankingConsentPayload,
  TaxBufferProviderItem,
  UserProfile
} from '../../shared/types';
import { LucideIcon } from 'lucide-react';

export type AddRecurringFormData = {
  name: string;
  type: string;
  amount: string;
  currency: string;
  frequency: string;
  startDate: string;
  nextBillingDate: string;
  notes: string;
};

export type AddRecurringModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: AddRecurringFormData) => void;
};

export type SettingsPageProps = {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  onNavigate: (view: string) => void;
  bankAccounts: BankAccountRecord[];
  taxBufferProviders: TaxBufferProviderItem[];
  legalPublicInfo: LegalPublicInfoRecord | null;
  onBankSelect: (bank: BankOption) => void;
  onConnectionSelect: (account: BankAccountRecord, providerName: string) => void;
  onCreateOpenBankConnection: (consent: OpenBankingConsentPayload) => Promise<void>;
  onRemoveOpenBankConnection: (connectionId: string) => Promise<void>;
  onUpdateBankAccount?: (
    bankAccountId: string,
    isSaltedge: boolean,
    payload: {
      institutionName: string;
      nature: string;
      isForTax: boolean;
    }
  ) => Promise<void>;
  onDownloadDataExport: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  isConnectingOpenBank?: boolean;
  openBankErrorMessage?: string | null;
  initialSection?: string;
};

export type SettingsSectionId =
  | 'PROFILE'
  | 'BRANDING'
  | 'BANKING'
  | 'PREFERENCES'
  | 'SECURITY'
  | 'PRIVACY'
  | 'HELP';

export type SettingsSectionDefinition = {
  id: SettingsSectionId;
  label: string;
  icon: LucideIcon;
};
