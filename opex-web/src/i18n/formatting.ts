import { resolveLocaleTag } from './constants';

type DateOptions = Intl.DateTimeFormatOptions;
type NumberOptions = Intl.NumberFormatOptions;

export const formatDateForLanguage = (
  language: string,
  value: Date | number | string,
  options?: DateOptions
) => new Intl.DateTimeFormat(resolveLocaleTag(language), options).format(new Date(value));

export const formatNumberForLanguage = (
  language: string,
  value: number,
  options?: NumberOptions
) => new Intl.NumberFormat(resolveLocaleTag(language), options).format(value);

export const formatCurrencyForLanguage = (
  language: string,
  value: number,
  currency = 'EUR',
  options?: Omit<NumberOptions, 'style' | 'currency'>
) =>
  new Intl.NumberFormat(resolveLocaleTag(language), {
    style: 'currency',
    currency,
    ...options
  }).format(value);

export const formatMonthLabelForLanguage = (
  language: string,
  value: Date | number | string,
  options?: Pick<DateOptions, 'month'>
) =>
  new Intl.DateTimeFormat(resolveLocaleTag(language), {
    month: options?.month ?? 'short'
  }).format(new Date(value));

export const formatDateTimeForLanguage = (
  language: string,
  value: Date | number | string,
  options?: DateOptions
) =>
  new Intl.DateTimeFormat(resolveLocaleTag(language), options).format(new Date(value));
