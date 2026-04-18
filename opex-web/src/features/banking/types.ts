import {
  BankAccountRecord,
  BankOption,
  LegalPublicInfoRecord,
  OpenBankingConsentPayload,
  TaxBufferProviderItem
} from '../../shared/types';

export type AccountCategory = 'Personal' | 'Business' | 'Savings';

export type ProviderConnectionCard = {
  key: string;
  account: BankAccountRecord;
  allAccounts: BankAccountRecord[];
  accountCount: number;
  totalBalance: number;
  connectionId: string | null;
  status: string | null;
  isManagedConnection: boolean;
};

export type ProviderConnectionGroup = {
  providerName: string;
  connections: ProviderConnectionCard[];
};

export type UpdateBankAccountPayload = {
  institutionName: string;
  nature: string;
  isForTax: boolean;
};

export type AddBankPageProps = {
  onNavigate: (view: string) => void;
  onBankSelect: (bank: BankOption) => void;
  onConnectionSelect: (account: BankAccountRecord, providerName: string) => void;
  onUpdateBankAccount?: (bankAccountId: string, isSaltedge: boolean, payload: UpdateBankAccountPayload) => Promise<void>;
  bankAccounts: BankAccountRecord[];
  taxBufferProviders?: TaxBufferProviderItem[];
  onCreateOpenBankConnection: (consent: OpenBankingConsentPayload) => Promise<void>;
  onRemoveOpenBankConnection: (connectionId: string) => Promise<void>;
  legalPublicInfo?: LegalPublicInfoRecord | null;
  openBankingNoticeVersion?: string | null;
  isConnectingOpenBank?: boolean;
  openBankErrorMessage?: string | null;
  embeddedInSettings?: boolean;
};
