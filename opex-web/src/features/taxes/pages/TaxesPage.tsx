import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUp, Calculator, Calendar, Clock, Edit2, Globe, History, Info, Loader2, Receipt } from 'lucide-react';
import { AccountSelector, QuickActions } from '../../../app/layout';
import { Badge, Button, Card, type BadgeVariant } from '../../../shared/ui';
import { TaxBufferDashboardResponse, UserProfile } from '../../../shared/types';
import { TaxProfileSetupDialog } from '../components/TaxProfileSetupDialog';
import { hasTaxProfileConfigured } from '../support';

export const TaxesPage = ({
  onNavigate,
  selectedProviderName,
  userProfile,
  taxBufferDashboard,
  isLoading,
  onSaveTaxSetup
}: {
  onNavigate: (tab: string) => void;
  selectedProviderName: string | null;
  userProfile: UserProfile;
  taxBufferDashboard: TaxBufferDashboardResponse | null;
  isLoading: boolean;
  onSaveTaxSetup: (profile: UserProfile) => Promise<void>;
}) => {
  const currency = 'EUR';
  const formatMoney = (value: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  const formatDate = (value: string | null | undefined) => {
    if (!value) {
      return '-';
    }
    return new Date(`${value}T12:00:00`).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const summary = taxBufferDashboard?.summary ?? {
    shouldSetAside: 0,
    alreadySaved: 0,
    missing: 0,
    completionPercentage: 0,
    weeklyTarget: 0,
    safeToSpend: 0,
    targetDate: null
  };
  const incomeSocial = taxBufferDashboard?.incomeSocial ?? {
    taxableIncome: 0,
    incomeTax: 0,
    socialContributions: 0,
    subtotal: 0
  };
  const vat = taxBufferDashboard?.vat ?? {
    regime: 'N/A',
    rate: 0,
    vatLiability: 0
  };
  const isTaxProfileConfigured = hasTaxProfileConfigured(userProfile);
  const [isTaxSetupOpen, setIsTaxSetupOpen] = useState(!isTaxProfileConfigured);
  const liabilities = taxBufferDashboard?.liabilitySplit ?? [];
  const deadlines = taxBufferDashboard?.deadlines ?? [];
  const activity = taxBufferDashboard?.activity ?? [];
  const sortedDeadlines = [...deadlines].sort((left, right) => {
    const leftTime = left.dueDate ? new Date(`${left.dueDate}T12:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
    const rightTime = right.dueDate ? new Date(`${right.dueDate}T12:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
    return leftTime - rightTime;
  });
  const nextDeadlines = sortedDeadlines.slice(0, 4);

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
          <Card className="border-opex-teal/10 shadow-lg shadow-teal-900/5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mb-8">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">You should set aside</p>
                <p className="text-3xl font-black text-gray-900">{formatMoney(summary.shouldSetAside)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Already saved</p>
                <p className="text-3xl font-black text-opex-teal">{formatMoney(summary.alreadySaved)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Missing</p>
                <p className="text-3xl font-black text-gray-900">{formatMoney(summary.missing)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-opex-teal transition-all duration-1000 ease-out"
                  style={{ width: `${Math.max(0, Math.min(summary.completionPercentage, 100))}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Info size={14} />
                  Save {formatMoney(summary.weeklyTarget)}/week • target {formatDate(summary.targetDate)}
                </span>
                <span className="text-gray-900">{Math.round(summary.completionPercentage)}% Complete</span>
              </div>
            </div>
          </Card>

          <Card title="Detailed Tax Breakdown">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              <div className="space-y-6 pb-6 md:pb-0 md:pr-12">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
                    <Calculator size={16} />
                  </div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Income & Social</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Taxable Income</span>
                    <span className="text-gray-900 font-bold">{formatMoney(incomeSocial.taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Income Tax</span>
                    <span className="text-gray-900 font-bold">{formatMoney(incomeSocial.incomeTax)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Social Contributions</span>
                    <span className="text-gray-900 font-bold">{formatMoney(incomeSocial.socialContributions)}</span>
                  </div>
                  <div className="pt-3 border-t border-dashed border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Subtotal</span>
                    <span className="text-lg font-black text-opex-teal">{formatMoney(incomeSocial.subtotal)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-6 md:pt-0 md:pl-12">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
                    <Receipt size={16} />
                  </div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Value Added Tax</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">VAT Regime</span>
                    <Badge variant={vat.regime.toLowerCase().includes('kor') ? 'success' : 'neutral'}>{vat.regime || 'N/A'}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Contribution Rate</span>
                    <span className="text-gray-900 font-bold">{(vat.rate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="pt-3 border-t border-dashed border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase">VAT Liability</span>
                    <span className="text-lg font-black text-opex-teal">{formatMoney(vat.vatLiability)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Liability Split">
            <div className="space-y-8 py-2">
              {(liabilities.length > 0
                ? liabilities
                : [
                  { label: 'Income Tax', amount: incomeSocial.incomeTax, percentage: 0 },
                  { label: 'Social Contributions', amount: incomeSocial.socialContributions, percentage: 0 },
                  { label: 'VAT', amount: vat.vatLiability, percentage: 0 }
                ]).map((item) => (
                  <div key={item.label} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-base font-bold text-gray-500">{item.label}</span>
                      <span className="text-lg font-black text-gray-900">{formatMoney(item.amount)}</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-opex-teal rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(0, Math.min(item.percentage || 0, 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          <Card title="2026 Compliance Calendar">
            <div className="space-y-4">
              {sortedDeadlines.length === 0 && (
                <p className="text-sm text-gray-500 font-medium">No tax deadlines configured yet.</p>
              )}
              {sortedDeadlines.map((item) => {
                const isOverdue = item.status.toLowerCase().includes('overdue');
                const isDone = item.status.toLowerCase().includes('paid') || item.status.toLowerCase().includes('completed');
                const badgeVariant: BadgeVariant = isOverdue ? 'danger' : isDone ? 'success' : 'info';

                return (
                  <div
                    key={`calendar-${item.id || `${item.title}-${item.dueDate}`}`}
                    className={`rounded-[1.75rem] border p-5 transition-all ${isOverdue ? 'border-red-100 bg-red-50/70' : 'border-gray-100 bg-white'
                      }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-black text-gray-900">{item.title}</p>
                          {item.category && <Badge variant="neutral">{item.category}</Badge>}
                          {item.systemGenerated && <Badge variant="info">System</Badge>}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                          <span>{item.periodLabel || 'Custom deadline'}</span>
                          <span>Due {formatDate(item.dueDate)}</span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.description}</p>
                        )}
                      </div>
                      <Badge variant={badgeVariant}>{item.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="w-full lg:w-[380px] space-y-6">
          <Card title="Tax Setup" action={<Globe size={18} className="text-gray-400" />}>
            <div className="space-y-4">
              <div className="rounded-[1.5rem] bg-gray-50 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Fiscal Residence</span>
                  <span className="text-sm font-black text-gray-900">{userProfile.fiscalResidence || 'Not configured'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Tax Regime</span>
                  <span className="text-sm font-black text-gray-900">{userProfile.taxRegime || 'Not configured'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Activity Type</span>
                  <span className="text-sm font-black text-gray-900 text-right">{userProfile.activityType || 'Not configured'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">VAT Filing</span>
                  <span className="text-sm font-black text-gray-900">{userProfile.vatFrequency}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                These values drive tax estimates, compliance suggestions, and country-specific guidance.
              </p>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                icon={Edit2}
                onClick={() => setIsTaxSetupOpen(true)}
              >
                {isTaxProfileConfigured ? 'Update Tax Setup' : 'Complete Tax Setup'}
              </Button>
            </div>
          </Card>

          <Card title="Tax Deadlines" action={<Calendar size={18} className="text-gray-400" />}>
            <div className="space-y-5">
              {nextDeadlines.length === 0 && (
                <p className="text-sm text-gray-500 font-medium">No upcoming deadlines.</p>
              )}
              {nextDeadlines.map((item) => {
                const status = item.status.toLowerCase();
                const badgeVariant: BadgeVariant = status.includes('overdue')
                  ? 'danger'
                  : status.includes('paid') || status.includes('completed')
                    ? 'success'
                    : 'info';

                return (
                  <div key={item.id || `${item.title}-${item.dueDate}`} className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status.includes('overdue') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-none mb-1">{item.title}</p>
                        <p className="text-xs text-gray-400 font-medium">
                          {item.periodLabel ? `${item.periodLabel} • ` : ''}{formatDate(item.dueDate)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={badgeVariant}>{item.status}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Buffer Activity" action={<History size={18} className="text-gray-400" />}>
            <div className="space-y-6">
              {activity.length === 0 && (
                <p className="text-sm text-gray-500 font-medium">No recent activity.</p>
              )}
              {activity.map((item) => {
                const isIn = item.direction.toLowerCase().includes('in');
                return (
                  <div key={item.id || `${item.title}-${item.date}`} className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIn ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {isIn ? <ArrowUp size={16} /> : <ArrowDownRight size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-none mb-1">{item.title}</p>
                        <p className="text-xs text-gray-400">{formatDate(item.date)}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${isIn ? 'text-green-600' : 'text-gray-900'}`}>
                      {isIn ? '+' : '-'}{formatMoney(Math.abs(item.amount))}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
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

