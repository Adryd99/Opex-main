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

export interface PaginatedResponse<T> {
  content: T[];
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
}
