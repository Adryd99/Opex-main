export interface Account {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
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
