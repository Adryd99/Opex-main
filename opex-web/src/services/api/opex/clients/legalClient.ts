import { RequiredLegalConsentPayload, UserProfile } from '../../../../shared/types';
import {
  DEFAULT_LEGAL_PUBLIC_INFO,
  persistRequiredLegalConsentsLocally
} from '../../legalFallbacks';
import { assertOkResponse, fetchAuthorized, request } from '../http';
import { normalizeLegalPublicInfo } from '../normalizers/legal';
import { normalizeUserProfile } from '../normalizers/user';

const getLegalPublicInfo = async () => {
  try {
    return normalizeLegalPublicInfo(await request<unknown>('/api/legal/public'));
  } catch {
    return DEFAULT_LEGAL_PUBLIC_INFO;
  }
};

const acceptRequiredConsentsWithFallback = async (
  payload: RequiredLegalConsentPayload,
  fallback?: Partial<UserProfile>
) => {
  try {
    return normalizeUserProfile(
      await request<unknown>('/api/legal/consents', {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),
      fallback
    );
  } catch (error) {
    if (!fallback) {
      throw error;
    }

    return persistRequiredLegalConsentsLocally(
      normalizeUserProfile(fallback, fallback),
      DEFAULT_LEGAL_PUBLIC_INFO,
      payload
    );
  }
};

const downloadDataExport = async () => {
  const response = await fetchAuthorized('/api/legal/export', { method: 'GET' });
  await assertOkResponse(response);

  const blob = await response.blob();
  const contentDisposition = response.headers.get('content-disposition') ?? '';
  const filenameMatch = contentDisposition.match(/filename=\"?([^"]+)\"?/i);
  const filename = filenameMatch?.[1] ?? 'opex-data-export.json';

  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

export const legalClient = {
  getLegalPublicInfo,
  acceptRequiredConsents: acceptRequiredConsentsWithFallback,
  downloadDataExport
};
