import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AccountSelector, QuickActions } from '../../../app/layout';
import { Card } from '../../../shared/ui';
import { TaxBufferDashboardResponse, UserProfile } from '../../../shared/types';
import {
  TaxBreakdownCard,
  TaxBufferSummaryCard,
  TaxComplianceCalendarCard,
  TaxLiabilitySplitCard,
  TaxProfileSetupDialog,
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
  onSaveTaxSetup: (profile: UserProfile) => Promise<void>;
};

export const TaxesPage = ({
  onNavigate,
  selectedProviderName,
  userProfile,
  taxBufferDashboard,
  isLoading,
  onSaveTaxSetup
}: TaxesPageProps) => {
  const isTaxProfileConfigured = hasTaxProfileConfigured(userProfile);
  const [isTaxSetupOpen, setIsTaxSetupOpen] = useState(!isTaxProfileConfigured);
  const summary = getTaxSummary(taxBufferDashboard);
  const incomeSocial = getTaxIncomeSocial(taxBufferDashboard);
  const vat = getTaxVat(taxBufferDashboard);
  const liabilities = getTaxLiabilities(taxBufferDashboard);
  const sortedDeadlines = getSortedTaxDeadlines(taxBufferDashboard);
  const nextDeadlines = getUpcomingTaxDeadlines(taxBufferDashboard);
  const activity = getTaxBufferActivity(taxBufferDashboard);

  useEffect(() => {
    if (!isTaxProfileConfigured) {
      setIsTaxSetupOpen(true);
    }
  }, [isTaxProfileConfigured]);

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
            setIsTaxSetupOpen={setIsTaxSetupOpen}
            activity={activity}
          />
        </div>
      </div>

      <TaxProfileSetupDialog
        isOpen={isTaxSetupOpen}
        isRequired={!isTaxProfileConfigured}
        userProfile={userProfile}
        onClose={() => setIsTaxSetupOpen(false)}
        onSave={onSaveTaxSetup}
      />
    </div>
  );
};
