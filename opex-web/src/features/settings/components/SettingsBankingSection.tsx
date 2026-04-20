import { Landmark, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../shared/ui';
import { AddBankPage } from '../../banking';
import { SettingsPageProps } from '../types';

type SettingsBankingSectionProps = Pick<
  SettingsPageProps,
  | 'onNavigate'
  | 'onCreateManualBankConnection'
  | 'onCreateManualBankAccount'
  | 'onUpdateBankAccount'
  | 'bankConnections'
  | 'bankAccounts'
  | 'onCreateOpenBankConnection'
  | 'onRemoveOpenBankConnection'
  | 'pendingConnectionReviewById'
  | 'initialBankConnectionId'
  | 'onInitialBankConnectionHandled'
  | 'legalPublicInfo'
  | 'onUpdateManualBankConnection'
  | 'onRemoveManualBankConnection'
  | 'isConnectingOpenBank'
  | 'openBankErrorMessage'
> & {
  openBankingNoticeVersion: string | null;
};

export const SettingsBankingSection = ({
  onNavigate,
  onCreateManualBankConnection,
  onUpdateManualBankConnection,
  onRemoveManualBankConnection,
  onCreateManualBankAccount,
  onUpdateBankAccount,
  bankConnections,
  bankAccounts,
  onCreateOpenBankConnection,
  onRemoveOpenBankConnection,
  pendingConnectionReviewById,
  initialBankConnectionId,
  onInitialBankConnectionHandled,
  legalPublicInfo,
  openBankingNoticeVersion,
  isConnectingOpenBank = false,
  openBankErrorMessage = null
}: SettingsBankingSectionProps) => {
  const { t } = useTranslation('settings');
  const totalSources = bankConnections.length;
  const liveConnections = bankConnections.filter((connection) => connection.type === 'SALTEDGE').length;
  const liveAccounts = bankAccounts.filter((account) => account.isSaltedge).length;
  const manualAccounts = bankAccounts.length - liveAccounts;
  const taxBufferAccounts = bankAccounts.filter((account) => account.isForTax).length;
  const hasAnySources = totalSources > 0;

  const heroTitle = hasAnySources
    ? t('bankingSection.heroTitleConnected')
    : t('bankingSection.heroTitleEmpty');
  const heroDescription = hasAnySources
    ? t('bankingSection.heroDescriptionConnected')
    : t('bankingSection.heroDescriptionEmpty');
  const manualBanks = bankConnections.filter((connection) => connection.type === 'MANUAL').length;
  const statusLabel = liveConnections > 0
    ? t('bankingSection.statusLiveConnection', { count: liveConnections })
    : manualBanks > 0
      ? t('bankingSection.statusManualBanks', { count: manualBanks })
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
          <div className="rounded-[2rem] border border-app-border bg-gradient-to-br from-app-surface via-app-muted to-emerald-100/60 p-6 md:p-8 dark:to-emerald-500/10 transition-colors duration-200">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-opex-dark text-white shadow-lg shadow-slate-900/10 dark:bg-opex-teal dark:text-slate-950 transition-colors duration-200">
                  <Landmark size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-app-tertiary">{t('bankingSection.badge')}</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-app-primary">
                    {heroTitle}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-app-secondary">
                    {heroDescription}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center rounded-2xl border border-emerald-100 bg-white/85 px-4 py-3 text-sm font-black text-emerald-700 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200 transition-colors duration-200">
                {statusLabel}
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.5rem] border border-white/80 bg-white/75 p-4 shadow-sm shadow-slate-900/5 dark:border-app-border dark:bg-app-surface/90 transition-colors duration-200"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-app-tertiary">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-app-primary">{item.value}</p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-app-secondary">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-white/80 p-4 dark:border-emerald-400/20 dark:bg-emerald-500/10 transition-colors duration-200">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200 transition-colors duration-200">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-app-primary">{t('bankingSection.secureFlowTitle')}</p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-app-secondary">
                    {t('bankingSection.secureFlowDescription')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-app-border bg-app-surface p-6 shadow-sm transition-colors duration-200 md:p-8">
            <AddBankPage
              embeddedInSettings
              onNavigate={onNavigate}
              onCreateManualBankConnection={onCreateManualBankConnection}
              onUpdateManualBankConnection={onUpdateManualBankConnection}
              onRemoveManualBankConnection={onRemoveManualBankConnection}
              onCreateManualBankAccount={onCreateManualBankAccount}
              onUpdateBankAccount={onUpdateBankAccount}
              bankConnections={bankConnections}
              onCreateOpenBankConnection={onCreateOpenBankConnection}
              onRemoveOpenBankConnection={onRemoveOpenBankConnection}
              pendingConnectionReviewById={pendingConnectionReviewById}
              initialConnectionId={initialBankConnectionId}
              onInitialConnectionHandled={onInitialBankConnectionHandled}
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
