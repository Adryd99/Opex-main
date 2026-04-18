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
  expenses: number;
  net: number;
}

export interface ForecastPoint {
  key: string;
  label: string;
  predictedIncome: number;
  predictedExpenses: number;
  predictedNet: number;
}

export interface ForecastResponse {
  historical: ForecastHistoricalPoint[];
  forecast: ForecastPoint[];
  trend: 'GROWING' | 'DECLINING' | 'STABLE';
  monthsOfData: number;
}
