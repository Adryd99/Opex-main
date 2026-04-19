import { Landmark, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../shared/ui';
import { AddBankPage } from '../../banking';
import { groupProviderConnections } from '../../banking/utils';
import { SettingsPageProps } from '../types';

type SettingsBankingSectionProps = Pick<
  SettingsPageProps,
  | 'onNavigate'
  | 'onBankSelect'
  | 'onConnectionSelect'
  | 'onUpdateBankAccount'
  | 'bankAccounts'
  | 'taxBufferProviders'
  | 'onCreateOpenBankConnection'
  | 'onRemoveOpenBankConnection'
  | 'legalPublicInfo'
  | 'isConnectingOpenBank'
  | 'openBankErrorMessage'
> & {
  openBankingNoticeVersion: string | null;
};

export const SettingsBankingSection = ({
  onNavigate,
  onBankSelect,
  onConnectionSelect,
  onUpdateBankAccount,
  bankAccounts,
  taxBufferProviders,
  onCreateOpenBankConnection,
  onRemoveOpenBankConnection,
  legalPublicInfo,
  openBankingNoticeVersion,
  isConnectingOpenBank = false,
  openBankErrorMessage = null
}: SettingsBankingSectionProps) => {
  const { t } = useTranslation('settings');
  const groupedConnections = useMemo(
    () => groupProviderConnections(bankAccounts, taxBufferProviders),
    [bankAccounts, taxBufferProviders]
  );

  const totalSources = groupedConnections.reduce((sum, group) => sum + group.connections.length, 0);
  const liveConnections = groupedConnections.reduce(
    (sum, group) => sum + group.connections.filter((connection) => connection.isManagedConnection).length,
    0
  );
  const liveAccounts = bankAccounts.filter((account) => account.isSaltedge).length;
  const manualAccounts = bankAccounts.length - liveAccounts;
  const taxBufferAccounts = bankAccounts.filter((account) => account.isForTax).length;

  const heroTitle = liveConnections > 0
    ? t('bankingSection.heroTitleConnected')
    : t('bankingSection.heroTitleEmpty');
  const heroDescription = liveConnections > 0
    ? t('bankingSection.heroDescriptionConnected')
    : t('bankingSection.heroDescriptionEmpty');
  const statusLabel = liveConnections > 0
    ? t('bankingSection.statusLiveConnection', { count: liveConnections })
    : t('bankingSection.statusReady');

  const summaryItems = [
    {
      label: t('bankingSection.summary.connectedBanks'),
      value: String(liveConnections),
      detail: totalSources > 0
        ? t('bankingSection.summary.totalSources', { count: totalSources })
        : t('bankingSection.summary.totalSourcesZero')
    },
    {
      label: t('bankingSection.summary.accountsTracked'),
      value: String(bankAccounts.length),
      detail: manualAccounts > 0
        ? t('bankingSection.summary.manualAccounts', { count: manualAccounts })
        : liveAccounts > 0
          ? t('bankingSection.summary.importedAccounts')
          : t('bankingSection.summary.accountsPlaceholder')
    },
    {
      label: t('bankingSection.summary.taxBufferAccounts'),
      value: String(taxBufferAccounts),
      detail: taxBufferAccounts > 0
        ? t('bankingSection.summary.taxBufferEnabled')
        : t('bankingSection.summary.taxBufferMissing')
    }
  ] as const;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card title={t('bankingSection.title')}>
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-gray-100 bg-gradient-to-br from-white via-slate-50 to-emerald-50/70 p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-opex-dark text-white shadow-lg shadow-slate-900/10">
                  <Landmark size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">{t('bankingSection.badge')}</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900">
                    {heroTitle}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-gray-500">
                    {heroDescription}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center rounded-2xl border border-emerald-100 bg-white/85 px-4 py-3 text-sm font-black text-emerald-700 shadow-sm">
                {statusLabel}
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.5rem] border border-white/80 bg-white/75 p-4 shadow-sm shadow-slate-900/5"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-gray-900">{item.value}</p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-gray-500">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-white/80 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">{t('bankingSection.secureFlowTitle')}</p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-gray-500">
                    {t('bankingSection.secureFlowDescription')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <AddBankPage
              embeddedInSettings
              onNavigate={onNavigate}
              onBankSelect={onBankSelect}
              onConnectionSelect={onConnectionSelect}
              onUpdateBankAccount={onUpdateBankAccount}
              bankAccounts={bankAccounts}
              taxBufferProviders={taxBufferProviders}
              onCreateOpenBankConnection={onCreateOpenBankConnection}
              onRemoveOpenBankConnection={onRemoveOpenBankConnection}
              legalPublicInfo={legalPublicInfo}
              openBankingNoticeVersion={openBankingNoticeVersion}
              isConnectingOpenBank={isConnectingOpenBank}
              openBankErrorMessage={openBankErrorMessage}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
