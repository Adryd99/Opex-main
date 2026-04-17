import { API_ORIGIN } from '../http';
import { BankIntegrationResponse } from '../types';
import { firstNonEmptyString } from './support';

const resolveUrlAgainstApiBase = (value: string): string => {
  try {
    return new URL(value).toString();
  } catch {
    return new URL(value, API_ORIGIN).toString();
  }
};

export const extractBankPopupUrl = (payload: BankIntegrationResponse): string | null => {
  const rawUrl =
    typeof payload === 'string'
      ? payload
      : firstNonEmptyString(
        payload.url,
        payload.redirectUrl,
        payload.authorizationUrl,
        payload.data?.url,
        payload.data?.redirectUrl,
        payload.data?.authorizationUrl
      );

  if (!rawUrl) {
    return null;
  }

  return resolveUrlAgainstApiBase(rawUrl);
};
