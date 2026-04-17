import type { ReactNode } from 'react';

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
  icon: string | ReactNode;
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
  vatFrequency: string;
  logo: string | null;
  gdprAccepted: boolean;
  fiscalResidence?: string | null;
  taxRegime?: string | null;
  activityType?: string | null;
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
  privacyPolicyVersion?: string | null;
  privacyAcceptedAt?: string | null;
  termsOfServiceVersion?: string | null;
  termsAcceptedAt?: string | null;
  cookiePolicyVersion?: string | null;
  cookiePolicyAcknowledgedAt?: string | null;
  openBankingNoticeVersion?: string | null;
  openBankingNoticeAcceptedAt?: string | null;
  openBankingConsentScopes?: string[];
  notificationBalanceThreshold?: number;
  notifyCriticalBalance?: boolean;
  notifySignificantIncome?: boolean;
  notifyAbnormalOutflow?: boolean;
  notifyConsentExpiration?: boolean;
  notifySyncErrors?: boolean;
  notifyQuarterlyVat?: boolean;
  notifyMonthlyAnalysis?: boolean;
}

export interface LegalSectionRecord {
  title: string;
  bullets: string[];
}

export interface LegalDocumentRecord {
  slug: string;
  title: string;
  version: string;
  lastUpdated: string;
  summary: string;
  sections: LegalSectionRecord[];
}

export interface LegalControllerContactRecord {
  name: string;
  address: string;
  privacyEmail: string;
  dpoEmail: string;
  supportEmail: string;
  supervisoryAuthority: string;
}

export interface LegalProcessorRecord {
  name: string;
  purpose: string;
  dataCategories: string;
  region: string;
}

export interface LegalStorageTechnologyRecord {
  name: string;
  key: string;
  purpose: string;
  duration: string;
  essential: boolean;
}

export interface LegalPublicInfoRecord {
  controller: LegalControllerContactRecord;
  processors: LegalProcessorRecord[];
  storageTechnologies: LegalStorageTechnologyRecord[];
  privacyPolicy: LegalDocumentRecord;
  termsOfService: LegalDocumentRecord;
  cookiePolicy: LegalDocumentRecord;
  openBankingNotice: LegalDocumentRecord;
}

export interface RequiredLegalConsentPayload {
  acceptPrivacyPolicy: boolean;
  privacyPolicyVersion: string;
  acceptTermsOfService: boolean;
  termsOfServiceVersion: string;
  acknowledgeCookiePolicy: boolean;
  cookiePolicyVersion: string;
}

export interface OpenBankingConsentPayload {
  acceptOpenBankingNotice: boolean;
  openBankingNoticeVersion: string;
  scopes: string[];
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

export interface ForecastHistoricalPoint {
  key: string;
  label: string;
  income: number;
  expenses: number; // always positive
  net: number;
}

export interface ForecastPoint {
  key: string;
  label: string;
  predictedIncome: number;
  predictedExpenses: number; // always positive
  predictedNet: number;
}

export interface ForecastResponse {
  historical: ForecastHistoricalPoint[];
  forecast: ForecastPoint[];
  trend: 'GROWING' | 'DECLINING' | 'STABLE';
  monthsOfData: number;
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
  safeToSpend: number;
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
  warningMessage?: string | null;
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
  category?: string;
  periodLabel?: string | null;
  description?: string | null;
  systemGenerated?: boolean;
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
  bookingDate?: string;
}

export type NotificationKind = 'success' | 'warning' | 'info' | 'danger';

export type NotificationRecord = {
  id: string;
  unread: boolean;
  type: NotificationKind;
  title: string;
  description: string;
  time: string;
  createdAt: string;
  icon: string;
};
