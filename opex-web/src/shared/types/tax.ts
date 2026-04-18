export interface TaxRecord {
  id: string;
  name: string;
  deadline: string;
  amount: number;
  currency: string;
  status: string;
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
