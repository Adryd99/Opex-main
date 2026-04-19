import { formatMonthLabelForLanguage } from '../../i18n/formatting';

export const formatPeriodLabel = (
  date: Date,
  period: 'month' | 'quarter' | 'year',
  language: string
): string => {
  if (period === 'month') {
    return formatMonthLabelForLanguage(language, date);
  }
  if (period === 'quarter') {
    return `Q${Math.floor(date.getMonth() / 3) + 1}`;
  }
  return String(date.getFullYear());
};

export const buildPeriodKey = (date: Date, period: 'month' | 'quarter' | 'year'): string => {
  const year = date.getFullYear();
  if (period === 'month') {
    return `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  if (period === 'quarter') {
    return `${year}-Q${Math.floor(date.getMonth() / 3) + 1}`;
  }
  return String(year);
};
