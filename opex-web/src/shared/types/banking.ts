export interface BankAccountRecord {
  id: string;
  accountId?: string | null;
  saltedgeAccountId?: string | null;
  saltedge_account_id?: string | null;
  institutionName: string;
  currency: string;
  balance: number;
  isForTax?: boolean;
  nature?: string;
  isSaltedge?: boolean;
  connectionId?: string | null;
  country?: string | null;
}

export interface TransactionRecord {
  id: string;
  bankAccountId?: string;
  connectionId?: string | null;
  amount: number;
  bookingDate: string;
  category?: string;
  description?: string;
  merchantName?: string;
  status?: string;
  type?: string;
}

export interface ManualBankSetupInput {
  institutionName: string;
  balance: number;
  currency: string;
  isForTax: boolean;
  nature: string;
}

export interface CreateLocalTransactionInput {
  bankAccountId: string;
  amount: number;
  category: string;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  bookingDate?: string;
}
