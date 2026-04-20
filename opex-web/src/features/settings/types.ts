import {
  BankAccountRecord,
  BankConnectionRecord,
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
  onSaveProfile: (profile: UserProfile) => Promise<void>;
  onRequestEmailVerification: () => Promise<EmailVerificationRequestResult>;
  onNavigate: (view: string) => void;
  bankConnections: BankConnectionRecord[];
  bankAccounts: BankAccountRecord[];
  taxBufferProviders: TaxBufferProviderItem[];
  legalPublicInfo: LegalPublicInfoRecord | null;
  onCreateManualBankConnection: (providerName: string) => Promise<BankConnectionRecord>;
  onUpdateManualBankConnection: (
    connectionId: string,
    providerName: string
  ) => Promise<BankConnectionRecord>;
  onRemoveManualBankConnection: (connectionId: string) => Promise<void>;
  onCreateManualBankAccount: (
    connectionId: string,
    payload: {
      institutionName: string;
      balance: number;
      currency: string;
      isForTax: boolean;
      nature: string;
    }
  ) => Promise<BankAccountRecord>;
  onCreateOpenBankConnection: (consent: OpenBankingConsentPayload) => Promise<void>;
  onRemoveOpenBankConnection: (connectionId: string) => Promise<void>;
  onUpdateBankAccount?: (
    bankAccountId: string,
    isSaltedge: boolean,
    payload: {
      institutionName: string;
      nature: string;
      isForTax: boolean;
    },
    reviewContext?: {
      connectionId: string | null | undefined;
      connectionAccountIds: string[];
    }
  ) => Promise<void>;
  pendingConnectionReviewById?: Record<string, string[]>;
  initialBankConnectionId?: string | null;
  onInitialBankConnectionHandled?: () => void;
  onDownloadDataExport: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  isConnectingOpenBank?: boolean;
  openBankErrorMessage?: string | null;
  initialSection?: string;
};

export type SettingsSectionId =
  | 'PROFILE'
  | 'BRANDING'
  | 'TAXES'
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

export type EmailVerificationRequestResult = {
  emailVerified: boolean;
  verificationEmailSent: boolean;
  cooldownRemainingSeconds: number;
};

export type VerificationEmailActionState = {
  cta: string;
  detail: string;
  actionDisabled: boolean;
  requestVerificationEmail: () => Promise<void>;
};

export type SettingsChecklistItem = {
  id: number;
  label: string;
  completed: boolean;
  cta: string;
  targetSection?: SettingsSectionId;
  detail?: string;
  actionDisabled?: boolean;
  opensProfileEditor?: boolean;
  action: (() => Promise<void> | void) | null;
};

export type ConsentAuditItem = {
  label: string;
  version: string;
  acceptedAt: string;
};
