import {
  BankAccountRecord,
  BankConnectionRecord,
  LegalPublicInfoRecord,
  OpenBankingConsentPayload
} from '../../shared/types';

export type AccountCategory = 'Personal' | 'Business' | 'Savings';

export type ProviderConnectionCard = {
  key: string;
  providerName: string;
  allAccounts: BankAccountRecord[];
  accountCount: number;
  totalBalance: number;
  currency: string | null;
  connectionId: string;
  status: string | null;
  isManagedConnection: boolean;
  connection: BankConnectionRecord;
};

export type UpdateBankAccountPayload = {
  institutionName: string;
  nature: string;
  isForTax: boolean;
  balance?: number;
  currency?: string;
};

export type CreateManualBankAccountPayload = {
  institutionName: string;
  balance: number;
  currency: string;
  isForTax: boolean;
  nature: string;
};

export type AddBankPageProps = {
  onNavigate: (view: string) => void;
  onCreateManualBankConnection: (providerName: string) => Promise<BankConnectionRecord>;
  onUpdateManualBankConnection: (
    connectionId: string,
    providerName: string
  ) => Promise<BankConnectionRecord>;
  onRemoveManualBankConnection: (connectionId: string) => Promise<void>;
  onCreateManualBankAccount: (
    connectionId: string,
    payload: CreateManualBankAccountPayload
  ) => Promise<BankAccountRecord>;
  onUpdateBankAccount?: (
    bankAccountId: string,
    isSaltedge: boolean,
    payload: UpdateBankAccountPayload,
    reviewContext?: {
      connectionId: string | null | undefined;
      connectionAccountIds: string[];
    }
  ) => Promise<void>;
  bankConnections: BankConnectionRecord[];
  onCreateOpenBankConnection: (consent: OpenBankingConsentPayload) => Promise<void>;
  onRemoveOpenBankConnection: (connectionId: string) => Promise<void>;
  legalPublicInfo?: LegalPublicInfoRecord | null;
  openBankingNoticeVersion?: string | null;
  isConnectingOpenBank?: boolean;
  openBankErrorMessage?: string | null;
  pendingConnectionReviewById?: Record<string, string[]>;
  embeddedInSettings?: boolean;
  initialConnectionId?: string | null;
  onInitialConnectionHandled?: () => void;
};
