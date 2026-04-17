import { bankingClient } from './opex/clients/bankingClient';
import { financeClient } from './opex/clients/financeClient';
import { legalClient } from './opex/clients/legalClient';
import { notificationsClient } from './opex/clients/notificationsClient';
import { userClient } from './opex/clients/userClient';
import { extractBankPopupUrl } from './opex/normalizers/banking';
import { toUserProfilePatchPayload } from './opex/normalizers/user';

export const opexApi = {
  ...legalClient,
  ...userClient,
  ...financeClient,
  ...bankingClient,
  ...notificationsClient
};

export { extractBankPopupUrl, toUserProfilePatchPayload };
export type {
  BankIntegrationResponse,
  LocalBankAccountPayload,
  LocalBankAccountUpdatePayload,
  LocalTaxPayload,
  LocalTransactionPayload,
  SaltedgeBankAccountUpdatePayload,
  TaxBufferDashboardQuery,
  UserProfilePatchPayload
} from './opex/types';
