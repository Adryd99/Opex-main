import { Loader2, MoveRight, ShieldAlert } from 'lucide-react';
import { APP_TABS } from '../../../app/navigation';
import { AccountSelector, QuickActions } from '../../../app/layout';
import { Button, Card } from '../../../shared/ui';
import { TaxBufferDashboardResponse, UserProfile } from '../../../shared/types';
import {
  TaxBreakdownCard,
  TaxBufferSummaryCard,
  TaxComplianceCalendarCard,
  TaxLiabilitySplitCard,
  TaxSidebarCards
} from '../components';
import {
  getSortedTaxDeadlines,
  getTaxBufferActivity,
  getTaxIncomeSocial,
  getTaxLiabilities,
  getTaxSummary,
  getTaxVat,
  getUpcomingTaxDeadlines,
  hasTaxProfileConfigured
} from '../support';

type TaxesPageProps = {
  onNavigate: (tab: string) => void;
  selectedProviderName: string | null;
  userProfile: UserProfile;
  taxBufferDashboard: TaxBufferDashboardResponse | null;
  isLoading: boolean;
};

export const TaxesPage = ({
  onNavigate,
  selectedProviderName,
  userProfile,
  taxBufferDashboard,
  isLoading
}: TaxesPageProps) => {
  const isTaxProfileConfigured = hasTaxProfileConfigured(userProfile);
  const summary = getTaxSummary(taxBufferDashboard);
  const incomeSocial = getTaxIncomeSocial(taxBufferDashboard);
  const vat = getTaxVat(taxBufferDashboard);
  const liabilities = getTaxLiabilities(taxBufferDashboard);
  const sortedDeadlines = getSortedTaxDeadlines(taxBufferDashboard);
  const nextDeadlines = getUpcomingTaxDeadlines(taxBufferDashboard);
  const activity = getTaxBufferActivity(taxBufferDashboard);

  const handleOpenTaxSettings = () => {
    onNavigate(APP_TABS.SETTINGS_TAXES);
  };

  if (!isTaxProfileConfigured) {
    return (
      <div className="relative min-h-[calc(100vh-8rem)] space-y-8 md:min-h-[calc(100vh-6rem)]">
        <div className="mb-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900">Tax Buffer</h2>
            <p className="text-sm font-medium text-gray-500">
              Complete your tax profile first to unlock tax estimates and compliance guidance.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden border-amber-100 bg-gradient-to-br from-white via-amber-50/50 to-orange-50/60">
          <div className="flex flex-col gap-8 p-2 md:flex-row md:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.75rem] bg-opex-dark text-white shadow-lg shadow-slate-900/15">
              <ShieldAlert size={30} />
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-600">Tax setup required</p>
                <h3 className="text-2xl font-black tracking-tight text-gray-900">
                  Configure your tax profile in Settings before using Taxes
                </h3>
                <p className="max-w-2xl text-sm font-medium leading-relaxed text-gray-600">
                  We need your fiscal residence, tax regime and activity type before we can estimate liabilities,
                  show deadlines and build the Tax Buffer dashboard correctly.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  icon={MoveRight}
                  onClick={handleOpenTaxSettings}
                >
                  Open tax settings
                </Button>
                <p className="text-xs font-medium text-gray-500">
                  You will find the same tax setup flow inside <span className="font-black text-gray-700">Settings &gt; Taxes</span>.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)] space-y-8 md:min-h-[calc(100vh-6rem)]">
      <div className="mb-2 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-20">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Tax Buffer</h2>
          <p className="text-sm text-gray-500 font-medium">
            {selectedProviderName ? `Provider: ${selectedProviderName}` : 'Provider: All'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AccountSelector />
          <QuickActions onNavigate={onNavigate} />
        </div>
      </div>

      {isLoading && (
        <Card>
          <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
            <Loader2 size={16} className="animate-spin" />
            Loading tax dashboard...
          </div>
        </Card>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full space-y-8">
          <TaxBufferSummaryCard summary={summary} />
          <TaxBreakdownCard incomeSocial={incomeSocial} vat={vat} />
          <TaxLiabilitySplitCard liabilities={liabilities} />
          <TaxComplianceCalendarCard deadlines={sortedDeadlines} />
        </div>

        <div className="w-full lg:w-[380px] space-y-6">
          <TaxSidebarCards
            userProfile={userProfile}
            isTaxProfileConfigured={isTaxProfileConfigured}
            nextDeadlines={nextDeadlines}
            onOpenTaxSettings={handleOpenTaxSettings}
            activity={activity}
          />
        </div>
      </div>
    </div>
  );
};
