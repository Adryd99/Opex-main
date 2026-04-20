export interface UserProfilePatchPayload {
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
  residence: string;
  occupation: string | null;
  preferredLanguage: string | null;
  vatFrequency: string;
  gdprAccepted: boolean;
  fiscalResidence: string | null;
  taxRegime: string | null;
  activityType: string | null;
  customerId: string | null;
  connectionId: string | null;
  dob: string | null;
  answer1: string | null;
  answer2: string | null;
  answer3: string | null;
  answer4: string | null;
  answer5: string | null;
  profilePicture: string | null;
}

export interface LocalBankAccountPayload {
  balance: number;
  institutionName: string;
  currency: string;
  isForTax: boolean;
  nature: string;
}

export interface ManualBankConnectionPayload {
  providerName: string;
}

export interface ManualBankConnectionUpdatePayload {
  providerName: string;
}

export interface LocalBankAccountUpdatePayload extends Partial<LocalBankAccountPayload> {
  connectionId?: string | null;
  country?: string | null;
  isSaltedge?: boolean;
}

export interface SaltedgeBankAccountUpdatePayload {
  institutionName?: string;
  isForTax?: boolean;
  nature?: string;
}

export interface LocalTransactionPayload {
  bankAccountId: string;
  amount: number;
  bookingDate: string;
  category: string;
  description: string;
  merchantName: string;
  status: string;
  type: string;
}

export interface LocalTaxPayload {
  name: string;
  deadline: string;
  amount: number;
  currency: string;
  status: string;
}

export interface TaxBufferDashboardQuery {
  connectionId?: string;
  year?: number;
  deadlinesLimit?: number;
  activityLimit?: number;
}

export type BankIntegrationResponse = {
  url?: string;
  connectUrl?: string;
  redirectUrl?: string;
  authorizationUrl?: string;
  data?: {
    url?: string;
    connectUrl?: string;
    redirectUrl?: string;
    authorizationUrl?: string;
  };
  [key: string]: unknown;
} | string;
