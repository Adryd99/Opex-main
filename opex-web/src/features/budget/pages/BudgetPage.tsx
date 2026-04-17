import { AlertTriangle, Calendar, Lock } from 'lucide-react';
import { AccountSelector, QuickActions } from '../../../app/layout';
import { Badge, type BadgeVariant } from '../../../shared/ui';
import { ForecastResponse, TimeAggregatedRecord } from '../../../shared/types';
import { ForecastCompactWidget } from '../components/ForecastCompactWidget';
import { formatCurrency } from '../../../shared/formatting';

export const BudgetPage = ({
  onNavigate,
  selectedProviderName,
  aggregatedSummary,
  timeAggregatedSummary,
  forecastData
}: {
  onNavigate: (tab: string) => void;
  selectedProviderName: string | null;
  aggregatedSummary: {
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
  };
  timeAggregatedSummary: TimeAggregatedRecord;
  forecastData?: ForecastResponse | null;
}) => {
  type RiskStyles = {
    bg: string;
    border: string;
    text: string;
    iconBg: string;
    iconText: string;
    badge: BadgeVariant;
    label: string;
    message: string;
  };

  const clientConcentration = 62; // Example value for conditional rendering
  const totalBalance = Number(aggregatedSummary.totalBalance || 0);
  const totalIncome = Number(aggregatedSummary.totalIncome || 0);
  const totalExpenses = Number(aggregatedSummary.totalExpenses || 0);
  const safeToSpend = totalBalance - totalExpenses;
  const monthlyBurn = Math.max(totalExpenses, 1);
  const runwayMonths = totalBalance / monthlyBurn;
  const runwayProgress = Math.max(0, Math.min((runwayMonths / 3) * 100, 100));

  // Color thresholds for Client Risk
  const getRiskStyles = (val: number): RiskStyles => {
    if (val > 70) return {
      bg: 'bg-red-50/50',
      border: 'border-red-100',
      text: 'text-red-600',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
      badge: 'danger',
      label: 'High Risk',
      message: 'Revenue is highly concentrated. Diversification recommended.'
    };
    return {
      bg: 'bg-orange-50/50',
      border: 'border-orange-100',
      text: 'text-orange-600',
      iconBg: 'bg-orange-100',
      iconText: 'text-orange-600',
      badge: 'warning',
      label: 'Moderate Risk',
      message: 'Revenue is moderately concentrated. Consider diversification.'
    };
  };

  const risk = getRiskStyles(clientConcentration);

  return (
    <div className="space-y-3">
      {/* Header - Compact */}
      <div className="flex justify-between items-center px-1 relative z-20">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Budget Control</h2>
          <p className="text-xs text-gray-500 font-semibold">
            {selectedProviderName ? `Provider: ${selectedProviderName}` : 'Provider: All'}
          </p>
        </div>
        <div className="flex items-center gap-2 scale-90 origin-right">
          <AccountSelector />
          <QuickActions onNavigate={onNavigate} />
        </div>
      </div>

      {/* Row 1: SAFE TO SPEND - Full width */}
      <div className="bg-white rounded-[2rem] py-4 px-5 border border-gray-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden min-h-[130px]">
        <div className="absolute top-0 right-0 p-10 bg-opex-teal/5 rounded-full translate-x-6 -translate-y-6 blur-xl"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 relative z-10">Safe to Spend</p>
        <div className="flex items-baseline gap-1 relative z-10">
          <span className="text-2xl font-light text-gray-400">€</span>
          <span className="text-5xl font-black text-gray-900 tracking-tight">
            {Math.round(Math.max(safeToSpend, 0)).toLocaleString('it-IT')}
          </span>
        </div>
        <div className="text-center relative z-10">
          <p className="text-xs font-bold text-gray-900">Safe amount you can withdraw this month</p>
          <p className="text-[10px] font-bold text-gray-400">
            Income {Math.round(totalIncome).toLocaleString('it-IT')} • Expenses {Math.round(totalExpenses).toLocaleString('it-IT')}
          </p>
        </div>
      </div>

      {/* Row 2: Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 items-stretch">
        <div className={`${clientConcentration > 50 ? 'lg:col-span-6' : 'lg:col-span-10'}`}>
          {/* 2. FINANCIAL RUNWAY (Integrated Emergency Buffer) */}
          <div className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm h-full flex flex-col justify-center">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Financial Runway</p>
                  <h3 className="text-xl font-black text-gray-900">{runwayMonths.toFixed(1)} months of coverage</h3>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                  <span className="text-emerald-600 font-black">{Math.round(runwayProgress)}% reached</span> • Target: 3 months
                </p>
              </div>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${runwayProgress}%` }}></div>
            </div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
              Based on your aggregated expenses of {formatCurrency(totalExpenses)}
            </p>
          </div>
        </div>

        {/* 3. CLIENT RISK (Conditional Block) */}
        {clientConcentration > 50 && (
          <div className="lg:col-span-4 relative">
            {/* Coming Soon overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-[2rem] pointer-events-auto select-none">
              <div className="flex flex-col items-center gap-2 text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-700 tracking-tight">Coming Soon</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5 max-w-xs">Client risk analysis in development.</p>
                </div>
              </div>
            </div>
            <div className={`${risk.bg} rounded-[2rem] p-5 border ${risk.border} h-full flex flex-col justify-center pointer-events-none select-none`} style={{ filter: 'blur(2px)', opacity: 0.5 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${risk.iconBg} flex items-center justify-center ${risk.iconText}`}>
                    <AlertTriangle size={20} />
                  </div>
                  <p className={`text-[10px] font-black ${risk.iconText} uppercase tracking-widest`}>Client Risk</p>
                </div>
                <Badge variant={risk.badge}>{risk.label}</Badge>
              </div>
              <p className="text-sm font-bold text-gray-900 leading-tight">
                <span className={`${risk.text} text-lg`}>{clientConcentration}%</span> of revenue comes from 1 client
              </p>
              <p className="text-[10px] text-gray-400 font-bold mt-1">{risk.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Row 3: SUSTAINABILITY FORECAST - Full width */}
      <div className="scale-[0.99] origin-top">
        <ForecastCompactWidget timeAggregatedSummary={timeAggregatedSummary} forecastData={forecastData} />
      </div>
    </div>
  );
};

