import { DEFAULT_LANGUAGE } from '../i18n/constants';
import { formatCurrencyForLanguage, formatNumberForLanguage } from '../i18n/formatting';

export const formatCurrency = (
  value: number,
  language: string = DEFAULT_LANGUAGE,
  currency = 'EUR'
): string =>
  formatCurrencyForLanguage(language, value, currency, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

export const formatRoundedNumber = (
  value: number,
  language: string = DEFAULT_LANGUAGE
): string =>
  formatNumberForLanguage(language, value, {
    maximumFractionDigits: 0
  });
