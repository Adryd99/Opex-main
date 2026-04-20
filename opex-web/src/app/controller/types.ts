import {
  BankAccountRecord,
  BankConnectionRecord,
  ForecastResponse,
  PaginatedResponse,
  TaxBufferDashboardResponse,
  TaxBufferProviderItem,
  TaxRecord,
  TransactionRecord
} from '../../shared/types';

export interface DashboardRefreshResult {
  connectionsResult: BankConnectionRecord[];
  accountsResult: PaginatedResponse<BankAccountRecord>;
  transactionsResult: TransactionRecord[];
  taxesResult: PaginatedResponse<TaxRecord>;
  forecastResult: ForecastResponse;
  taxProvidersResult: TaxBufferProviderItem[];
  taxDashboardResult: TaxBufferDashboardResponse;
}

export interface BankAccountSettingsPayload {
  institutionName: string;
  nature: string;
  isForTax: boolean;
  balance?: number;
  currency?: string;
}
