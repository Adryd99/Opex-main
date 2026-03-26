import React from 'react';

export interface Account {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

export interface BankOption {
  name: string;
  color: string;
  icon: string | React.ReactNode;
  isManual?: boolean;
}

export interface ChartDataPoint {
  label: string;
  subLabel?: string;
  value: number;
}

export interface UserProfile {
  name: string;
  email: string;
  residence: string;
  logo: string | null;
  firstName?: string;
  lastName?: string;
  customerId?: string | null;
  connectionId?: string | null;
  dob?: string | null;
  answer1?: string | null;
  answer2?: string | null;
  answer3?: string | null;
  answer4?: string | null;
  answer5?: string | null;
}

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

export interface TaxRecord {
  id: string;
  name: string;
  deadline: string;
  amount: number;
  currency: string;
  status: string;
}

export interface AggregatedBalanceRecord {
  connectionId: string;
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
}

export interface TimeAggregatedPoint {
  key: string;
  label: string;
  connectionId?: string | null;
  income: number;
  expenses: number;
}

export interface TimeAggregatedRecord {
  byMonth: TimeAggregatedPoint[];
  byQuarter: TimeAggregatedPoint[];
  byYear: TimeAggregatedPoint[];
}

export interface TaxBufferProviderItem {
  connectionId: string;
  providerName: string;
  status: string;
}

export interface TaxBufferSummary {
  shouldSetAside: number;
  alreadySaved: number;
  missing: number;
  completionPercentage: number;
  weeklyTarget: number;
  targetDate: string | null;
}

export interface TaxBufferIncomeSocialBreakdown {
  taxableIncome: number;
  incomeTax: number;
  socialContributions: number;
  subtotal: number;
}

export interface TaxBufferVatBreakdown {
  regime: string;
  rate: number;
  vatLiability: number;
}

export interface TaxBufferLiabilityItem {
  label: string;
  amount: number;
  percentage: number;
}

export interface TaxBufferDeadlineItem {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  amount: number;
  currency: string;
}

export interface TaxBufferActivityItem {
  id: string;
  title: string;
  date: string;
  amount: number;
  direction: string;
}

export interface TaxBufferSafeMode {
  compliant: boolean;
  message: string;
  recommendation: string;
}

export interface TaxBufferDashboardResponse {
  selectedConnectionId: string | null;
  year: number;
  currency: string;
  summary: TaxBufferSummary;
  incomeSocial: TaxBufferIncomeSocialBreakdown;
  vat: TaxBufferVatBreakdown;
  liabilitySplit: TaxBufferLiabilityItem[];
  deadlines: TaxBufferDeadlineItem[];
  activity: TaxBufferActivityItem[];
  providers: TaxBufferProviderItem[];
  safeMode: TaxBufferSafeMode;
}

export interface PaginatedResponse<T> {
  content: T[];
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
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
}
