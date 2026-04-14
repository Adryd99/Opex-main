import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  TrendingUp,
  MoreVertical,
  Settings,
  Lock,
  Globe,
  ShieldCheck,
  Wallet,
  TrendingDown,
  ArrowUp,
  FilePlus,
  Building2,
  DollarSign,
  Receipt,
  Users,
  ChevronRight,
  Calculator,
  Lightbulb,
  FileText,
  Clock,
  ExternalLink,
  Zap,
  Sparkles,
  Info,
  Bell,
  History,
  Calendar,
  Check,
  XCircle,
  Edit2,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Mail,
  HelpCircle,
  MessageSquare,
  Moon,
  Sun,
  Key,
  Layers,
  CircleDashed,
  Eye,
  Camera,
  Upload,
  ShoppingBag,
  Car,
  Home,
  Utensils,
  Coffee,
  Sliders,
  X,
  ChevronDown,
  Briefcase,
  Gift,
  Coins,
  Loader2,
  Activity,
  GripVertical,
  Copy,
  CheckCircle2,
  ArrowRightLeft,
  Image,
  Palette
} from 'lucide-react';

import {
  BankAccountRecord,
  BankOption,
  CreateLocalTransactionInput,
  LegalPublicInfoRecord,
  ManualBankSetupInput,
  OpenBankingConsentPayload,
  ForecastResponse,
  TaxBufferDashboardResponse,
  TaxBufferProviderItem,
  TimeAggregatedRecord,
  TransactionRecord,
  UserProfile
} from '../models/types';
import { MONTHLY_INSIGHT_MESSAGES } from '../data/monthlyInsights';
import { AccountSelector, Button, Card, Badge, ToggleFilter, RecurringWidget, ClickableStat, QuickActions, EnhancedLineChart, MiniPieChart, ForecastCompactWidget, SubpageShell } from './components';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);

const MONTHLY_INSIGHT_AREA_CLASS: Record<string, string> = {
  Tax: 'text-amber-200',
  VAT: 'text-cyan-200',
  Cashflow: 'text-emerald-200',
  Income: 'text-sky-200',
  Budget: 'text-orange-200',
  Behaviour: 'text-rose-200',
  Spending: 'text-fuchsia-200',
  Risk: 'text-red-200',
  Subscriptions: 'text-violet-200',
  Savings: 'text-lime-200',
  'Tax/Savings': 'text-yellow-200',
  Efficiency: 'text-teal-200',
  Safety: 'text-red-200',
  Insight: 'text-white'
};

type OnboardingQuestionField = 'fullName' | 'residence' | 'occupation';

type OnboardingQuestionStep = {
  field: OnboardingQuestionField;
  step: number;
  title: string;
  description: string;
  fieldLabel: string;
  placeholder: string;
  ctaLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

type ProviderConnectionCard = {
  key: string;
  account: BankAccountRecord;
  accountCount: number;
  totalBalance: number;
  connectionId: string | null;
  status: string | null;
  isManagedConnection: boolean;
};

const ONBOARDING_QUESTION_STEPS: OnboardingQuestionStep[] = [
  {
    field: 'fullName',
    step: 1,
    title: 'What should we call you?',
    description: 'Your name helps us personalize your dashboard insights.',
    fieldLabel: 'Full Name',
    placeholder: 'Type here...',
    ctaLabel: 'Next Question',
    icon: Users
  },
  {
    field: 'residence',
    step: 2,
    title: 'Where are you based?',
    description: 'Tax rules and bank integrations vary by country.',
    fieldLabel: 'Place of Residence',
    placeholder: 'Type here...',
    ctaLabel: 'Next Question',
    icon: Globe
  },
  {
    field: 'occupation',
    step: 3,
    title: "What's your occupation?",
    description: 'Tell us what you do to refine your expense categories.',
    fieldLabel: 'Job Title or Industry',
    placeholder: 'Type here...',
    ctaLabel: 'Review Privacy',
    icon: Briefcase
  }
];

const toOptionalText = (value: string | null | undefined): string | null => {
  const trimmedValue = (value ?? '').trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

const openLegalDocument = (slug: 'privacy' | 'terms' | 'cookies' | 'open-banking') => {
  window.open(`/legal/${slug}`, '_blank', 'noopener,noreferrer');
};

const formatConsentTimestamp = (value: string | null | undefined): string => {
  if (!value) {
    return 'Not recorded';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

type TaxSetupOption = {
  value: string;
  label: string;
  description: string;
  meta?: string;
};

const TAX_REGIME_OPTIONS: TaxSetupOption[] = [
  {
    value: 'Forfettario',
    label: 'Forfettario',
    description: 'Flat 5% or 15% tax rate'
  },
  {
    value: 'Ordinario',
    label: 'Ordinario',
    description: 'Standard IRPEF brackets'
  }
];

const TAX_ACTIVITY_OPTIONS: TaxSetupOption[] = [
  {
    value: 'Professional / Consultant',
    label: 'Professional / Consultant',
    description: 'Freelancers, digital services',
    meta: '78%'
  },
  {
    value: 'Retail & E-commerce',
    label: 'Retail & E-commerce',
    description: 'Online shops, reselling',
    meta: '40%'
  },
  {
    value: 'Food & Hospitality',
    label: 'Food & Hospitality',
    description: 'Restaurants, bars',
    meta: '40%'
  },
  {
    value: 'Construction & Real Estate',
    label: 'Construction & Real Estate',
    description: 'Renovation, property',
    meta: '86%'
  },
  {
    value: 'Other Activities',
    label: 'Other Activities',
    description: 'Other or unsure',
    meta: '67%'
  }
];

const TAX_RESIDENCE_OPTIONS: TaxSetupOption[] = [
  {
    value: 'Italy (IT)',
    label: 'IT',
    description: 'Italy'
  },
  {
    value: 'Netherlands (NL)',
    label: 'NL',
    description: 'Netherlands'
  },
  {
    value: 'Belgium (BE)',
    label: 'BE',
    description: 'Belgium'
  },
  {
    value: 'Germany (DE)',
    label: 'DE',
    description: 'Germany'
  },
  {
    value: 'Other',
    label: 'Other',
    description: 'Other country'
  }
];

const hasTaxProfileConfigured = (profile: UserProfile): boolean =>
  [
    profile.fiscalResidence,
    profile.taxRegime,
    profile.activityType
  ].every((value) => (value ?? '').trim().length > 0);

const getInitialFiscalResidence = (profile: UserProfile): string => {
  const fiscalResidence = (profile.fiscalResidence ?? '').trim();
  if (fiscalResidence.length > 0) {
    return fiscalResidence;
  }

  const residence = (profile.residence ?? '').trim();
  const matchedResidence = TAX_RESIDENCE_OPTIONS.find((option) => option.value === residence);
  return matchedResidence?.value ?? '';
};

const ACCOUNT_CATEGORY_OPTIONS = ['Personal', 'Business', 'Savings'] as const;
type AccountCategory = (typeof ACCOUNT_CATEGORY_OPTIONS)[number];

const toAccountCategory = (nature?: string | null): AccountCategory => {
  const normalized = (nature ?? '').trim().toLowerCase();
  if (normalized === 'business') {
    return 'Business';
  }
  if (normalized === 'savings') {
    return 'Savings';
  }
  return 'Personal';
};

const ACCOUNT_CATEGORY_TO_NATURE: Record<AccountCategory, string> = {
  Personal: 'personal',
  Business: 'business',
  Savings: 'savings'
};

const resolveConnectionAccountName = (
  account: Pick<BankAccountRecord, 'id' | 'institutionName'> | null | undefined,
  providerName?: string
): string => {
  return (account?.institutionName ?? '').trim() || (providerName ?? '').trim();

};

const resolveConnectionRecordId = (account: BankAccountRecord | null | undefined): string => {
  if (!account) {
    return '';
  }

  const accountId = (account.accountId ?? '').trim();
  if (accountId.length > 0) {
    return accountId;
  }

  const saltedgeAccountId = (account.saltedgeAccountId ?? '').trim();
  if (saltedgeAccountId.length > 0) {
    return saltedgeAccountId;
  }

  const saltedgeAccountIdSnake = (account.saltedge_account_id ?? '').trim();
  if (saltedgeAccountIdSnake.length > 0) {
    return saltedgeAccountIdSnake;
  }

  return (account.id ?? '').trim();
};

const ConnectionAccountCard = ({
  account,
  providerName,
  onClick,
  isSelected = false,
  index = 0,
  accountCount = 1,
  totalBalance,
  connectionStatus = null,
  canManageConnection = false,
  isRemoving = false,
  onRemove
}: {
  account: BankAccountRecord;
  providerName: string;
  onClick: () => void;
  isSelected?: boolean;
  index?: number;
  accountCount?: number;
  totalBalance: number;
  connectionStatus?: string | null;
  canManageConnection?: boolean;
  isRemoving?: boolean;
  onRemove?: () => void;
}) => {
  const connectionRecordId = resolveConnectionRecordId(account) || `${index}`;
  const accountSubtitle = (account.institutionName ?? '').trim() || 'Unknown Institution';
  const accountIcon = accountSubtitle.slice(0, 2).toUpperCase();
  const normalizedStatus = (connectionStatus ?? '').trim();
  const statusLabel = normalizedStatus.length > 0
    ? normalizedStatus.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
    : null;
  const resolvedTotalBalance = Number.isFinite(totalBalance) ? totalBalance : Number(account.balance ?? 0);

  return (
    <div
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      className={`text-left p-6 rounded-[2rem] border transition-all ${
        isSelected
          ? 'bg-white border-opex-teal/40 shadow-lg shadow-teal-900/10'
          : 'bg-gray-50 border-gray-100 hover:border-gray-200'
      } cursor-pointer`}
      data-connection-record-id={connectionRecordId}
    >
      <div className={`w-14 h-14 rounded-2xl ${isSelected ? 'bg-opex-dark' : 'bg-opex-dark/90'} text-white flex items-center justify-center font-black text-xl shadow-md`}>
        {accountIcon}
      </div>
      <p className="mt-5 text-base font-black text-gray-900 leading-tight">
        {resolveConnectionAccountName(account, providerName)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {accountCount > 1 ? `${accountCount} Accounts` : toAccountCategory(account.nature)} | {account.isSaltedge ? 'Open Banking' : 'Local'}
        </p>
        {statusLabel && (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
            {statusLabel}
          </span>
        )}
        {account.isForTax && (
          <span className="inline-flex items-center rounded-full bg-opex-teal/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-opex-teal">
            Tax Buffer
          </span>
        )}
      </div>
      <p className="mt-4 text-lg font-black text-gray-900">
        {new Intl.NumberFormat('it-IT', {
          style: 'currency',
          currency: account.currency || 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }).format(resolvedTotalBalance)}
      </p>
      {canManageConnection && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove?.();
            }}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-[1rem] border border-red-100 bg-red-50 px-3 text-xs font-black text-red-600 transition-colors hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isRemoving}
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </button>
        </div>
      )}
      {false && (<p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {toAccountCategory(account.nature)} • {account.isSaltedge ? 'Open Banking' : 'Local'}
      </p>)}
    </div>
  );
};

const TaxProfileSetupDialog = ({
  isOpen,
  isRequired,
  userProfile,
  onClose,
  onSave
}: {
  isOpen: boolean;
  isRequired: boolean;
  userProfile: UserProfile;
  onClose: () => void;
  onSave: (profile: UserProfile) => Promise<void>;
}) => {
  const [selectedRegime, setSelectedRegime] = useState<string>((userProfile.taxRegime ?? '').trim());
  const [selectedActivity, setSelectedActivity] = useState<string>((userProfile.activityType ?? '').trim());
  const [selectedFiscalResidence, setSelectedFiscalResidence] = useState<string>(getInitialFiscalResidence(userProfile));
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedRegime((userProfile.taxRegime ?? '').trim());
    setSelectedActivity((userProfile.activityType ?? '').trim());
    setSelectedFiscalResidence(getInitialFiscalResidence(userProfile));
    setFormError(null);
  }, [isOpen, userProfile]);

  if (!isOpen) {
    return null;
  }

  const isComplete = selectedRegime.length > 0 && selectedActivity.length > 0 && selectedFiscalResidence.length > 0;

  const handleSave = async () => {
    if (!isComplete) {
      setFormError('Select tax regime, activity type, and fiscal residence to continue.');
      return;
    }

    const nextProfile: UserProfile = {
      ...userProfile,
      fiscalResidence: selectedFiscalResidence,
      taxRegime: selectedRegime,
      activityType: selectedActivity
    };

    setIsSaving(true);
    setFormError(null);

    try {
      await onSave(nextProfile);
      onClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unexpected error while saving tax setup.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/15 px-4 py-8 backdrop-blur-[6px]">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/95 p-6 shadow-[0_32px_80px_-32px_rgba(15,23,42,0.45)] md:p-8">
        {!isRequired && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-opex-dark"
            disabled={isSaving}
          >
            <X size={18} />
          </button>
        )}

        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] bg-opex-dark text-white shadow-lg shadow-slate-900/15">
            <Calculator size={26} />
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-gray-900">Set up your tax profile</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              We need a few details to estimate taxes correctly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.45fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Tax Regime</p>
              </div>
              <div className="space-y-3">
                {TAX_REGIME_OPTIONS.map((option) => {
                  const isSelected = selectedRegime === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSelectedRegime(option.value);
                        if (formError) {
                          setFormError(null);
                        }
                      }}
                      className={`w-full rounded-[1.5rem] border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-opex-dark bg-slate-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-slate-300'
                      }`}
                      disabled={isSaving}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-black text-gray-900">{option.label}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">{option.description}</p>
                        </div>
                        <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${isSelected ? 'border-opex-dark bg-opex-dark text-white' : 'border-slate-200 text-transparent'}`}>
                          <Check size={14} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Fiscal Residence</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {TAX_RESIDENCE_OPTIONS.map((option) => {
                  const isSelected = selectedFiscalResidence === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSelectedFiscalResidence(option.value);
                        if (formError) {
                          setFormError(null);
                        }
                      }}
                      className={`rounded-[1.2rem] border px-4 py-3 text-left transition-all ${
                        isSelected
                          ? 'border-opex-dark bg-slate-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-slate-300'
                      }`}
                      disabled={isSaving}
                    >
                      <p className="text-sm font-black text-gray-900">{option.label}</p>
                      <p className="mt-1 text-[11px] font-medium text-slate-500">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Activity Type</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
                {selectedRegime ? 'Select your business area' : 'Select a tax regime first.'}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TAX_ACTIVITY_OPTIONS.map((option) => {
                const isSelected = selectedActivity === option.value;
                const isDisabled = selectedRegime.length === 0;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (isDisabled) {
                        return;
                      }
                      setSelectedActivity(option.value);
                      if (formError) {
                        setFormError(null);
                      }
                    }}
                    className={`rounded-[1.5rem] border p-4 text-left transition-all ${
                      isDisabled
                        ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-slate-300'
                        : isSelected
                          ? 'border-opex-dark bg-slate-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-slate-300'
                    }`}
                    disabled={isSaving || isDisabled}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-base font-black ${isDisabled ? 'text-slate-300' : 'text-gray-900'}`}>{option.label}</p>
                        <p className={`mt-1 text-xs font-medium ${isDisabled ? 'text-slate-300' : 'text-slate-500'}`}>{option.description}</p>
                        {option.meta && (
                          <p className={`mt-2 text-[11px] font-black uppercase tracking-widest ${isDisabled ? 'text-slate-300' : 'text-slate-400'}`}>
                            {option.meta}
                          </p>
                        )}
                      </div>
                      <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${isSelected ? 'border-opex-dark bg-opex-dark text-white' : 'border-slate-200 text-transparent'}`}>
                        <Check size={14} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {formError && (
          <p className="mt-6 text-sm font-bold text-red-600">{formError}</p>
        )}

        <div className="mt-8">
          <button
            type="button"
            onClick={() => void handleSave()}
            className="flex h-14 w-full items-center justify-center rounded-[1.2rem] bg-opex-dark text-base font-black text-white shadow-[0_20px_40px_-20px_rgba(12,33,49,0.55)] transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!isComplete || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save and continue'}
          </button>
          <p className="mt-4 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            You can update this later in tax settings.
          </p>
        </div>
      </div>
    </div>
  );
};

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
    <div className="space-y-8">
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
                const badgeVariant = isOverdue ? 'danger' : isDone ? 'success' : 'info';

                return (
                  <div
                    key={`calendar-${item.id || `${item.title}-${item.dueDate}`}`}
                    className={`rounded-[1.75rem] border p-5 transition-all ${
                      isOverdue ? 'border-red-100 bg-red-50/70' : 'border-gray-100 bg-white'
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
                      <Badge variant={badgeVariant as any}>{item.status}</Badge>
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
                const badgeVariant = status.includes('overdue')
                  ? 'danger'
                  : status.includes('paid') || status.includes('completed')
                    ? 'success'
                    : 'info';

                return (
                  <div key={item.id || `${item.title}-${item.dueDate}`} className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      status.includes('overdue') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
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
                  <Badge variant={badgeVariant as any}>{item.status}</Badge>
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

export const InsightsDetail = ({ onBack }: { onBack: () => void }) => {
  const insights = [
    { 
      title: 'Concentration Alert', 
      desc: 'Your revenue is highly dependent on Nebula Corp (45% of total). We recommend diversifying your client base to mitigate risk and reduce single-source reliance.', 
      icon: AlertTriangle, 
      color: 'bg-red-500', 
      cta: 'Analyze Client Mix',
      tag: 'Risk'
    },
    { 
      title: 'Trend Signal', 
      desc: 'Identified a consistent 12% monthly growth in Subscription revenue. Projecting an additional €5,400 by end of Q4 if the current trajectory remains stable.', 
      icon: TrendingUp, 
      color: 'bg-opex-teal', 
      cta: 'View Projections',
      tag: 'Growth'
    }
  ];

  return (
    <SubpageShell onBack={onBack} title="Financial Insights">
       <div className="flex flex-col lg:flex-row gap-8 items-start">
         <div className="flex-1 w-full space-y-8">
            <div className="space-y-1">
               <h2 className="text-3xl font-bold text-gray-900">Intelligence Hub</h2>
               <p className="text-sm font-medium text-gray-400">Deep analysis of your current financial ecosystem</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
               {insights.map((item, i) => (
                 <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 group hover:border-opex-teal/20 transition-all">
                    <div className={`w-16 h-16 rounded-2xl ${item.color} text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform`}>
                       <item.icon size={32} />
                    </div>
                    <div className="flex-1 space-y-4">
                       <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                          <Badge variant={item.tag === 'Growth' ? 'success' : 'danger'}>{item.tag}</Badge>
                       </div>
                       <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                       <div className="pt-2">
                          <Button variant="outline" size="sm" icon={ExternalLink}>{item.cta}</Button>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="w-full lg:w-[380px] space-y-6">
            <Card title="Overall Score" action={<Activity size={18} className="text-opex-teal" />}>
               <div className="space-y-8 py-4">
                  <div className="flex flex-col items-center justify-center relative">
                     {/* Enhanced UI/UX Score Gauge - Normalizing radius and viewBox to fix clipping issues */}
                     <svg className="w-48 h-48 transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
                        {/* Background Track */}
                        <circle 
                           cx="50" cy="50" r="42" 
                           stroke="#F3F4F6" strokeWidth="8" 
                           fill="transparent" 
                        />
                        {/* Gradient Definition */}
                        <defs>
                           <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#1F4650" />
                              <stop offset="100%" stopColor="#22C55E" />
                           </linearGradient>
                        </defs>
                        {/* Progress Bar */}
                        <circle 
                           cx="50" cy="50" r="42" 
                           stroke="url(#scoreGradient)" strokeWidth="8" 
                           fill="transparent" 
                           strokeDasharray="263.89" 
                           strokeDashoffset={263.89 * (1 - 92 / 100)} 
                           strokeLinecap="round"
                           className="transition-all duration-1000 ease-out drop-shadow-sm"
                        />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <div className="flex items-baseline gap-1">
                           <span className="text-5xl font-black text-gray-900 tracking-tighter">92</span>
                           <span className="text-xl font-bold text-gray-400">/100</span>
                        </div>
                        <p className="text-[10px] font-black text-opex-teal uppercase tracking-[0.2em] mt-1">Excellent</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-6">
                     <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Previous</p>
                        <div className="flex items-center justify-center gap-1">
                           <span className="font-black text-gray-700">89</span>
                           <TrendingUp size={12} className="text-green-500" />
                        </div>
                     </div>
                     <div className="text-center border-l border-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Peer Avg.</p>
                        <span className="font-black text-gray-700">74</span>
                     </div>
                  </div>
               </div>
            </Card>

            <div className="bg-opex-dark rounded-[2.5rem] p-8 text-white text-center space-y-5 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform"></div>
               
               <div className="relative">
                  <Badge variant="warning" className="bg-yellow-400 text-opex-dark mb-4">Coming Soon</Badge>
                  <Zap size={48} className="mx-auto text-yellow-400 mb-2" fill="currentColor" />
                  <h4 className="text-xl font-black tracking-tight">Smart Alerts</h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-medium mt-2">
                     Our AI is learning your patterns. Real-time push notifications for spending anomalies and cashflow peaks are in development.
                  </p>
                  <div className="pt-4 opacity-50 cursor-not-allowed">
                     <Button variant="primary" fullWidth className="bg-white/10 border-white/10 text-white cursor-not-allowed pointer-events-none">
                        Join Waitlist
                     </Button>
                  </div>
               </div>
            </div>
         </div>
       </div>
    </SubpageShell>
  );
};

export const BreakdownLayout = ({ type, onBack }: { type: 'INCOME' | 'EXPENSES', onBack: () => void }) => {
  const [filter, setFilter] = useState('Week');
  const isIncome = type === 'INCOME';

  const getSubtitle = (f: string) => {
    switch(f) {
      case 'Week': return "Current week activity recap";
      case 'Month': return "Last 30 days financial analysis";
      case 'Year': return "Full year revenue breakdown";
      default: return "Analysis";
    }
  };
  
  const sources = isIncome 
    ? [
        { name: 'Freelance', tag: 'Direct', amount: '€2,400', color: 'bg-green-500', icon: 'F' },
        { name: 'Dividends', tag: 'Invest', amount: '€1,200', color: 'bg-blue-500', icon: 'D' },
        { name: 'Consulting', tag: 'Project', amount: '€650', color: 'bg-purple-500', icon: 'C' }
      ]
    : [
        { name: 'Software', tag: 'SaaS', amount: '€1,200', color: 'bg-blue-500', icon: 'S' },
        { name: 'Groceries', tag: 'Essential', amount: '€450', color: 'bg-yellow-500', icon: 'G' },
        { name: 'Rent', tag: 'Monthly', amount: '€1,200', color: 'bg-red-400', icon: 'R' }
      ];

  const groupedTransactions = [
    { 
      date: '9 July', 
      total: isIncome ? '+$1,400' : '-$250',
      items: isIncome 
        ? [{ name: 'Client X', tag: 'Payment', amount: 1400, icon: 'CX', color: 'bg-green-500' }]
        : [{ name: 'Adobe CC', stroke: 'Software', amount: -52.99, icon: 'A', color: 'bg-red-500' }]
    },
    { 
      date: '8 July', 
      total: isIncome ? '+$850' : '-$124',
      items: isIncome 
        ? [{ name: 'Upwork', tag: 'Withdrawal', amount: 850, icon: 'U', color: 'bg-emerald-500' }]
        : [{ name: 'Webflow', tag: 'Hosting', amount: -124, icon: 'W', color: 'bg-blue-600' }]
    },
    { 
      date: '7 July', 
      total: isIncome ? '+$320' : '-$45',
      items: isIncome 
        ? [{ name: 'Shutterstock', tag: 'Royalty', amount: 320, icon: 'S', color: 'bg-orange-500' }]
        : [{ name: 'Grab', tag: 'Transport', amount: -45.00, icon: 'G', color: 'bg-green-600' }]
    }
  ];

  return (
    <SubpageShell onBack={onBack} title={isIncome ? "Income" : "Expenses"}>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main Content Pane (Chart & Analysis) */}
        <div className="flex-1 w-full space-y-8">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-gray-900">{isIncome ? 'Income Breakdown' : 'Expense Breakdown'}</h2>
                <p className="text-sm font-medium text-gray-400 transition-all duration-300">{getSubtitle(filter)}</p>
              </div>
              <ToggleFilter options={['Week', 'Month', 'Year']} active={filter} onChange={setFilter} />
            </div>

            <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col justify-center">
               <EnhancedLineChart color={isIncome ? "#22C55E" : "#3B82F6"} period={filter} heightPixels={300} />
            </div>
          </div>

          <Card title={isIncome ? 'Income Sources' : 'Expense Categories'} action={<button className="text-opex-teal text-xs font-bold hover:underline">Full Analytics</button>}>
            <div className="flex flex-col md:flex-row items-center gap-10">
               <div className="flex flex-col items-center gap-4">
                  <MiniPieChart type={isIncome ? 'income' : 'expense'} />
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Rate</p>
                    <p className="text-xl font-black text-gray-900">82.4%</p>
                  </div>
               </div>
               <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                  {sources.map((src, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50/50 p-2 -m-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${src.color} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>{src.icon}</div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-tight">{src.name}</p>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{src.tag}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{src.amount}</span>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-900 transition-colors" />
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Pane (Recent Transactions) */}
        <div className="w-full lg:w-[380px] space-y-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-gray-900">Activity History</h3>
            <button className="text-[10px] font-black text-opex-teal uppercase tracking-widest hover:underline">Download CSV</button>
          </div>
          
          <div className="space-y-8">
            {groupedTransactions.map((group, idx) => (
              <div key={idx} className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{group.date}</span>
                  <span className={`text-[10px] font-black ${isIncome ? 'text-green-500' : 'text-gray-900'}`}>{group.total}</span>
                </div>
                <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {group.items.map((item, i) => (
                    <div key={i} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-white text-xs font-bold transition-transform group-hover:scale-105 shadow-sm`}>
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{item.name}</p>
                          <Badge>{item.tag || (item as any).stroke}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${item.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          {item.amount > 0 ? '+' : ''}€{Math.abs(item.amount)}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold">14:24</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" fullWidth className="py-4 border-dashed border-2 hover:border-opex-teal hover:text-opex-teal">
            Load More Transactions
          </Button>
        </div>
      </div>
    </SubpageShell>
  );
};


export const TransactionsPage = ({
  onBack,
  transactions
}: {
  onBack: () => void;
  transactions: TransactionRecord[];
}) => {
  const [filter, setFilter] = useState('All');
  
  const filteredTransactions = useMemo(() => {
    const normalized = transactions
      .map((transaction) => {
        const amount = Number(transaction.amount ?? 0);
        const isIncome = amount >= 0;
        return {
          id: transaction.id,
          date: transaction.bookingDate || new Date().toISOString().slice(0, 10),
          name: transaction.merchantName || transaction.description || transaction.category || 'Transaction',
          category: transaction.category || (isIncome ? 'Income' : 'Expense'),
          amount,
          status: transaction.status || 'COMPLETED',
          icon: isIncome ? 'IN' : 'OUT',
          color: isIncome ? 'bg-emerald-500' : 'bg-opex-dark'
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    if (filter === 'In') {
      return normalized.filter((item) => item.amount >= 0);
    }
    if (filter === 'Out') {
      return normalized.filter((item) => item.amount < 0);
    }
    return normalized;
  }, [filter, transactions]);

  // Simple grouping by date
  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredTransactions.forEach((transaction) => {
      if (!groups[transaction.date]) {
        groups[transaction.date] = [];
      }
      groups[transaction.date].push(transaction);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  return (
    <SubpageShell 
      onBack={onBack} 
      title="All Activity"
      actions={
        <div className="flex gap-2">
          <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl">
            <Download size={20} />
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-gray-900">Transaction History</h2>
            <p className="text-sm font-medium text-gray-500">Comprehensive list of all your fiscal movements.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
             <ToggleFilter options={['All', 'In', 'Out']} active={filter} onChange={setFilter} />
             <Button variant="outline" size="sm" icon={Filter} className="shrink-0">Filters</Button>
          </div>
        </div>

        <div className="space-y-10">
          {grouped.length === 0 && (
            <Card>
              <div className="py-14 text-center">
                <p className="text-sm font-bold text-gray-500">No transactions found for this filter.</p>
              </div>
            </Card>
          )}
          {grouped.map(([date, items]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-4 px-2">
                 <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{date}</span>
                 <div className="flex-1 h-px bg-gray-100"></div>
              </div>
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {items.map((t) => (
                  <div key={t.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${t.color} flex items-center justify-center text-white text-xs font-bold shadow-sm transition-transform group-hover:scale-110`}>
                        {t.icon}
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-gray-900">{t.name}</p>
                        <div className="flex items-center gap-2">
                           <Badge>{t.category}</Badge>
                           <span className="text-[10px] text-gray-400 font-bold">• 14:32</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-8">
                       <div className="text-right">
                          <p className={`text-lg font-black ${t.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                             {t.amount > 0 ? '+' : ''}€{Math.abs(t.amount).toLocaleString()}
                          </p>
                          <p className={`text-[10px] font-bold uppercase tracking-tighter ${String(t.status).toUpperCase() === 'COMPLETED' ? 'text-gray-400' : 'text-orange-500'}`}>{t.status}</p>
                       </div>
                       <ChevronRight size={18} className="text-gray-200 group-hover:text-opex-teal transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SubpageShell>
  );
};

export const AddTransactionPage = ({
  type,
  onBack,
  bankAccounts,
  onSubmit,
  isSaving
}: {
  type: 'INCOME' | 'EXPENSE';
  onBack: () => void;
  bankAccounts: BankAccountRecord[];
  onSubmit: (input: CreateLocalTransactionInput) => Promise<void>;
  isSaving: boolean;
}) => {
  const isIncome = type === 'INCOME';
  const localAccounts = useMemo(
    () => bankAccounts.filter((account) => !account.isSaltedge),
    [bankAccounts]
  );
  const resolveSelectableAccountId = (account: BankAccountRecord): string =>
    account.accountId ?? account.saltedgeAccountId ?? account.saltedge_account_id ?? account.id;
  const [amount, setAmount] = useState('0.00');
  const [selectedCat, setSelectedCat] = useState('General');
  const [note, setNote] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(localAccounts[0] ? resolveSelectableAccountId(localAccounts[0]) : '');
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (localAccounts.length === 0) {
      if (selectedAccountId) {
        setSelectedAccountId('');
      }
      return;
    }

    const hasSelectedAccount = localAccounts.some((account) => resolveSelectableAccountId(account) === selectedAccountId);
    if (!hasSelectedAccount) {
      setSelectedAccountId(resolveSelectableAccountId(localAccounts[0]));
    }
  }, [localAccounts, selectedAccountId]);

  const categories = isIncome 
    ? [
      { name: 'Salary', icon: Briefcase, color: 'bg-green-100 text-green-600' },
      { name: 'Freelance', icon: Coins, color: 'bg-blue-100 text-blue-600' },
      { name: 'Gift', icon: Gift, color: 'bg-pink-100 text-pink-600' },
      { name: 'Investment', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
      { name: 'Other', icon: Layers, color: 'bg-gray-100 text-gray-600' }
    ]
    : [
      { name: 'Groceries', icon: ShoppingBag, color: 'bg-yellow-100 text-yellow-600' },
      { name: 'Food', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
      { name: 'Transport', icon: Car, color: 'bg-blue-100 text-blue-600' },
      { name: 'Home', icon: Home, color: 'bg-emerald-100 text-emerald-600' },
      { name: 'Shopping', icon: ShoppingBag, color: 'bg-purple-100 text-purple-600' },
      { name: 'Software', icon: Layers, color: 'bg-indigo-100 text-indigo-600' },
      { name: 'Taxes', icon: Calculator, color: 'bg-red-100 text-red-600' }
    ];

  const handleConfirm = async () => {
    const parsedAmount = Number.parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setSubmitError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!selectedAccountId) {
      setSubmitError('Please select a bank account before saving.');
      return;
    }

    setSubmitError(null);
    try {
      await onSubmit({
        bankAccountId: selectedAccountId,
        amount: parsedAmount,
        category: selectedCat,
        description: note,
        type
      });
      onBack();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to create transaction.');
    }
  };

  return (
    <SubpageShell onBack={onBack} title={isIncome ? 'Add Income' : 'Add Expense'}>
       <div className="max-w-2xl mx-auto space-y-8 pb-20">
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 text-center space-y-8">
             <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction Amount</p>
                <div className="flex items-center justify-center gap-2 group">
                   <span className="text-4xl font-black text-gray-300">€</span>
                   <input 
                    type="number" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)}
                    className={`text-6xl font-black w-full max-w-[280px] bg-transparent border-none focus:ring-0 text-center outline-none ${isIncome ? 'text-green-500' : 'text-opex-dark'}`}
                    placeholder="0.00"
                   />
                </div>
             </div>
             <div className="flex justify-center">
                 <div className="w-full max-w-2xl space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Local Account</p>
                    {localAccounts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {localAccounts.map((account) => {
                          const accountId = resolveSelectableAccountId(account);
                          const isSelected = selectedAccountId === accountId;

                          return (
                            <button
                              key={accountId}
                              onClick={() => setSelectedAccountId(accountId)}
                              className={`text-left rounded-[1.75rem] border p-4 transition-all ${
                                isSelected
                                  ? 'bg-white border-opex-teal/40 shadow-lg shadow-teal-900/10'
                                  : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-black text-gray-900">{account.institutionName}</p>
                                  <p className="mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Local Account</p>
                                </div>
                                <p className="text-sm font-bold text-gray-700">
                                  {new Intl.NumberFormat('it-IT', {
                                    style: 'currency',
                                    currency: account.currency || 'EUR',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2
                                  }).format(account.balance ?? 0)}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-[1.75rem] border border-gray-100 bg-gray-50 px-5 py-4 text-center">
                        <p className="text-sm font-bold text-gray-500">No local account available.</p>
                        <p className="mt-1 text-xs text-gray-400">Create a manual account before adding income or expenses.</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>

          <div className="space-y-4">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Select Category</h3>
             <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {categories.map(cat => (
                  <button 
                    key={cat.name}
                    onClick={() => setSelectedCat(cat.name)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-[1.5rem] border-2 transition-all ${selectedCat === cat.name ? 'bg-white border-opex-teal shadow-lg scale-105' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl ${cat.color} flex items-center justify-center`}>
                       <cat.icon size={24} />
                    </div>
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-tighter">{cat.name}</span>
                  </button>
                ))}
             </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Transaction Details</h3>
             <Card>
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-gray-400">
                         <Calendar size={20} />
                         <span className="text-sm font-bold">Today, 9 July 2023</span>
                      </div>
                      <button className="text-[10px] font-black text-opex-teal uppercase tracking-widest">Change</button>
                   </div>
                   <div className="h-px bg-gray-50 w-full"></div>
                   <div className="flex items-center gap-3">
                      <Edit2 size={20} className="text-gray-400" />
                      <input 
                        placeholder="Add a note or description..." 
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-900 outline-none"
                      />
                   </div>
                </div>
             </Card>
          </div>

          <div className="pt-6">
             <Button fullWidth size="lg" icon={Check} onClick={() => void handleConfirm()} disabled={isSaving || localAccounts.length === 0}>
                {isSaving ? 'Saving...' : 'Confirm Transaction'}
              </Button>
             {submitError && <p className="text-sm text-red-600 font-medium mt-3">{submitError}</p>}
          </div>
       </div>
    </SubpageShell>
  );
};

export const AddInvoicePage = ({
  onBack,
  userProfile,
  bankAccounts
}: {
  onBack: () => void,
  userProfile: any,
  bankAccounts: BankAccountRecord[]
}) => {
  const [client, setClient] = useState('');
  const [amount, setAmount] = useState('');
  const localAccounts = useMemo(
    () => bankAccounts.filter((account) => !account.isSaltedge),
    [bankAccounts]
  );
  const resolveSelectableAccountId = (account: BankAccountRecord): string =>
    account.accountId ?? account.saltedgeAccountId ?? account.saltedge_account_id ?? account.id;
  const [selectedAccountId, setSelectedAccountId] = useState(localAccounts[0] ? resolveSelectableAccountId(localAccounts[0]) : '');

  useEffect(() => {
    if (localAccounts.length === 0) {
      if (selectedAccountId) {
        setSelectedAccountId('');
      }
      return;
    }

    const hasSelectedAccount = localAccounts.some((account) => resolveSelectableAccountId(account) === selectedAccountId);
    if (!hasSelectedAccount) {
      setSelectedAccountId(resolveSelectableAccountId(localAccounts[0]));
    }
  }, [localAccounts, selectedAccountId]);

  return (
    <SubpageShell onBack={onBack} title="New Invoice">
       <div className="max-w-3xl mx-auto space-y-8 pb-20">
          {/* Branding Preview */}
          <div className="flex items-center justify-between p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Your Branding</p>
              {userProfile.logo ? (
                <img src={userProfile.logo} alt="Logo" className="max-h-12 object-contain" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-opex-teal text-white flex items-center justify-center font-black text-lg">
                    {userProfile.name.charAt(0)}
                  </div>
                  <span className="text-sm font-black text-gray-900 tracking-tight">{userProfile.name}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Invoice Date</p>
              <p className="text-sm font-bold text-gray-900">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <Card title="Invoice Header">
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Name</label>
                      <div className="relative">
                         <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                         <input 
                          placeholder="Search or add client..." 
                          value={client}
                          onChange={e => setClient(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none"
                         />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Date</label>
                      <div className="relative">
                         <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                         <input 
                          type="date"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none"
                         />
                      </div>
                   </div>
                </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount (excl. VAT)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                      <input 
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full pl-10 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-xl font-black text-opex-dark focus:ring-2 focus:ring-opex-teal/10 outline-none"
                       />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Local Account</label>
                    {localAccounts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {localAccounts.map((account) => {
                          const accountId = resolveSelectableAccountId(account);
                          const isSelected = selectedAccountId === accountId;

                          return (
                            <button
                              key={accountId}
                              type="button"
                              onClick={() => setSelectedAccountId(accountId)}
                              className={`text-left rounded-[1.75rem] border p-4 transition-all ${
                                isSelected
                                  ? 'bg-white border-opex-teal/40 shadow-lg shadow-teal-900/10'
                                  : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-black text-gray-900">{account.institutionName}</p>
                                  <p className="mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Local Account</p>
                                </div>
                                <p className="text-sm font-bold text-gray-700">
                                  {new Intl.NumberFormat('it-IT', {
                                    style: 'currency',
                                    currency: account.currency || 'EUR',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2
                                  }).format(account.balance ?? 0)}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-[1.75rem] border border-gray-100 bg-gray-50 px-5 py-4 text-center">
                        <p className="text-sm font-bold text-gray-500">No local account available.</p>
                        <p className="mt-1 text-xs text-gray-400">Create a manual account before assigning invoice proceeds.</p>
                      </div>
                    )}
                 </div>
              </div>
           </Card>

          <Card title="Attachment (Optional)">
             <div className="border-2 border-dashed border-gray-100 rounded-[2rem] p-10 text-center space-y-4 hover:border-opex-teal transition-all cursor-pointer bg-gray-50/30 group">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                   <Upload size={32} className="text-gray-300 group-hover:text-opex-teal transition-colors" />
                </div>
                <div>
                   <p className="text-sm font-bold text-gray-900">Drag & Drop Invoice PDF</p>
                   <p className="text-xs text-gray-400">or click to browse from files</p>
                </div>
             </div>
          </Card>

           <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button variant="outline" className="flex-1 py-5 rounded-[2rem]" icon={Eye}>Preview</Button>
              <Button variant="primary" className="flex-1 py-5 rounded-[2rem]" icon={FilePlus} onClick={onBack} disabled={localAccounts.length === 0}>Create Invoice</Button>
           </div>
       </div>
    </SubpageShell>
  );
};

export const BankRedirectionPage = ({
  bank,
  onComplete,
  onBack,
  isSyncing,
  syncStage,
  errorMessage
}: {
  bank: BankOption;
  onComplete: () => Promise<void>;
  onBack: () => void;
  isSyncing: boolean;
  syncStage: 'idle' | 'opening_widget' | 'waiting_success_redirect' | 'syncing_success';
  errorMessage: string | null;
}) => {
  const hasAutoStartedRef = useRef(false);

  useEffect(() => {
    if (hasAutoStartedRef.current) {
      return;
    }

    hasAutoStartedRef.current = true;
    void onComplete().catch(() => undefined);
  }, [onComplete]);

  const loadingDescription =
    syncStage === 'opening_widget'
      ? 'Generating Salt Edge connection URL...'
      : syncStage === 'waiting_success_redirect'
        ? 'A new browser tab has been opened. Complete the flow there and you will be redirected to /success.'
        : syncStage === 'syncing_success'
          ? 'Synchronization in progress.'
          : isSyncing
            ? 'Please wait...'
            : 'Waiting for next step...';

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-4 md:p-8 text-center space-y-6 md:space-y-8 animate-in fade-in duration-500">
       <div className="relative">
          <div className={`w-24 h-24 rounded-[2rem] ${bank.color} text-white flex items-center justify-center text-4xl font-black shadow-2xl ${isSyncing ? 'animate-bounce' : ''}`}>
             {typeof bank.icon === 'string' ? bank.icon : React.isValidElement(bank.icon) ? React.cloneElement(bank.icon as React.ReactElement<any>, { size: 48 }) : bank.icon}
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
             <Loader2 className="animate-spin text-opex-teal" size={24} />
          </div>
       </div>
       <div className="space-y-3">
          <h2 className="text-2xl font-black text-gray-900">Connecting to {bank.name}</h2>
          <p className="text-gray-500 max-w-xs mx-auto font-medium">{loadingDescription}</p>
       </div>
       <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
         <div className="h-full bg-opex-teal animate-progress-fast"></div>
       </div>
       <Button size="sm" variant="outline" onClick={onBack} icon={X} disabled={isSyncing || syncStage === 'syncing_success'}>
         Back
       </Button>
       {errorMessage && (
         <div className="max-w-md space-y-4">
           <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
           <Button size="sm" variant="outline" onClick={() => void onComplete().catch(() => undefined)} icon={RefreshCw}>
             Retry
           </Button>
         </div>
       )}
    </div>
  );
};

export const AccountSetupPage = ({
  bank,
  onBack,
  onComplete,
  isSaving = false,
  isManual = false,
  presetAccount = null
}: {
  bank: BankOption;
  onBack: () => void;
  onComplete: (payload: ManualBankSetupInput) => Promise<void>;
  isSaving?: boolean;
  isManual?: boolean;
  presetAccount?: BankAccountRecord | null;
}) => {
  const isConnectionEdit = !isManual && Boolean(presetAccount);
  const [accountType, setAccountType] = useState<AccountCategory>(toAccountCategory(presetAccount?.nature));
  const [isTaxBuffer, setIsTaxBuffer] = useState(Boolean(presetAccount?.isForTax));
  const [institutionName, setInstitutionName] = useState(
    isConnectionEdit ? ((presetAccount?.institutionName ?? '').trim() || bank.name) : bank.name
  );
  const [balance, setBalance] = useState(String(presetAccount?.balance ?? 0));
  const [currency, setCurrency] = useState((presetAccount?.currency ?? 'EUR').trim().toUpperCase() || 'EUR');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setAccountType(toAccountCategory(presetAccount?.nature));
    setIsTaxBuffer(Boolean(presetAccount?.isForTax));
    setInstitutionName(isConnectionEdit ? ((presetAccount?.institutionName ?? '').trim() || bank.name) : bank.name);
    setBalance(String(presetAccount?.balance ?? 0));
    setCurrency((presetAccount?.currency ?? 'EUR').trim().toUpperCase() || 'EUR');
    setFormError(null);
  }, [
    bank.name,
    isConnectionEdit,
    presetAccount?.balance,
    presetAccount?.currency,
    presetAccount?.id,
    presetAccount?.isForTax,
    presetAccount?.nature
  ]);

  const handleComplete = async () => {
    const parsedBalance = Number.parseFloat(balance);
    if (isManual && !Number.isFinite(parsedBalance)) {
      setFormError('Please provide a valid numeric balance.');
      return;
    }

    const fallbackBalance = Number.isFinite(parsedBalance) ? parsedBalance : Number(presetAccount?.balance ?? 0) || 0;

    const payload: ManualBankSetupInput = {
      institutionName: institutionName.trim() || bank.name,
      balance: fallbackBalance,
      currency: currency.trim().toUpperCase() || 'EUR',
      isForTax: isTaxBuffer,
      nature: ACCOUNT_CATEGORY_TO_NATURE[accountType]
    };

    setFormError(null);
    try {
      await onComplete(payload);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to complete setup.');
    }
  };

  return (
    <SubpageShell onBack={onBack} title={isConnectionEdit ? 'Edit Connection' : 'Configure Account'}>
       <div className="max-w-2xl mx-auto space-y-8 pb-20">
          <Card>
             <div className="flex items-center gap-5 p-2">
                <div className={`w-16 h-16 rounded-[1.5rem] ${bank.color} text-white flex items-center justify-center text-2xl font-black shadow-lg`}>
                   {typeof bank.icon === 'string' ? bank.icon : React.isValidElement(bank.icon) ? React.cloneElement(bank.icon as React.ReactElement<any>, { size: 32 }) : bank.icon}
                </div>
                <div>
                   <h3 className="text-xl font-black text-gray-900 leading-none">{bank.name}</h3>
                   <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-widest">Successfully Authorized</p>
                </div>
                <div className="ml-auto">
                   <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center"><Check size={20} /></div>
                </div>
             </div>
          </Card>

          {(isManual || isConnectionEdit) && (
            <Card title={isConnectionEdit ? 'Connection Details' : 'Manual Account Details'}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isConnectionEdit ? 'Account Name' : 'Institution Name'}</label>
                  <input
                    value={institutionName}
                    onChange={(event) => setInstitutionName(event.target.value)}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none"
                    placeholder={isConnectionEdit ? 'Primary account' : 'Contanti nel cassetto'}
                  />
                </div>
                {isManual && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initial Balance</label>
                      <input
                        type="number"
                        value={balance}
                        onChange={(event) => setBalance(event.target.value)}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none"
                        placeholder="500.50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Currency</label>
                      <input
                        value={currency}
                        onChange={(event) => setCurrency(event.target.value)}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none"
                        placeholder="EUR"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          <div className="space-y-4">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Account Category</h3>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {ACCOUNT_CATEGORY_OPTIONS.map(type => (
                  <button 
                    key={type}
                    onClick={() => setAccountType(type)}
                    className={`p-6 rounded-[2rem] border-2 text-center transition-all ${accountType === type ? 'bg-white border-opex-teal shadow-xl scale-105' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
                  >
                    <p className={`text-sm font-black ${accountType === type ? 'text-gray-900' : 'text-gray-400'}`}>{type}</p>
                  </button>
                ))}
             </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Fiscal Settings</h3>
             <div 
               onClick={() => setIsTaxBuffer(!isTaxBuffer)}
               className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer flex items-center justify-between group ${isTaxBuffer ? 'bg-opex-teal text-white border-opex-teal shadow-2xl shadow-teal-900/20' : 'bg-white border-gray-100 hover:border-opex-teal/30'}`}
             >
                <div className="flex items-center gap-6">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isTaxBuffer ? 'bg-white/10' : 'bg-gray-50 text-gray-400'}`}>
                      <Calculator size={28} />
                   </div>
                   <div className="space-y-1">
                      <p className="text-lg font-black leading-none">Tax Buffer Account</p>
                      <p className={`text-xs font-medium ${isTaxBuffer ? 'text-teal-100' : 'text-gray-400'}`}>Use this account to set aside tax liabilities.</p>
                   </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isTaxBuffer ? 'bg-white border-white' : 'border-gray-200 group-hover:border-opex-teal'}`}>
                   {isTaxBuffer && <Check size={14} className="text-opex-teal" />}
                </div>
             </div>
          </div>

          <div className="pt-6">
             <Button fullWidth size="lg" icon={Check} onClick={() => void handleComplete()} disabled={isSaving}>
               {isSaving ? 'Saving...' : isConnectionEdit ? 'Save Changes' : 'Complete Setup'}
             </Button>
             {formError && <p className="mt-3 text-sm text-red-600 font-medium">{formError}</p>}
          </div>
       </div>
    </SubpageShell>
  );
};



export const AddBankPage = ({
  onNavigate,
  onBankSelect,
  onConnectionSelect,
  bankAccounts,
  taxBufferProviders = [],
  onCreateOpenBankConnection,
  onRemoveOpenBankConnection,
  openBankingNoticeVersion = null,
  isConnectingOpenBank = false,
  openBankErrorMessage = null,
  embeddedInSettings = false
}: {
  onNavigate: (v: string) => void;
  onBankSelect: (bank: BankOption) => void;
  onConnectionSelect: (account: BankAccountRecord, providerName: string) => void;
  bankAccounts: BankAccountRecord[];
  taxBufferProviders?: TaxBufferProviderItem[];
  onCreateOpenBankConnection: (consent: OpenBankingConsentPayload) => Promise<void>;
  onRemoveOpenBankConnection: (connectionId: string) => Promise<void>;
  openBankingNoticeVersion?: string | null;
  isConnectingOpenBank?: boolean;
  openBankErrorMessage?: string | null;
  embeddedInSettings?: boolean;
}) => {
  const providerByConnectionId = useMemo(() => {
    const providerMap = new Map<string, string>();
    taxBufferProviders.forEach((provider) => {
      const connectionId = (provider.connectionId ?? '').trim();
      const providerName = (provider.providerName ?? '').trim();
      if (connectionId.length > 0 && providerName.length > 0) {
        providerMap.set(connectionId, providerName);
      }
    });
    return providerMap;
  }, [taxBufferProviders]);

  const providerStatusByConnectionId = useMemo(() => {
    const statusMap = new Map<string, string>();
    taxBufferProviders.forEach((provider) => {
      const connectionId = (provider.connectionId ?? '').trim();
      const status = (provider.status ?? '').trim();
      if (connectionId.length > 0 && status.length > 0) {
        statusMap.set(connectionId, status);
      }
    });
    return statusMap;
  }, [taxBufferProviders]);

  const groupedByProvider = useMemo(() => {
    const groups = new Map<string, Map<string, BankAccountRecord[]>>();

    bankAccounts.forEach((account) => {
      const connectionId = (account.connectionId ?? '').trim();
      const providerName = (
        (connectionId.length > 0 ? providerByConnectionId.get(connectionId) : undefined)
        || (account.institutionName ?? '').trim()
        || 'Unknown Provider'
      );

      const groupKey = connectionId.length > 0
        ? `connection:${connectionId}`
        : `local:${resolveConnectionRecordId(account) || account.id || providerName}`;

      if (!groups.has(providerName)) {
        groups.set(providerName, new Map<string, BankAccountRecord[]>());
      }
      const providerGroups = groups.get(providerName);
      if (!providerGroups?.has(groupKey)) {
        providerGroups?.set(groupKey, []);
      }
      providerGroups?.get(groupKey)?.push(account);
    });

    return Array.from(groups.entries())
      .map(([providerName, connectionGroups]) => ({
        providerName,
        connections: Array.from(connectionGroups.entries())
          .map<ProviderConnectionCard | null>(([groupKey, accounts]) => {
            const sortedAccounts = [...accounts].sort((left, right) =>
              resolveConnectionAccountName(left, providerName).localeCompare(
                resolveConnectionAccountName(right, providerName)
              )
            );
            const representativeAccount = sortedAccounts[0];
            if (!representativeAccount) {
              return null;
            }
            const normalizedConnectionId = (representativeAccount?.connectionId ?? '').trim();

            return {
              key: groupKey,
              account: representativeAccount,
              accountCount: sortedAccounts.length,
              totalBalance: sortedAccounts.reduce((sum, item) => sum + Number(item.balance ?? 0), 0),
              connectionId: normalizedConnectionId.length > 0 ? normalizedConnectionId : null,
              status: normalizedConnectionId.length > 0
                ? (providerStatusByConnectionId.get(normalizedConnectionId) ?? null)
                : null,
              isManagedConnection: normalizedConnectionId.length > 0 && sortedAccounts.some((item) => item.isSaltedge)
            };
          })
          .filter((item): item is ProviderConnectionCard => item !== null)
          .sort((left, right) =>
            resolveConnectionAccountName(left.account, providerName).localeCompare(
              resolveConnectionAccountName(right.account, providerName)
            )
          )
      }))
      .sort((left, right) => left.providerName.localeCompare(right.providerName));
  }, [bankAccounts, providerByConnectionId, providerStatusByConnectionId]);
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (groupedByProvider.length === 0) {
      setExpandedProviders({});
      return;
    }

    setExpandedProviders((previous) => {
      const next: Record<string, boolean> = {};
      groupedByProvider.forEach(({ providerName }) => {
        next[providerName] = previous[providerName] ?? false;
      });

      const hasExpanded = Object.values(next).some(Boolean);
      if (!hasExpanded) {
        next[groupedByProvider[0].providerName] = true;
      }
      return next;
    });
  }, [groupedByProvider]);
  const [isOpenBankingConsentModalOpen, setIsOpenBankingConsentModalOpen] = useState(false);
  const [acceptOpenBankingNotice, setAcceptOpenBankingNotice] = useState(false);
  const [acceptSaltEdgeTransfer, setAcceptSaltEdgeTransfer] = useState(false);
  const [openBankingConsentError, setOpenBankingConsentError] = useState<string | null>(null);
  const [isSubmittingOpenBankingConsent, setIsSubmittingOpenBankingConsent] = useState(false);
  const [activeRemoveConnectionId, setActiveRemoveConnectionId] = useState<string | null>(null);
  const [connectionActionError, setConnectionActionError] = useState<string | null>(null);

  const toggleProvider = (providerName: string) => {
    setExpandedProviders((previous) => ({
      ...previous,
      [providerName]: !previous[providerName]
    }));
  };

  const handleRemoveConnection = async (connectionId: string, providerName: string) => {
    const confirmed = window.confirm(
      `Remove the ${providerName} connection? Imported accounts and transactions linked to this Salt Edge connection will be deleted from Opex.`
    );
    if (!confirmed) {
      return;
    }

    setConnectionActionError(null);
    setActiveRemoveConnectionId(connectionId);

    try {
      await onRemoveOpenBankConnection(connectionId);
    } catch (error) {
      setConnectionActionError(error instanceof Error ? error.message : 'Unable to remove this Salt Edge connection.');
    } finally {
      setActiveRemoveConnectionId(null);
    }
  };

  const handleOpenBankingStart = async () => {
    if (!openBankingNoticeVersion) {
      setOpenBankingConsentError('Open banking notice version is not available yet. Reload and retry.');
      return;
    }

    if (!acceptOpenBankingNotice || !acceptSaltEdgeTransfer) {
      setOpenBankingConsentError('You must confirm the data notice and Salt Edge processing before connecting a bank.');
      return;
    }

    setOpenBankingConsentError(null);
    setIsSubmittingOpenBankingConsent(true);

    try {
      await onCreateOpenBankConnection({
        acceptOpenBankingNotice: true,
        openBankingNoticeVersion,
        scopes: ['account_details', 'balances', 'transactions']
      });
      setIsOpenBankingConsentModalOpen(false);
    } catch (error) {
      setOpenBankingConsentError(error instanceof Error ? error.message : 'Unable to start open banking connection.');
    } finally {
      setIsSubmittingOpenBankingConsent(false);
    }
  };

  const pageContent = (
    <div className={`max-w-4xl mx-auto ${embeddedInSettings ? 'flex flex-col gap-8' : 'space-y-8'}`}>
        <Card title="Connections By Provider" className={embeddedInSettings ? 'order-2' : ''}>
          {groupedByProvider.length === 0 ? (
            <p className="text-sm text-gray-500 font-medium">No connections available yet.</p>
          ) : (
            <div className="space-y-3">
              {groupedByProvider.map(({ providerName, connections }) => {
                const isExpanded = Boolean(expandedProviders[providerName]);

                return (
                  <div key={providerName} className="rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden">
                    <button
                      onClick={() => toggleProvider(providerName)}
                      className="w-full px-4 py-3 flex items-center justify-between gap-4 hover:bg-gray-100/60 transition-colors"
                    >
                      <div className="text-left">
                        <p className="text-sm font-black text-gray-900">{providerName}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {connections.length} {connections.length === 1 ? 'connection' : 'connections'}
                        </p>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-white/80 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {connections.map((connection, index) => (
                            <React.Fragment key={connection.key}>
                              <ConnectionAccountCard
                                account={connection.account}
                                providerName={providerName}
                                index={index}
                                accountCount={connection.accountCount}
                                totalBalance={connection.totalBalance}
                                connectionStatus={connection.status}
                                canManageConnection={connection.isManagedConnection && Boolean(connection.connectionId)}
                                isRemoving={connection.connectionId === activeRemoveConnectionId}
                                onRemove={connection.connectionId ? () => void handleRemoveConnection(connection.connectionId, providerName) : undefined}
                                onClick={() => onConnectionSelect(connection.account, providerName)}
                              />
                            </React.Fragment>
                          ))}
                          {false && connections.map(({ account }: ProviderConnectionCard, index) => (
                            <React.Fragment key={`${providerName}-${account.connectionId ?? 'no-connection'}-${account.id ?? account.institutionName ?? 'account'}-${index}`}>
                              <ConnectionAccountCard
                                account={account}
                                providerName={providerName}
                                index={index}
                                totalBalance={Number(account.balance ?? 0)}
                                onClick={() => onConnectionSelect(account, providerName)}
                              />
                              {false && (
                            <button
                              key={`${providerName}-${account.connectionId ?? 'no-connection'}-${account.id ?? account.institutionName ?? 'account'}-${index}`}
                              onClick={() => onConnectionSelect(account, providerName)}
                              className="text-left w-full rounded-2xl border border-gray-100 bg-white px-4 py-4 hover:border-opex-teal/30 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="text-sm font-black text-gray-900">{resolveConnectionAccountName(account, providerName)}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {toAccountCategory(account.nature)} • {account.isSaltedge ? 'Open Banking' : 'Local'}
                                  </p>
                                </div>
                                <ChevronRight size={16} className="text-gray-400" />
                              </div>
                              <div className="mt-3 flex items-center justify-between gap-3">
                                <p className="text-sm font-bold text-gray-700">
                                  {new Intl.NumberFormat('it-IT', {
                                    style: 'currency',
                                    currency: account.currency || 'EUR',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2
                                  }).format(account.balance ?? 0)}
                                </p>
                                {account.isForTax && (
                                  <span className="inline-flex items-center rounded-full bg-opex-teal/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-opex-teal">
                                    Tax Buffer
                                  </span>
                                )}
                              </div>
                            </button>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {connectionActionError && (
          <p className="text-sm font-medium text-red-600">{connectionActionError}</p>
        )}

        <Card title="Add New Connection" className={embeddedInSettings ? 'order-1' : ''}>
          <button
            onClick={() => {
              setAcceptOpenBankingNotice(false);
              setAcceptSaltEdgeTransfer(false);
              setOpenBankingConsentError(null);
              setIsOpenBankingConsentModalOpen(true);
            }}
            className="w-full bg-opex-teal/5 p-6 rounded-[2rem] border border-opex-teal/20 flex items-center justify-between gap-4 hover:bg-opex-teal/10 transition-all group"
            disabled={isConnectingOpenBank}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-opex-teal text-white flex items-center justify-center font-black text-lg shadow-lg group-hover:scale-105 transition-transform">
                OB
              </div>
              <div className="text-left">
                <p className="text-base font-black text-gray-900">New Open Banking Connection</p>
                <p className="text-xs text-gray-500 font-medium">
                  {isConnectingOpenBank
                    ? 'Preparing connection and opening a new browser tab...'
                    : 'Start a new bank connection and authorize via Salt Edge.'}
                </p>
              </div>
            </div>
            {isConnectingOpenBank ? <Loader2 size={20} className="text-opex-teal animate-spin" /> : <ChevronRight size={20} className="text-opex-teal" />}
          </button>
          {openBankErrorMessage && <p className="mt-3 text-sm text-red-600 font-medium">{openBankErrorMessage}</p>}
          <button
            onClick={() => onBankSelect({ name: 'Manual Account', color: 'bg-gray-400', icon: <Plus />, isManual: true })}
            className="mt-4 w-full bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-300 text-left hover:bg-gray-100 transition-all"
          >
            <p className="text-sm font-black text-gray-700">Add Manual Account</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Create a local account without Open Banking authorization.</p>
          </button>
        </Card>

        {isOpenBankingConsentModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-[6px]">
            <div className="w-full max-w-2xl rounded-[2.25rem] border border-white/70 bg-white/95 p-6 shadow-[0_32px_80px_-32px_rgba(15,23,42,0.45)] md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Open Banking Notice</p>
                  <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Review the banking data notice</h3>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                    Before Opex redirects you to Salt Edge, confirm that you understand what banking data will be imported and why.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpenBankingConsentModalOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-opex-dark"
                  disabled={isSubmittingOpenBankingConsent}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-black text-slate-900">Data imported</p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                    Opex may import account identifiers, provider metadata, balances and transactions for the connected bank.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-black text-slate-900">Third-party processing</p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                    Salt Edge handles the authorization redirect and connection workflow with your bank.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <label className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={acceptOpenBankingNotice}
                    onChange={(event) => {
                      setAcceptOpenBankingNotice(event.target.checked);
                      if (openBankingConsentError) {
                        setOpenBankingConsentError(null);
                      }
                    }}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-opex-dark focus:ring-opex-dark"
                    disabled={isSubmittingOpenBankingConsent}
                  />
                  <span>
                    <span className="block text-base font-black text-slate-900">
                      I accept the Open Banking Notice v{openBankingNoticeVersion || 'current'}.
                    </span>
                    <span className="mt-1 block text-sm font-medium leading-relaxed text-slate-500">
                      I understand how Opex will use connected banking data inside the product.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={acceptSaltEdgeTransfer}
                    onChange={(event) => {
                      setAcceptSaltEdgeTransfer(event.target.checked);
                      if (openBankingConsentError) {
                        setOpenBankingConsentError(null);
                      }
                    }}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-opex-dark focus:ring-opex-dark"
                    disabled={isSubmittingOpenBankingConsent}
                  />
                  <span>
                    <span className="block text-base font-black text-slate-900">
                      I authorize the redirect to Salt Edge for bank connection setup.
                    </span>
                    <span className="mt-1 block text-sm font-medium leading-relaxed text-slate-500">
                      This specific flow is optional. You can keep using manual accounts if you prefer not to connect a bank.
                    </span>
                  </span>
                </label>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => openLegalDocument('open-banking')}
                  className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition-colors hover:border-slate-300 hover:text-opex-dark"
                  disabled={isSubmittingOpenBankingConsent}
                >
                  Open Banking Notice
                </button>
                <button
                  type="button"
                  onClick={() => openLegalDocument('privacy')}
                  className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition-colors hover:border-slate-300 hover:text-opex-dark"
                  disabled={isSubmittingOpenBankingConsent}
                >
                  Privacy Notice
                </button>
                <button
                  type="button"
                  onClick={() => openLegalDocument('terms')}
                  className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition-colors hover:border-slate-300 hover:text-opex-dark"
                  disabled={isSubmittingOpenBankingConsent}
                >
                  Terms
                </button>
              </div>

              {openBankingConsentError && (
                <p className="mt-5 text-sm font-bold text-red-600">{openBankingConsentError}</p>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpenBankingConsentModalOpen(false)}
                  className="inline-flex h-12 items-center justify-center rounded-[1rem] border border-slate-200 bg-white px-5 text-sm font-black text-slate-500 transition-colors hover:border-slate-300 hover:text-opex-dark"
                  disabled={isSubmittingOpenBankingConsent}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleOpenBankingStart()}
                  className="inline-flex h-12 items-center justify-center rounded-[1rem] bg-opex-dark px-5 text-sm font-black text-white"
                  disabled={isSubmittingOpenBankingConsent}
                >
                  {isSubmittingOpenBankingConsent ? 'Opening...' : 'Continue to Salt Edge'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );

  if (embeddedInSettings) {
    return pageContent;
  }

  return (
    <SubpageShell onBack={() => onNavigate('SETTINGS')} title="Add Bank">
      {pageContent}
    </SubpageShell>
  );
};



export interface Payment {
  id: string;
  payment_date: string;
  amount: number;
  note?: string;
}

export interface Invoice {
  id: string;
  client: string;
  total: number;
  amountPaid: number;
  issuedDate: string;
  dueDate: string;
  status: 'Draft' | 'Sent' | 'Paid';
  paymentDate?: string;
  payments?: Payment[];
  lineItems: LineItem[];
}

export interface Quote {
  id: string;
  client: string;
  total: number;
  issuedDate: string;
  validUntil: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted';
  convertedToInvoiceId?: string;
  notes?: string;
  terms?: string;
  lineItems: LineItem[];
  vatRate: number;
}





export interface LineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  unitType: 'Hours' | 'Fixed' | 'Days';
}

export const CreateInvoiceModal = ({ isOpen, onClose, userProfile }: { isOpen: boolean, onClose: () => void, userProfile: any }) => {
  const [client, setClient] = useState('');
  const [issueDate, setIssueDate] = useState('2026-03-03');
  const [dueDate, setDueDate] = useState('2026-03-17');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isAutoReminders, setIsAutoReminders] = useState(false);
  const [taxSetup, setTaxSetup] = useState<'standard' | 'exempt'>('standard');
  const [vatRate, setVatRate] = useState(21);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isMarkedAsPaid, setIsMarkedAsPaid] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);
  const [showReference, setShowReference] = useState(false);
  
  // Auto-determine VAT based on tax setup
  useEffect(() => {
    if (taxSetup === 'exempt') {
      setVatRate(0);
    } else {
      setVatRate(21);
    }
  }, [taxSetup]);
  
  // Recurring fields
  const [frequency, setFrequency] = useState('Monthly');
  const [recurringStartDate, setRecurringStartDate] = useState('2026-03-03');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [autoSend, setAutoSend] = useState(false);

  if (!isOpen) return null;

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      qty: 1,
      unitPrice: 0,
      unitType: 'Fixed'
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'unitType' && value === 'Fixed') {
          updatedItem.qty = 1;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const grossAmount = lineItems.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
  const vatAmount = (grossAmount * vatRate) / 100;
  const totalAmount = grossAmount + vatAmount;

  // Mock Tax Rates
  const INCOME_TAX_RATE = 0.15;
  const SOCIAL_CONTRIB_RATE = 0.25;
  
  const taxToSetAside = grossAmount * (INCOME_TAX_RATE + SOCIAL_CONTRIB_RATE);
  const youKeep = grossAmount - taxToSetAside;

  const isValid = 
    client !== '' && 
    issueDate !== '' && 
    dueDate !== '' && 
    new Date(dueDate) >= new Date(issueDate) &&
    lineItems.length > 0 &&
    lineItems.every(item => item.description.trim() !== '' && item.qty > 0 && item.unitPrice >= 0) &&
    totalAmount > 0;

  const handleDuplicateLast = () => {
    // Mock pre-fill
    setClient('TechCorp GmbH');
    setLineItems([
      { id: '1', description: 'Product Design - Phase 1', qty: 1, unitPrice: 4500, unitType: 'Fixed' },
      { id: '2', description: 'Frontend Development', qty: 40, unitPrice: 85, unitType: 'Hours' }
    ]);
    setVatRate(21);
    setIssueDate('2026-03-03');
    setDueDate('2026-03-17');
  };

  const handleDownloadPDF = () => {
    // Mock PDF generation and download
    const logoText = userProfile.logo ? '[LOGO]' : userProfile.name;
    const content = `${logoText}\n\nInvoice for ${client}\nTotal: €${totalAmount.toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `INV-2026-008-${client.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-opex-dark/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-6xl h-full max-h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative z-10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-opex-teal/10 text-opex-teal flex items-center justify-center">
              <FilePlus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Create Invoice</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Drafting INV-2026-008</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" icon={Download} onClick={handleDownloadPDF} disabled={!isValid}>Download PDF</Button>
            <Button variant="outline" size="sm" icon={Copy} onClick={handleDuplicateLast}>Duplicate Last</Button>
            <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
              <Settings size={20} />
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors ml-2">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Main Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-10">
            {/* Client & Dates Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Client Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</h3>
                  <button className="text-opex-teal hover:underline flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                    <Plus size={12} /> Add New
                  </button>
                </div>
                <div className="relative">
                  <select 
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 appearance-none focus:ring-2 focus:ring-opex-teal/10 outline-none"
                  >
                    <option value="">Select Client</option>
                    <option value="TechCorp GmbH">TechCorp GmbH</option>
                    <option value="Acme Corp">Acme Corp</option>
                    <option value="Global Inc">Global Inc</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              {/* Dates Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dates</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400">Issue Date</label>
                    <input 
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-opex-teal/10 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400">Due Date</label>
                    <input 
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-opex-teal/10 outline-none ${new Date(dueDate) < new Date(issueDate) ? 'border-red-200 text-red-600' : 'border-gray-100'}`}
                    />
                  </div>
                </div>
                {new Date(dueDate) < new Date(issueDate) && (
                  <p className="text-[10px] font-bold text-red-500">Due date must be after issue date</p>
                )}
              </div>
            </div>

            {/* Line Items Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Line Items</h3>
                <button 
                  onClick={addLineItem}
                  className="text-opex-teal hover:bg-opex-teal/5 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>

              <div className="space-y-4">
                {lineItems.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-100 rounded-3xl p-12 text-center space-y-3 bg-gray-50/30 animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto shadow-sm">
                      <Layers size={24} className="text-gray-200" />
                    </div>
                    <p className="text-sm font-bold text-gray-400">Add at least one item to generate the total.</p>
                    <button 
                      onClick={addLineItem}
                      className="mt-4 bg-opex-teal text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-opex-teal/90 transition-all shadow-lg shadow-opex-teal/20 active:scale-95"
                    >
                      Add First Item
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lineItems.map((item, index) => (
                      <div key={item.id} className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-2xl group hover:border-opex-teal/20 transition-all shadow-sm animate-in slide-in-from-top-2 duration-300">
                        <div className="pt-2 text-gray-300 cursor-grab active:cursor-grabbing">
                          <GripVertical size={16} />
                        </div>
                        <div className="flex-1 grid grid-cols-12 gap-4">
                          <div className="col-span-4 space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
                            <textarea 
                              autoFocus={index === lineItems.length - 1}
                              placeholder="Service or product description..."
                              value={item.description}
                              onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                              rows={1}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = `${target.scrollHeight}px`;
                              }}
                              className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 outline-none resize-none min-h-[24px] overflow-hidden"
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Unit</label>
                            <div className="relative">
                              <select 
                                value={item.unitType}
                                onChange={(e) => updateLineItem(item.id, 'unitType', e.target.value)}
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 outline-none appearance-none cursor-pointer pr-4"
                              >
                                <option value="Fixed">Fixed</option>
                                <option value="Hours">Hours</option>
                                <option value="Days">Days</option>
                              </select>
                              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                            </div>
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                              {item.unitType === 'Hours' ? 'Hours worked' : item.unitType === 'Days' ? 'Days' : 'Qty'}
                            </label>
                            <input 
                              type="number"
                              disabled={item.unitType === 'Fixed'}
                              value={item.qty}
                              onChange={(e) => updateLineItem(item.id, 'qty', Number(e.target.value))}
                              className={`w-full bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 outline-none ${item.unitType === 'Fixed' ? 'opacity-50' : ''}`}
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Price</label>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-gray-400">€</span>
                              <input 
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 outline-none"
                              />
                            </div>
                          </div>
                          <div className="col-span-2 space-y-1 text-right">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total</label>
                            <p className="text-sm font-black text-gray-900">€{(item.qty * item.unitPrice).toLocaleString()}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeLineItem(item.id)}
                          className="pt-2 text-gray-300 hover:text-red-500 transition-colors opacity-40 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={addLineItem}
                      className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 hover:border-opex-teal/30 hover:text-opex-teal transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest mt-4 active:scale-[0.99]"
                    >
                      <Plus size={16} /> Add Another Item
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Collapsible: Reference Invoice */}
            <div className="border border-gray-100 rounded-[2rem] overflow-hidden">
              <button 
                onClick={() => setShowReference(!showReference)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                    <Upload size={16} />
                  </div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference Invoice</h3>
                </div>
                {showReference ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
              </button>
              
              {showReference && (
                <div className="p-6 bg-white animate-in slide-in-from-top-2 duration-300">
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                      isDragging ? 'border-opex-teal bg-opex-teal/5' : 'border-gray-100 bg-gray-50/50'
                    }`}
                  >
                    {uploadedFile ? (
                      <div className="space-y-2">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto shadow-sm text-opex-teal">
                          <FileText size={20} />
                        </div>
                        <p className="text-[10px] font-bold text-gray-900 truncate px-2">{uploadedFile.name}</p>
                        <button onClick={() => setUploadedFile(null)} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">Remove</button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto shadow-sm text-gray-300">
                          <Upload size={20} />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400">Drag & drop invoice PDF here</p>
                        <label className="inline-block cursor-pointer text-[9px] font-black text-opex-teal uppercase tracking-widest hover:underline">
                          Or upload manually
                          <input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && setUploadedFile(e.target.files[0])} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Collapsible: Automation */}
            <div className="border border-gray-100 rounded-[2rem] overflow-hidden">
              <button 
                onClick={() => setShowAutomation(!showAutomation)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                    <Zap size={16} />
                  </div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Automation</h3>
                </div>
                {showAutomation ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
              </button>

              {showAutomation && (
                <div className="p-6 bg-white space-y-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Recurring Toggle */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RefreshCw size={14} className="text-gray-400" />
                          <span className="text-sm font-bold text-gray-700">Recurring</span>
                        </div>
                        <button 
                          onClick={() => setIsRecurring(!isRecurring)}
                          className={`w-10 h-5 rounded-full transition-all relative ${isRecurring ? 'bg-opex-teal' : 'bg-gray-200'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isRecurring ? 'left-6' : 'left-1'}`}></div>
                        </button>
                      </div>
                      {isRecurring && (
                        <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Frequency</label>
                            <select 
                              value={frequency}
                              onChange={(e) => setFrequency(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-xs font-bold outline-none"
                            >
                              <option>Monthly</option>
                              <option>Quarterly</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400">Start</label>
                              <input type="date" value={recurringStartDate} onChange={e => setRecurringStartDate(e.target.value)} className="w-full px-2 py-1.5 bg-white border border-gray-100 rounded-lg text-[10px] font-bold outline-none" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400">End (Opt)</label>
                              <input type="date" value={recurringEndDate} onChange={e => setRecurringEndDate(e.target.value)} className="w-full px-2 py-1.5 bg-white border border-gray-100 rounded-lg text-[10px] font-bold outline-none" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] font-bold text-gray-500">Auto-send</span>
                            <button 
                              onClick={() => setAutoSend(!autoSend)}
                              className={`w-8 h-4 rounded-full transition-all relative ${autoSend ? 'bg-opex-teal' : 'bg-gray-200'}`}
                            >
                              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${autoSend ? 'left-4.5' : 'left-0.5'}`}></div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Auto Reminders Toggle */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell size={14} className="text-gray-400" />
                          <span className="text-sm font-bold text-gray-700">Auto Reminders</span>
                        </div>
                        <button 
                          onClick={() => setIsAutoReminders(!isAutoReminders)}
                          className={`w-10 h-5 rounded-full transition-all relative ${isAutoReminders ? 'bg-opex-teal' : 'bg-gray-200'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAutoReminders ? 'left-6' : 'left-1'}`}></div>
                        </button>
                      </div>
                      {isAutoReminders && (
                        <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Schedule Preview</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                              <span>Reminder 1: 3 days after due</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                              <span>Reminder 2: 7 days after due</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-red-500">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                              <span>Final notice: 14 days after due</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Financial Summary Sidebar */}
          <div className="w-80 shrink-0 border-l border-gray-100 bg-gray-50/30 overflow-y-auto p-8 space-y-6">
            {/* Branding Preview */}
            <div className="p-6 bg-white rounded-[2rem] border border-gray-100 flex items-center justify-center min-h-[120px] shadow-sm">
              {userProfile.logo ? (
                <img src={userProfile.logo} alt="Logo" className="max-h-16 object-contain" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-opex-teal text-white flex items-center justify-center font-black text-lg">
                    {userProfile.name.charAt(0)}
                  </div>
                  <span className="text-sm font-black text-gray-900 tracking-tight">{userProfile.name}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice Summary</h3>
              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 space-y-6 shadow-sm">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-500">Total Invoice</span>
                    <span className="text-sm font-black text-gray-900">€{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-500">VAT to pay</span>
                      <button 
                        onClick={() => setTaxSetup(taxSetup === 'exempt' ? 'standard' : 'exempt')}
                        className={`flex items-center gap-1 border rounded-lg px-2 py-0.5 transition-all ${taxSetup === 'exempt' ? 'bg-opex-teal/5 border-opex-teal/20' : 'bg-gray-50 border-gray-100'}`}
                      >
                        <span className={`text-[10px] font-black ${taxSetup === 'exempt' ? 'text-opex-teal' : 'text-gray-400'}`}>
                          {taxSetup === 'exempt' ? 'Exempt' : `${vatRate}%`}
                        </span>
                      </button>
                    </div>
                    <span className="text-sm font-black text-gray-900">€{vatAmount.toLocaleString()}</span>
                  </div>
                  
                  <div className="h-px bg-gray-100 w-full"></div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-500">Net revenue</span>
                    <span className="text-sm font-black text-gray-900">€{grossAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estimated Impact</h3>
              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 space-y-6 shadow-sm">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-500">Estimated tax set-aside</span>
                    <span className="text-sm font-bold text-gray-900">€{taxToSetAside.toLocaleString()}</span>
                  </div>
                  
                  <div className="h-px bg-gray-100 w-full"></div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-900">You keep</span>
                    <span className="text-lg font-black text-green-600">€{youKeep.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-3">
                    <Lightbulb size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-blue-800 leading-relaxed">
                      Estimated tax set-aside is based on your current tax profile and backend tax assumptions.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
                  <span className="text-[10px] font-bold text-gray-400">Mark as Paid</span>
                  <button 
                    onClick={() => setIsMarkedAsPaid(!isMarkedAsPaid)}
                    className={`w-8 h-4 rounded-full transition-all relative ${isMarkedAsPaid ? 'bg-green-500' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isMarkedAsPaid ? 'left-4.5' : 'left-0.5'}`}></div>
                  </button>
                </div>

                {isMarkedAsPaid && (
                  <div className="pt-2 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                      <p className="text-[10px] font-black text-green-800 uppercase tracking-tight">
                        Simulation: Income & Tax updated
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
          <div className="flex items-center gap-8">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Invoice</p>
              <p className="text-xl font-black text-gray-900">€{totalAmount.toLocaleString()}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">You keep</p>
              <p className="text-xl font-black text-green-600">€{youKeep.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onClose}>Save Draft</Button>
            <Button variant="primary" disabled={!isValid} onClick={onClose}>Confirm & Send Invoice</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CreateQuoteModal = ({ isOpen, onClose, userProfile }: { isOpen: boolean, onClose: () => void, userProfile: any }) => {
  const [client, setClient] = useState('');
  const [issueDate, setIssueDate] = useState('2026-03-03');
  const [validUntil, setValidUntil] = useState('2026-03-17');
  const [vatRate, setVatRate] = useState(21);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  if (!isOpen) return null;

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      qty: 1,
      unitPrice: 0,
      unitType: 'Fixed'
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'unitType' && value === 'Fixed') {
          updatedItem.qty = 1;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const grossAmount = lineItems.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
  const vatAmount = (grossAmount * vatRate) / 100;
  const totalAmount = grossAmount + vatAmount;

  const isValid = 
    client !== '' && 
    issueDate !== '' && 
    validUntil !== '' && 
    new Date(validUntil) >= new Date(issueDate) &&
    lineItems.length > 0 &&
    lineItems.every(item => item.description.trim() !== '' && item.qty > 0 && item.unitPrice >= 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-opex-dark/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative z-10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-opex-teal/10 text-opex-teal flex items-center justify-center">
              <FilePlus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Create Quote</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Drafting Q-2026-009</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Client & Dates */}
            <div className="lg:col-span-3 space-y-8">
              {/* Branding Preview */}
              <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-center justify-center min-h-[120px]">
                {userProfile.logo ? (
                  <img src={userProfile.logo} alt="Logo" className="max-h-16 object-contain" />
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-opex-teal text-white flex items-center justify-center font-black text-lg">
                      {userProfile.name.charAt(0)}
                    </div>
                    <span className="text-sm font-black text-gray-900 tracking-tight">{userProfile.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</h3>
                <div className="relative">
                  <select 
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 appearance-none focus:ring-2 focus:ring-opex-teal/10 outline-none"
                  >
                    <option value="">Select Client</option>
                    <option value="TechCorp GmbH">TechCorp GmbH</option>
                    <option value="Acme Corp">Acme Corp</option>
                    <option value="Global Inc">Global Inc</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dates</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400">Issue Date</label>
                    <input 
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-opex-teal/10 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400">Valid Until</label>
                    <input 
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-opex-teal/10 outline-none ${new Date(validUntil) < new Date(issueDate) ? 'border-red-200 text-red-600' : 'border-gray-100'}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Center Column: Line Items */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Line Items</h3>
                <button 
                  onClick={addLineItem}
                  className="text-opex-teal hover:bg-opex-teal/5 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>

              <div className="space-y-4">
                {lineItems.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-100 rounded-3xl p-12 text-center space-y-3 bg-gray-50/30">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto shadow-sm">
                      <Layers size={24} className="text-gray-200" />
                    </div>
                    <p className="text-sm font-bold text-gray-400">Add at least one item to generate the total.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lineItems.map((item, index) => (
                      <div key={item.id} className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-2xl group hover:border-opex-teal/20 transition-all shadow-sm">
                        <div className="pt-2 text-gray-300">
                          <GripVertical size={16} />
                        </div>
                        <div className="flex-1 grid grid-cols-12 gap-4">
                          <div className="col-span-6 space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
                            <input 
                              autoFocus={index === lineItems.length - 1}
                              placeholder="Service description..."
                              value={item.description}
                              onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                              className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 outline-none"
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Qty</label>
                            <input 
                              type="number"
                              value={item.qty}
                              onChange={(e) => updateLineItem(item.id, 'qty', Number(e.target.value))}
                              className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 outline-none"
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Price</label>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-gray-400">€</span>
                              <input 
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 outline-none"
                              />
                            </div>
                          </div>
                          <div className="col-span-2 space-y-1 text-right">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total</label>
                            <p className="text-sm font-black text-gray-900">€{(item.qty * item.unitPrice).toLocaleString()}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeLineItem(item.id)}
                          className="pt-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Financial Summary */}
            <div className="lg:col-span-3">
              <Card title="Financial Summary" noPadding>
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-500">Gross Amount</span>
                      <span className="text-sm font-black text-gray-900">€{grossAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-500">VAT</span>
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-0.5">
                          <input 
                            type="number"
                            value={vatRate}
                            onChange={(e) => setVatRate(Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-8 bg-transparent border-none p-0 text-xs font-black text-opex-teal focus:ring-0 outline-none text-right"
                          />
                          <span className="text-[10px] font-black text-opex-teal">%</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-gray-900">€{vatAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-px bg-gray-100 w-full"></div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Quote</p>
                    <p className="text-3xl font-black text-opex-dark tracking-tight">€{totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
          <div className="flex items-center gap-8">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Quote</p>
              <p className="text-xl font-black text-gray-900">€{totalAmount.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onClose}>Save Draft</Button>
            <Button variant="primary" disabled={!isValid} onClick={onClose}>Send Quote</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const QuoteDetailModal = ({ quote, isOpen, onClose, onConvert, onStatusChange, userProfile }: { 
  quote: Quote | null, 
  isOpen: boolean, 
  onClose: () => void,
  onConvert: (q: Quote) => void,
  onStatusChange: (id: string, status: Quote['status']) => void,
  userProfile: any
}) => {
  if (!isOpen || !quote) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft': return <Badge>Draft</Badge>;
      case 'Sent': return <Badge variant="info">Sent</Badge>;
      case 'Accepted': return <Badge variant="success">Accepted</Badge>;
      case 'Rejected': return <Badge variant="danger">Rejected</Badge>;
      case 'Expired': return <Badge>Expired</Badge>;
      case 'Converted': return <Badge variant="success">Converted</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const gross = quote.lineItems.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
  const vat = (gross * quote.vatRate) / 100;
  const total = gross + vat;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-opex-dark/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-4xl h-full max-h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative z-10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {userProfile.logo ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50">
                <img src={userProfile.logo} alt="Logo" className="w-full h-full object-contain p-2" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-opex-teal/10 text-opex-teal flex items-center justify-center font-black text-xl">
                {userProfile.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">{quote.id}</h2>
                {getStatusBadge(quote.status)}
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{quote.client}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Download} onClick={() => {
               const logoText = userProfile.logo ? '[LOGO]' : userProfile.name;
               const content = `${logoText}\n\nQuote ${quote.id}\nClient: ${quote.client}\nTotal: €${total.toLocaleString()}`;
               const blob = new Blob([content], { type: 'text/plain' });
               const url = URL.createObjectURL(blob);
               const a = document.createElement('a');
               a.href = url;
               a.download = `${quote.id}.pdf`;
               document.body.appendChild(a);
               a.click();
               document.body.removeChild(a);
               URL.revokeObjectURL(url);
            }}>Download PDF</Button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-3 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Issue Date</p>
              <p className="text-sm font-bold text-gray-900">{quote.issuedDate}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valid Until</p>
              <p className="text-sm font-bold text-gray-900">{quote.validUntil}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</p>
              <p className="text-sm font-black text-opex-teal">€{total.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Line Items</h3>
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3 text-center">Qty</th>
                    <th className="px-6 py-3 text-right">Price</th>
                    <th className="px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {quote.lineItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 font-bold text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 text-center font-medium text-gray-600">{item.qty}</td>
                      <td className="px-6 py-4 text-right font-medium text-gray-600">€{item.unitPrice.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-black text-gray-900">€{(item.qty * item.unitPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {quote.status === 'Converted' && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                  <Check size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-900">Converted to Invoice</p>
                  <p className="text-[10px] font-bold text-emerald-600">{quote.convertedToInvoiceId}</p>
                </div>
              </div>
              <button className="text-xs font-black text-emerald-600 hover:underline flex items-center gap-1">
                View Invoice <ExternalLink size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-gray-50/50">
          {quote.status === 'Draft' && (
            <>
              <Button variant="outline" icon={Edit2}>Edit Quote</Button>
              <Button variant="primary" icon={Mail} onClick={() => onStatusChange(quote.id, 'Sent')}>Send Quote</Button>
            </>
          )}
          {quote.status === 'Sent' && (
            <>
              <Button variant="outline" className="text-red-600 hover:bg-red-50" icon={XCircle} onClick={() => onStatusChange(quote.id, 'Rejected')}>Mark Rejected</Button>
              <Button variant="outline" className="text-emerald-600 hover:bg-emerald-50" icon={CheckCircle2} onClick={() => onStatusChange(quote.id, 'Accepted')}>Mark Accepted</Button>
              <Button variant="primary" icon={ArrowRightLeft} onClick={() => onConvert(quote)}>Convert to Invoice</Button>
            </>
          )}
          {quote.status === 'Accepted' && (
            <Button variant="primary" icon={ArrowRightLeft} onClick={() => onConvert(quote)}>Convert to Invoice</Button>
          )}
          {(quote.status === 'Rejected' || quote.status === 'Expired' || quote.status === 'Converted') && (
            <Button variant="outline" icon={Copy}>Duplicate Quote</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const RecordPaymentModal = ({ invoice, isOpen, onClose, onRecord }: {
  invoice: Invoice | null,
  isOpen: boolean,
  onClose: () => void,
  onRecord: (amount: number, date: string, note: string) => void
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (isOpen && invoice) {
      const totalPaid = (invoice.payments || []).reduce((acc, p) => acc + p.amount, 0);
      const remaining = invoice.total - totalPaid;
      setAmount(remaining);
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
  }, [isOpen, invoice]);

  if (!isOpen || !invoice) return null;

  const totalPaid = (invoice.payments || []).reduce((acc, p) => acc + p.amount, 0);
  const remaining = invoice.total - totalPaid;

  const isValid = amount > 0 && amount <= remaining;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-opex-dark/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Record Payment</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl">
            <div className="space-y-0.5">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total</p>
              <p className="text-xs font-black text-gray-900">€{invoice.total.toLocaleString()}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Paid</p>
              <p className="text-xs font-black text-emerald-600">€{totalPaid.toLocaleString()}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Balance</p>
              <p className="text-xs font-black text-red-600">€{remaining.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">€</span>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-opex-teal/10 outline-none"
                />
              </div>
              {amount === remaining && amount > 0 && (
                <p className="text-[10px] font-bold text-emerald-600">This payment will mark the invoice as fully paid.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</label>
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-opex-teal/10 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Note (Optional)</label>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Bank transfer, Cash..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-opex-teal/10 outline-none min-h-[80px] resize-none"
              />
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-gray-50/50">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!isValid} onClick={() => onRecord(amount, date, note)}>Record Payment</Button>
        </div>
      </div>
    </div>
  );
};

export const InvoiceDetailModal = ({ invoice, isOpen, onClose, onRecordPayment, userProfile }: { 
  invoice: Invoice | null, 
  isOpen: boolean, 
  onClose: () => void,
  onRecordPayment: (inv: Invoice) => void,
  userProfile: any
}) => {
  if (!isOpen || !invoice) return null;

  const totalPaid = (invoice.payments || []).reduce((acc, p) => acc + p.amount, 0);
  const remaining = invoice.total - totalPaid;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-opex-dark/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-4xl h-full max-h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative z-10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {userProfile.logo ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50">
                <img src={userProfile.logo} alt="Logo" className="w-full h-full object-contain p-2" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-opex-teal/10 text-opex-teal flex items-center justify-center font-black text-xl">
                {userProfile.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">{invoice.id}</h2>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getStatusStyles(getInvoiceStatus(invoice))}`}>
                  {getInvoiceStatus(invoice).label}
                </span>
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{invoice.client}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Download} onClick={() => {
               const logoText = userProfile.logo ? '[LOGO]' : userProfile.name;
               const content = `${logoText}\n\nInvoice ${invoice.id}\nClient: ${invoice.client}\nTotal: €${invoice.total.toLocaleString()}`;
               const blob = new Blob([content], { type: 'text/plain' });
               const url = URL.createObjectURL(blob);
               const a = document.createElement('a');
               a.href = url;
               a.download = `${invoice.id}.pdf`;
               document.body.appendChild(a);
               a.click();
               document.body.removeChild(a);
               URL.revokeObjectURL(url);
            }}>Download PDF</Button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          <div className="grid grid-cols-3 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Issue Date</p>
              <p className="text-sm font-bold text-gray-900">{invoice.issuedDate}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Date</p>
              <p className="text-sm font-bold text-gray-900">{invoice.dueDate}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</p>
              <p className="text-sm font-black text-opex-teal">€{invoice.total.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice Items</h3>
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoice.lineItems.map((item, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 font-bold text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">€{(item.qty * item.unitPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment History</h3>
              {remaining > 0 && (
                <button 
                  onClick={() => onRecordPayment(invoice)}
                  className="text-opex-teal hover:bg-opex-teal/5 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  <Plus size={14} /> Record Payment
                </button>
              )}
            </div>

            {(!invoice.payments || invoice.payments.length === 0) ? (
              <div className="p-8 bg-gray-50 rounded-2xl text-center space-y-4">
                <p className="text-sm font-bold text-gray-400">No payments recorded yet.</p>
                <Button variant="outline" size="sm" onClick={() => onRecordPayment(invoice)}>Record Payment</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {[...(invoice.payments || [])].reverse().map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Check size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">€{p.amount.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.payment_date}</p>
                      </div>
                    </div>
                    {p.note && <p className="text-xs italic text-gray-500 max-w-[200px] truncate">{p.note}</p>}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Paid</p>
                <p className="text-xl font-black text-gray-900">€{totalPaid.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Remaining Balance</p>
                <p className={`text-xl font-black ${remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>€{remaining.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TODAY = new Date('2026-03-03');

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getInvoiceStatus = (inv: Invoice) => {
  if (inv.status === 'Draft') return { label: 'Draft', type: 'draft', urgency: 'none' };
  
  const totalPaid = (inv.payments || []).reduce((acc, p) => acc + p.amount, 0);
  const remaining = inv.total - totalPaid;
  const isPaid = remaining <= 0;
  
  if (isPaid) return { label: 'Paid', type: 'paid', urgency: 'none' };
  
  const dueDate = new Date(inv.dueDate);
  const isOverdue = dueDate < TODAY;
  
  if (totalPaid > 0) {
    return { 
      label: 'Partial', 
      type: 'partial', 
      urgency: isOverdue ? 'high' : 'none',
      isPartial: true,
      isOverdue
    };
  }
  
  if (isOverdue) {
    return { 
      label: 'Overdue', 
      type: 'overdue', 
      urgency: 'high',
      isOverdue: true
    };
  }
  
  const diffTime = dueDate.getTime() - TODAY.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isDueSoon = diffDays <= 7 && diffDays >= 0;
  
  if (isDueSoon) {
    return { 
      label: 'Due Soon', 
      type: 'due-soon', 
      urgency: 'medium'
    };
  }
  
  return { label: 'Sent', type: 'sent', urgency: 'none' };
};

const getStatusStyles = (s: any) => {
  switch (s.type) {
    case 'overdue': return 'text-red-600 bg-red-50';
    case 'due-soon': return 'text-amber-600 bg-amber-50';
    case 'paid': return 'text-gray-400 bg-gray-50';
    case 'draft': return 'text-gray-500 bg-gray-50';
    default: return 'text-blue-600 bg-blue-50';
  }
};

const getUrgencyBorder = (s: any) => {
  if (s.urgency === 'high') return 'border-l-red-500';
  if (s.urgency === 'medium') return 'border-l-amber-500';
  return 'border-l-transparent';
};

const getDueText = (inv: any) => {
  const s = inv.derivedStatus;
  if (s.type === 'paid') return 'Paid';
  if (s.type === 'overdue') {
    const diff = TODAY.getTime() - new Date(inv.dueDate).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `Overdue by ${days}d`;
  }
  const diff = new Date(inv.dueDate).getTime() - TODAY.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Due today';
  return `Due in ${days}d`;
};

const getQuoteStatus = (q: Quote) => {
  if (q.status === 'Draft') return { label: 'Draft', type: 'draft' };
  if (q.status === 'Converted') return { label: 'Converted', type: 'converted' };
  if (q.status === 'Accepted') return { label: 'Accepted', type: 'accepted' };
  if (q.status === 'Rejected') return { label: 'Rejected', type: 'rejected' };
  
  const validUntil = new Date(q.validUntil);
  if (validUntil < TODAY) return { label: 'Expired', type: 'expired' };
  
  return { label: 'Sent', type: 'sent' };
};

export const InvoicingPage = ({ userProfile }: { userProfile: any }) => {
  const [activeTab, setActiveTab] = useState('Invoices');
  const [filter, setFilter] = useState('All');
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
  const [isCreateQuoteModalOpen, setIsCreateQuoteModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [invoiceToRecordPayment, setInvoiceToRecordPayment] = useState<Invoice | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const processedInvoices = useMemo(() => {
    return [].map(inv => ({
      ...inv,
      derivedStatus: getInvoiceStatus(inv)
    }));
  }, []);

  const processedQuotes = useMemo(() => {
    return [].map(q => ({
      ...q,
      derivedStatus: getQuoteStatus(q)
    }));
  }, []);

  const filteredInvoices = useMemo(() => {
    let result = [...processedInvoices];

    // Filter Logic
    if (filter === 'Sent') {
      result = result.filter(inv => inv.derivedStatus.type === 'sent');
    } else if (filter === 'Partial') {
      result = result.filter(inv => {
        const totalPaid = (inv.payments || []).reduce((acc, p) => acc + p.amount, 0);
        return totalPaid > 0 && totalPaid < inv.total;
      });
    } else if (filter === 'Paid') {
      result = result.filter(inv => inv.derivedStatus.type === 'paid');
    } else if (filter === 'Overdue') {
      result = result.filter(inv => inv.derivedStatus.type === 'overdue');
    }

    // Sorting Logic
    result.sort((a, b) => {
      if (filter === 'Paid') {
        return new Date(b.paymentDate || b.issuedDate).getTime() - new Date(a.paymentDate || a.issuedDate).getTime();
      }
      if (filter === 'Overdue') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); // Longest overdue first
      }

      // Default Priority Sorting
      const getPriority = (inv: any) => {
        const s = inv.derivedStatus;
        if (s.type === 'overdue') return 1;
        if (s.type === 'due-soon') return 2;
        if (s.type === 'sent') return 3;
        if (inv.amountPaid > 0 && inv.amountPaid < inv.total && s.urgency === 'none') return 4;
        if (s.type === 'draft') return 5;
        if (s.type === 'paid') return 6;
        return 7;
      };

      const pA = getPriority(a);
      const pB = getPriority(b);

      if (pA !== pB) return pA - pB;

      // Secondary sorting within priority
      if (pA === 1) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (pA === 2 || pA === 3 || pA === 4) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (pA === 5) return new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime();
      if (pA === 6) return new Date(b.paymentDate || b.issuedDate).getTime() - new Date(a.paymentDate || a.issuedDate).getTime();
      
      return 0;
    });

    return result;
  }, [processedInvoices, filter]);

  const filteredQuotes = useMemo(() => {
    let result = [...processedQuotes];

    // Filter Logic
    if (filter === 'Sent') {
      result = result.filter(q => q.derivedStatus.type === 'sent');
    } else if (filter === 'Accepted') {
      result = result.filter(q => q.derivedStatus.type === 'accepted');
    } else if (filter === 'Rejected') {
      result = result.filter(q => q.derivedStatus.type === 'rejected');
    } else if (filter === 'Expired') {
      result = result.filter(q => q.derivedStatus.type === 'expired');
    } else if (filter === 'Converted') {
      result = result.filter(q => q.derivedStatus.type === 'converted');
    }

    // Sorting Logic
    result.sort((a, b) => {
      const getPriority = (q: any) => {
        const s = q.derivedStatus;
        if (s.type === 'sent') return 1;
        if (s.type === 'accepted') return 2;
        if (s.type === 'draft') return 3;
        if (s.type === 'expired') return 4;
        if (s.type === 'rejected') return 5;
        if (s.type === 'converted') return 6;
        return 7;
      };

      const pA = getPriority(a);
      const pB = getPriority(b);

      if (pA !== pB) return pA - pB;

      // Newest first within priority
      return new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime();
    });

    return result;
  }, [processedQuotes, filter]);

  const kpis = useMemo(() => {
    const sentMonth = processedInvoices
      .filter(inv => inv.issuedDate.startsWith('2026-03'))
      .reduce((acc, inv) => acc + inv.total, 0);
    
    const collectedMonth = processedInvoices
      .filter(inv => inv.paymentDate?.startsWith('2026-03'))
      .reduce((acc, inv) => acc + inv.amountPaid, 0);
    
    const openOverdue = processedInvoices
      .filter(inv => inv.derivedStatus.type === 'overdue')
      .reduce((acc, inv) => acc + (inv.total - inv.amountPaid), 0);
    
    const cashExpected = processedInvoices
      .filter(inv => {
        const dueDate = new Date(inv.dueDate);
        const fourteenDaysOut = new Date(TODAY);
        fourteenDaysOut.setDate(TODAY.getDate() + 14);
        return dueDate >= TODAY && dueDate <= fourteenDaysOut && inv.amountPaid < inv.total;
      })
      .reduce((acc, inv) => acc + (inv.total - inv.amountPaid), 0);

    return [
      { title: 'Sent (Month)', value: `€${sentMonth.toLocaleString()}`, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
      { title: 'Collected (Month)', value: `€${collectedMonth.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { title: 'Open Overdue', value: `€${openOverdue.toLocaleString()}`, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', emphasis: true },
      { title: 'Cash Expected (14D)', value: `€${cashExpected.toLocaleString()}`, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];
  }, [processedInvoices]);

  return (
    <div className="relative">
      {/* Coming Soon overlay */}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-3xl pointer-events-auto select-none">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Lock size={28} className="text-gray-400" />
          </div>
          <div>
            <p className="text-lg font-black text-gray-700 tracking-tight">Coming Soon</p>
            <p className="text-sm text-gray-400 font-medium mt-1 max-w-xs">The invoicing module is under development and will be available in a future update.</p>
          </div>
        </div>
      </div>

    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pointer-events-none select-none" style={{ filter: 'blur(3px)', opacity: 0.45 }}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-20">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Revenue</h2>
          <p className="text-sm text-gray-500 font-medium">Manage your quotes and invoices.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button icon={Plus} onClick={() => activeTab === 'Invoices' ? setIsCreateInvoiceModalOpen(true) : setIsCreateQuoteModalOpen(true)}>
            {activeTab === 'Invoices' ? 'Create Invoice' : 'Create Quote'}
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div 
            key={i} 
            className={`p-5 rounded-[2rem] border shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md ${
              kpi.emphasis 
                ? 'bg-opex-dark border-opex-dark text-white' 
                : 'bg-white border-gray-100 text-gray-900'
            }`}
          >
            <div className="flex justify-between items-start relative z-10">
              <div className={`p-2 rounded-xl ${kpi.emphasis ? 'bg-white/10 text-white' : `${kpi.bg} ${kpi.color}`}`}>
                <kpi.icon size={18} />
              </div>
              <Info size={14} className={kpi.emphasis ? 'text-white/40' : 'text-gray-300'} />
            </div>
            <div className="relative z-10 mt-4">
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${kpi.emphasis ? 'text-white/60' : 'text-gray-400'}`}>
                {kpi.title}
              </p>
              <p className="text-2xl font-black tracking-tight">{kpi.value}</p>
            </div>
            {kpi.emphasis && (
              <div className="absolute top-0 right-0 p-8 bg-white/5 rounded-full translate-x-4 -translate-y-4 blur-xl"></div>
            )}
          </div>
        ))}
      </div>

      {/* Tabs & Filters */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <ToggleFilter options={['Invoices', 'Quotes']} active={activeTab} onChange={(val) => { setActiveTab(val); setFilter('All'); }} />
          {activeTab === 'Invoices' ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              {['All', 'Sent', 'Partial', 'Paid', 'Overdue'].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilter(p)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    filter === p 
                      ? 'bg-opex-teal text-white shadow-sm' 
                      : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              {['All', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted'].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilter(p)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    filter === p 
                      ? 'bg-opex-teal text-white shadow-sm' 
                      : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        <Card noPadding className="overflow-hidden border-gray-100 shadow-sm min-h-[400px]">
          {activeTab === 'Invoices' ? (
            [].length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                  <FileText size={32} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">No invoices yet</p>
                  <p className="text-sm text-gray-500">Start by creating your first invoice.</p>
                </div>
                <Button icon={Plus} onClick={() => setIsCreateInvoiceModalOpen(true)}>Create Invoice</Button>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-sm font-medium text-gray-500">No invoices match this filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-widest border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Client & Urgency</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Issued</th>
                      <th className="px-6 py-4">Due / Overdue</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredInvoices.map((inv) => (
                      <tr 
                        key={inv.id} 
                        className={`hover:bg-gray-50/80 transition-colors group border-l-4 cursor-pointer ${getUrgencyBorder(inv.derivedStatus)}`}
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        <td className="px-6 py-5">
                          <p className="font-bold text-gray-900">{inv.client}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{inv.id}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getStatusStyles(inv.derivedStatus)}`}>
                              {inv.derivedStatus.label}
                            </span>
                            {inv.derivedStatus.isPartial && (
                              <p className="text-[10px] text-gray-400 font-bold">
                                Paid €{(inv.payments || []).reduce((acc, p) => acc + p.amount, 0).toLocaleString()} of €{inv.total.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-gray-500 font-medium">{formatDate(inv.issuedDate)}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className={inv.derivedStatus.type === 'overdue' ? 'text-red-500' : 'text-gray-400'} />
                            <span className={`font-bold ${inv.derivedStatus.type === 'overdue' ? 'text-red-600' : 'text-gray-600'}`}>
                              {inv.derivedStatus.type === 'paid' ? `Paid on ${formatDate(inv.paymentDate || inv.issuedDate)}` : getDueText(inv)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <p className="text-base font-black text-gray-900">€{inv.total.toLocaleString()}</p>
                        </td>
                        <td className="pr-6 py-5 text-right">
                          <button 
                            className="p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (['sent', 'partial', 'overdue'].includes(inv.derivedStatus.type)) {
                                setInvoiceToRecordPayment(inv);
                                setIsRecordPaymentModalOpen(true);
                              }
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            [].length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                  <FileText size={32} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">No quotes yet</p>
                  <p className="text-sm text-gray-500">Start by creating your first quote.</p>
                </div>
                <Button icon={Plus} onClick={() => setIsCreateQuoteModalOpen(true)}>Create Quote</Button>
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-sm font-medium text-gray-500">No quotes match this filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-widest border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Issued</th>
                      <th className="px-6 py-4">Valid Until</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredQuotes.map((q) => (
                      <tr 
                        key={q.id} 
                        className="group hover:bg-gray-50/80 transition-colors cursor-pointer"
                        onClick={() => setSelectedQuote(q)}
                      >
                        <td className="px-6 py-5">
                          <p className="font-bold text-gray-900">{q.client}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{q.id}</p>
                        </td>
                        <td className="px-6 py-5">
                          <Badge className={
                            q.derivedStatus.type === 'sent' ? 'text-blue-600 bg-blue-50' :
                            q.derivedStatus.type === 'accepted' ? 'text-emerald-600 bg-emerald-50' :
                            q.derivedStatus.type === 'rejected' ? 'text-red-600 bg-red-50' :
                            q.derivedStatus.type === 'expired' ? 'text-gray-400 bg-gray-50' :
                            q.derivedStatus.type === 'converted' ? 'text-gray-400 bg-gray-50 border-dashed border-gray-200' :
                            'text-gray-500 bg-gray-50'
                          }>
                            {q.derivedStatus.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-5 text-gray-500 font-medium">{formatDate(q.issuedDate)}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className={q.derivedStatus.type === 'expired' ? 'text-red-500' : 'text-gray-400'} />
                            <span className={`font-bold ${q.derivedStatus.type === 'expired' ? 'text-red-600' : 'text-gray-600'}`}>
                              {q.derivedStatus.type === 'expired' ? 'Expired' : `Valid until ${formatDate(q.validUntil)}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <p className="text-base font-black text-gray-900">€{q.total.toLocaleString()}</p>
                        </td>
                        <td className="pr-6 py-5 text-right">
                          <button className="p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </Card>
      </div>

      {/* Modals */}
      <CreateInvoiceModal isOpen={isCreateInvoiceModalOpen} onClose={() => setIsCreateInvoiceModalOpen(false)} userProfile={userProfile} />
      <CreateQuoteModal isOpen={isCreateQuoteModalOpen} onClose={() => setIsCreateQuoteModalOpen(false)} userProfile={userProfile} />
      <InvoiceDetailModal 
        invoice={selectedInvoice} 
        isOpen={!!selectedInvoice} 
        onClose={() => setSelectedInvoice(null)}
        userProfile={userProfile}
        onRecordPayment={(inv) => {
          setInvoiceToRecordPayment(inv);
          setIsRecordPaymentModalOpen(true);
        }}
      />
      <RecordPaymentModal 
        invoice={invoiceToRecordPayment} 
        isOpen={isRecordPaymentModalOpen} 
        onClose={() => setIsRecordPaymentModalOpen(false)}
        onRecord={(amount, _date, _note) => {
          if (invoiceToRecordPayment) {
            const totalPaid = (invoiceToRecordPayment.payments || []).reduce((acc, p) => acc + p.amount, 0);
            const isFull = (totalPaid + amount) >= invoiceToRecordPayment.total;
            
            setToast(isFull ? "Invoice fully paid." : "Payment recorded.");
            setIsRecordPaymentModalOpen(false);
            // In a real app we'd update state here
          }
        }}
      />
      <QuoteDetailModal 
        quote={selectedQuote} 
        isOpen={!!selectedQuote} 
        onClose={() => setSelectedQuote(null)}
        userProfile={userProfile}
        onStatusChange={(_id, status) => {
          if (selectedQuote) {
            setSelectedQuote({ ...selectedQuote, status });
          }
        }}
        onConvert={(q) => {
          setSelectedQuote(null);
          setToast(`Quote ${q.id} successfully converted to Invoice INV-2026-042`);
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-opex-dark text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check size={14} />
            </div>
            <p className="text-sm font-bold">{toast}</p>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};



export const OnboardingPage = ({
  userProfile,
  legalPublicInfo,
  onComplete
}: {
  userProfile: UserProfile;
  legalPublicInfo: LegalPublicInfoRecord | null;
  onComplete: (profile: UserProfile) => Promise<void>;
}) => {
  const requiresRenewedConsent = Boolean(
    legalPublicInfo && userProfile.gdprAccepted && (
      userProfile.privacyPolicyVersion !== legalPublicInfo.privacyPolicy.version ||
      userProfile.termsOfServiceVersion !== legalPublicInfo.termsOfService.version
    )
  );
  const [stepIndex, setStepIndex] = useState(requiresRenewedConsent ? ONBOARDING_QUESTION_STEPS.length : 0);
  const [lastQuestionStepIndex, setLastQuestionStepIndex] = useState(0);
  const [fullName, setFullName] = useState(userProfile.name ?? '');
  const [residence, setResidence] = useState(userProfile.residence ?? '');
  const [occupation, setOccupation] = useState(userProfile.answer3 ?? '');
  const [privacyAccepted, setPrivacyAccepted] = useState(
    Boolean(legalPublicInfo) && userProfile.privacyPolicyVersion === legalPublicInfo?.privacyPolicy.version
  );
  const [termsAccepted, setTermsAccepted] = useState(
    Boolean(legalPublicInfo) && userProfile.termsOfServiceVersion === legalPublicInfo?.termsOfService.version
  );
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isPrivacyStep = stepIndex >= ONBOARDING_QUESTION_STEPS.length;
  const currentQuestion = ONBOARDING_QUESTION_STEPS[Math.min(stepIndex, ONBOARDING_QUESTION_STEPS.length - 1)];
  const progressValue = isPrivacyStep
    ? 100
    : Math.min(100, (currentQuestion.step / ONBOARDING_QUESTION_STEPS.length) * 100);
  const CurrentIcon = isPrivacyStep ? ShieldCheck : currentQuestion.icon;

  const currentValue = currentQuestion.field === 'fullName'
    ? fullName
    : currentQuestion.field === 'residence'
      ? residence
      : occupation;

  useEffect(() => {
    if (!requiresRenewedConsent) {
      return;
    }

    setStepIndex(ONBOARDING_QUESTION_STEPS.length);
  }, [requiresRenewedConsent]);

  useEffect(() => {
    setPrivacyAccepted(Boolean(legalPublicInfo) && userProfile.privacyPolicyVersion === legalPublicInfo?.privacyPolicy.version);
    setTermsAccepted(Boolean(legalPublicInfo) && userProfile.termsOfServiceVersion === legalPublicInfo?.termsOfService.version);
  }, [legalPublicInfo, userProfile.privacyPolicyVersion, userProfile.termsOfServiceVersion]);

  const setCurrentValue = (value: string) => {
    if (currentQuestion.field === 'fullName') {
      setFullName(value);
      return;
    }
    if (currentQuestion.field === 'residence') {
      setResidence(value);
      return;
    }
    setOccupation(value);
  };

  const handleNext = () => {
    setFormError(null);
    setLastQuestionStepIndex(Math.min(stepIndex, ONBOARDING_QUESTION_STEPS.length - 1));
    setStepIndex((currentStep) => Math.min(currentStep + 1, ONBOARDING_QUESTION_STEPS.length));
  };

  const handleBack = () => {
    setFormError(null);
    if (isPrivacyStep) {
      setStepIndex(lastQuestionStepIndex);
      return;
    }
    setStepIndex((currentStep) => Math.max(currentStep - 1, 0));
  };

  const handleSkip = () => {
    setFormError(null);
    setLastQuestionStepIndex(stepIndex);
    setStepIndex(ONBOARDING_QUESTION_STEPS.length);
  };

  const handleComplete = async () => {
    if (!legalPublicInfo) {
      setFormError('Legal documents are still loading. Retry in a moment.');
      return;
    }

    if (!privacyAccepted || !termsAccepted) {
      setFormError('You must accept the privacy notice and terms of service before continuing.');
      return;
    }

    const nextName = toOptionalText(fullName) ?? userProfile.name;
    const nextResidence = toOptionalText(residence) ?? userProfile.residence;
    const nextProfile: UserProfile = {
      ...userProfile,
      name: nextName,
      residence: nextResidence,
      gdprAccepted: true,
      answer1: toOptionalText(fullName) ?? userProfile.answer1 ?? null,
      answer2: toOptionalText(residence) ?? userProfile.answer2 ?? null,
      answer3: toOptionalText(occupation) ?? userProfile.answer3 ?? null
    };

    setIsSaving(true);
    setFormError(null);

    try {
      await onComplete(nextProfile);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unexpected error while saving onboarding details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f3] px-6 py-8 md:px-10 md:py-12 text-gray-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col justify-center">
        <div className="mb-12 flex items-center justify-between gap-4">
          <div className="w-full">
            <div className="mb-3 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.24em] text-opex-dark/80">
              <span>{isPrivacyStep ? 'Final Step' : `Step ${currentQuestion.step} of 3`}</span>
              {!isPrivacyStep && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-gray-400 transition-colors hover:text-opex-dark"
                  disabled={isSaving}
                >
                  Skip
                </button>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className="h-full rounded-full bg-opex-dark transition-all duration-300"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>
        </div>

        <div className="max-w-3xl">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-slate-200/70 text-opex-dark shadow-sm">
            <CurrentIcon size={30} />
          </div>

          {isPrivacyStep ? (
            <>
              <h1 className="max-w-2xl text-4xl font-black tracking-tight text-opex-dark md:text-5xl">
                {requiresRenewedConsent ? 'We updated our legal terms.' : 'Before you continue, review the legal terms.'}
              </h1>
              <p className="mt-4 max-w-2xl text-lg font-medium leading-relaxed text-slate-500 md:text-xl">
                {requiresRenewedConsent
                  ? 'Your account already exists, but you need to accept the latest legal versions before continuing.'
                  : 'We need your acceptance of the privacy notice and service terms before activating your workspace. Manual accounts remain available even if you never connect a bank.'}
              </p>

              <div className="mt-12 space-y-4 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-sm md:p-8">
                <label className="flex cursor-pointer items-start gap-4">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(event) => {
                      setPrivacyAccepted(event.target.checked);
                      if (formError) {
                        setFormError(null);
                      }
                    }}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-opex-dark focus:ring-opex-dark"
                    disabled={isSaving}
                  />
                  <span className="space-y-1">
                    <span className="block text-base font-black text-gray-900">
                      I accept the Privacy Notice v{legalPublicInfo?.privacyPolicy.version || 'current'}.
                    </span>
                    <span className="block text-sm font-medium leading-relaxed text-slate-500">
                      This covers how Opex processes profile, workspace and optional financial data for the service.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-4">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => {
                      setTermsAccepted(event.target.checked);
                      if (formError) {
                        setFormError(null);
                      }
                    }}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-opex-dark focus:ring-opex-dark"
                    disabled={isSaving}
                  />
                  <span className="space-y-1">
                    <span className="block text-base font-black text-gray-900">
                      I accept the Terms of Service v{legalPublicInfo?.termsOfService.version || 'current'}.
                    </span>
                    <span className="block text-sm font-medium leading-relaxed text-slate-500">
                      This includes the core rules for using Opex, optional third-party integrations and account termination.
                    </span>
                  </span>
                </label>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => openLegalDocument('privacy')}
                    className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition-colors hover:border-slate-300 hover:text-opex-dark"
                    disabled={isSaving}
                  >
                    Open Privacy Notice
                  </button>
                  <button
                    type="button"
                    onClick={() => openLegalDocument('terms')}
                    className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition-colors hover:border-slate-300 hover:text-opex-dark"
                    disabled={isSaving}
                  >
                    Open Terms
                  </button>
                  <button
                    type="button"
                    onClick={() => openLegalDocument('cookies')}
                    className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition-colors hover:border-slate-300 hover:text-opex-dark"
                    disabled={isSaving}
                  >
                    Open Cookie Notice
                  </button>
                </div>

                <div className="rounded-[1.5rem] bg-slate-50 px-5 py-4 text-sm font-medium leading-relaxed text-slate-500">
                  You can review policy versions, export your data or close the account later in <span className="font-black text-opex-dark">Settings &gt; Data &amp; Privacy</span>.
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="max-w-2xl text-4xl font-black tracking-tight text-opex-dark md:text-5xl">
                {currentQuestion.title}
              </h1>
              <p className="mt-4 max-w-2xl text-lg font-medium leading-relaxed text-slate-500 md:text-xl">
                {currentQuestion.description}
              </p>

              <div className="mt-14 max-w-3xl">
                <label className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
                  {currentQuestion.fieldLabel}
                </label>
                <input
                  type="text"
                  value={currentValue}
                  onChange={(event) => {
                    setCurrentValue(event.target.value);
                    if (formError) {
                      setFormError(null);
                    }
                  }}
                  placeholder={currentQuestion.placeholder}
                  className="mt-4 w-full border-0 border-b-2 border-slate-200 bg-transparent px-0 pb-5 text-3xl font-black text-opex-dark placeholder:text-slate-300 focus:border-opex-dark focus:outline-none focus:ring-0"
                  disabled={isSaving}
                />
              </div>
            </>
          )}

          {formError && (
            <p className="mt-8 text-sm font-bold text-red-600">{formError}</p>
          )}

          <div className="mt-12 flex flex-col-reverse gap-4 sm:flex-row sm:items-center">
            {!requiresRenewedConsent && (stepIndex > 0 || isPrivacyStep) && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-14 items-center justify-center rounded-[1.3rem] border border-slate-200 bg-white px-6 text-sm font-black text-slate-500 transition-colors hover:border-slate-300 hover:text-opex-dark disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving}
              >
                Back
              </button>
            )}

            <button
              type="button"
              onClick={isPrivacyStep ? () => void handleComplete() : handleNext}
              className="inline-flex h-16 flex-1 items-center justify-center rounded-[1.3rem] bg-opex-dark px-8 text-base font-black text-white shadow-[0_20px_40px_-20px_rgba(12,33,49,0.55)] transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : isPrivacyStep ? (requiresRenewedConsent ? 'Accept and Continue' : 'Enter Opex') : currentQuestion.ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DashboardPage = ({
  onNavigate,
  userName,
  transactions,
  selectedProviderName,
  aggregatedSummary,
  isLoading,
  onRefresh
}: {
  onNavigate: (tab: string) => void;
  userName: string;
  transactions: TransactionRecord[];
  selectedProviderName: string | null;
  aggregatedSummary: {
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
  };
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}) => {
  const [spendingFilter, setSpendingFilter] = useState('Week');
  const [monthlyInsightIndex, setMonthlyInsightIndex] = useState(0);

  const getChartData = (filter: string) => {
    switch (filter) {
      case 'Week': return { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [420, 780, 360, 540, 960, 300, 660] };
      case 'Month': return { labels: ['W1', 'W2', 'W3', 'W4'], values: [1850, 1200, 2100, 1550] };
      case 'Year': return { labels: ['Q1', 'Q2', 'Q3', 'Q4'], values: [14200, 11500, 18500, 15200] };
      default: return { labels: ['M','T','W','T','F','S','S'], values: [500, 500, 500, 500, 500, 500, 500] };
    }
  };

  const { labels, values } = getChartData(spendingFilter);
  const maxValue = Math.max(...values, 1);
  const firstName = userName.split(' ')[0] || 'there';

  const totalBalance = Number(aggregatedSummary.totalBalance || 0);
  const totalIncome = Number(aggregatedSummary.totalIncome || 0);
  const totalExpenses = Number(aggregatedSummary.totalExpenses || 0);
  const monthlyInsightSeed = useMemo(() => {
    if (MONTHLY_INSIGHT_MESSAGES.length === 0) {
      return 0;
    }

    const today = new Date();
    const dateSeed = Number(
      `${today.getUTCFullYear()}${String(today.getUTCMonth() + 1).padStart(2, '0')}${String(today.getUTCDate()).padStart(2, '0')}`
    );
    const metricSeed =
      transactions.length
      + Math.round(totalBalance)
      + Math.round(totalIncome)
      + Math.round(Math.abs(totalExpenses));

    return Math.abs(dateSeed + metricSeed) % MONTHLY_INSIGHT_MESSAGES.length;
  }, [transactions.length, totalBalance, totalIncome, totalExpenses]);

  const recentTransactions = useMemo(
    () =>
      transactions
        .map((transaction) => {
          const amount = Number(transaction.amount ?? 0);
          const isIncome = amount >= 0;
          return {
            id: transaction.id,
            name: transaction.merchantName || transaction.description || transaction.category || 'Transaction',
            category: transaction.category || (isIncome ? 'Income' : 'Expense'),
            amount,
            icon: isIncome ? 'IN' : 'OUT',
            color: isIncome ? 'bg-emerald-500' : 'bg-opex-dark',
            bookingDate: transaction.bookingDate || ''
          };
        })
        .sort((a, b) => b.bookingDate.localeCompare(a.bookingDate))
        .slice(0, 8),
    [transactions]
  );

  useEffect(() => {
    setMonthlyInsightIndex(monthlyInsightSeed);
  }, [monthlyInsightSeed]);

  useEffect(() => {
    if (isLoading || MONTHLY_INSIGHT_MESSAGES.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setMonthlyInsightIndex((currentIndex) => (currentIndex + 1) % MONTHLY_INSIGHT_MESSAGES.length);
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [isLoading]);

  const activeMonthlyInsight = MONTHLY_INSIGHT_MESSAGES[monthlyInsightIndex] ?? MONTHLY_INSIGHT_MESSAGES[0];
  const monthlyInsightAreaClass = MONTHLY_INSIGHT_AREA_CLASS[activeMonthlyInsight?.area ?? 'Insight'] ?? 'text-white';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 relative z-20">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Overview</h2>
          <p className="text-sm text-gray-500">
            Welcome back, {firstName}. {isLoading ? 'Syncing latest data...' : "Here's what's happening today."}{' '}
            {!isLoading && (
              <span className="font-bold">
                {selectedProviderName ? `Provider: ${selectedProviderName}` : 'Provider: All'}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AccountSelector />
          <QuickActions onNavigate={onNavigate} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-opex-dark to-slate-800 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full translate-x-10 -translate-y-10 blur-3xl"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="relative">
            {/* Coming Soon overlay for Monthly Insight */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl pointer-events-auto select-none">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full">
                <Lock size={13} className="text-white/70" />
                <span className="text-xs font-black text-white/80 uppercase tracking-widest">Coming Soon</span>
              </div>
            </div>
            <div className="pointer-events-none select-none" style={{ filter: 'blur(4px)', opacity: 0.35 }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">Monthly Insight</span>
              {!isLoading && activeMonthlyInsight && (
                <span className={`bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${monthlyInsightAreaClass}`}>
                  <Sparkles size={14} /> {activeMonthlyInsight.area}
                </span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold leading-tight max-w-lg mb-4">
              {isLoading
                ? 'Waiting for backend synchronization...'
                : activeMonthlyInsight?.name ?? 'Monthly insight unavailable.'}
            </h2>
            <p className="text-gray-400 text-sm max-w-sm">
              {isLoading
                ? 'The dashboard is waiting for the latest backend data before generating an insight.'
                : activeMonthlyInsight?.description ?? 'No insight available right now.'}
            </p>
            </div>
          </div>
          <div className="lg:text-right bg-white/10 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-white/5 flex flex-col items-start lg:items-end justify-center">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
              <Wallet size={14} /> Total Balance
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-bold tracking-tight">
                {isLoading ? '...' : formatCurrency(totalBalance)}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full text-green-300 text-xs font-bold border border-green-500/30">
              <ArrowUpRight size={14} /> Live backend data
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ClickableStat 
          title="Total Income" 
          amount={Math.round(totalIncome).toLocaleString('it-IT')}
          trend={isLoading ? 'sync...' : 'month'}
          icon={ArrowUp} 
          trendUp={true}
          onClick={() => onNavigate('INCOME')}
        />
        <ClickableStat 
          title="Total Expenses" 
          amount={Math.round(totalExpenses).toLocaleString('it-IT')}
          trend={isLoading ? 'sync...' : 'month'}
          icon={TrendingDown} 
          trendUp={false}
          onClick={() => onNavigate('EXPENSES')}
        />
        <RecurringWidget onClick={() => onNavigate('RECURRING')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card 
            title="Spending Trend" 
            action={<ToggleFilter options={['Week', 'Month', 'Year']} active={spendingFilter} onChange={setSpendingFilter} />}
          >
             <div className="h-56 flex items-end justify-between gap-3 px-2 mt-4 relative">
                {values.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group relative h-full">
                    <div className="w-full flex-1 flex items-end relative">
                      <div className="w-full h-full bg-gray-50 rounded-t-lg absolute bottom-0 opacity-40"></div>
                      <div 
                        className="w-full bg-opex-teal rounded-t-lg transition-all duration-700 ease-out group-hover:bg-opex-dark relative"
                        style={{ height: `${(v / maxValue) * 100}%` }}
                      >
                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                            €{v.toLocaleString()}
                         </div>
                      </div>
                    </div>
                    <div className="mt-3 text-[10px] text-gray-400 font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full text-center shrink-0">
                        {labels[i]}
                    </div>
                  </div>
                ))}
             </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card 
            title="Recent Activity" 
            action={
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => void onRefresh()}>
                  Sync
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('[]')}>
                  View All
                </Button>
              </div>
            }
            noPadding
          >
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                    <tr>
                        <th className="p-4">Transaction</th>
                        <th className="p-4">Category</th>
                        <th className="p-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => onNavigate('[]')}>
                          <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>{t.icon}</div>
                                <span className="font-medium text-gray-900 truncate max-w-[120px]">{t.name}</span>
                              </div>
                          </td>
                          <td className="p-4"><Badge>{t.category}</Badge></td>
                          <td className={`p-4 text-right font-bold ${t.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                              {t.amount > 0 ? '+' : ''}€{Math.abs(t.amount).toLocaleString()}
                          </td>
                        </tr>
                    ))}
                    {recentTransactions.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-sm text-gray-500 font-medium">
                          No synchronized activity yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
               </table>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

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
  const clientConcentration = 62; // Example value for conditional rendering
  const totalBalance = Number(aggregatedSummary.totalBalance || 0);
  const totalIncome = Number(aggregatedSummary.totalIncome || 0);
  const totalExpenses = Number(aggregatedSummary.totalExpenses || 0);
  const safeToSpend = totalBalance - totalExpenses;
  const monthlyBurn = Math.max(totalExpenses, 1);
  const runwayMonths = totalBalance / monthlyBurn;
  const runwayProgress = Math.max(0, Math.min((runwayMonths / 3) * 100, 100));

  // Color thresholds for Client Risk
  const getRiskStyles = (val: number) => {
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
          <div className="lg:col-span-4">
            <div className={`${risk.bg} rounded-[2rem] p-5 border ${risk.border} h-full flex flex-col justify-center`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${risk.iconBg} flex items-center justify-center ${risk.iconText}`}>
                    <AlertTriangle size={20} />
                  </div>
                  <p className={`text-[10px] font-black ${risk.iconText} uppercase tracking-widest`}>Client Risk</p>
                </div>
                <Badge variant={risk.badge as any}>{risk.label}</Badge>
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



const resizeImageToBase64 = (file: File, maxPx = 512, quality = 0.82): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.onload = () => {
      const src = reader.result as string;
      const img = new window.Image();
      img.onerror = () => reject(new Error('Image failed to load'));
      img.onload = () => {
        try {
          const longest = Math.max(img.width, img.height, 1);
          const scale = Math.min(1, maxPx / longest);
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Canvas unavailable')); return; }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (err) {
          reject(err);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });

export const EditProfilePage = ({
  userProfile,
  setUserProfile,
  onBack,
  onSaveProfile
}: {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  onBack: () => void;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
}) => {
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [residence, setResidence] = useState(userProfile.residence);
  const [vatFrequency, setVatFrequency] = useState(userProfile.vatFrequency);
  const [logo, setLogo] = useState<string | null>(userProfile.logo ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeImageToBase64(file);
      setLogo(base64);
      setSaveError(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not process the image. Try a different file.');
    }
    // reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleSave = async () => {
    setIsSaving(true);
    const nextProfile: UserProfile = { ...userProfile, name, email, residence, vatFrequency, logo };
    setSaveError(null);

    try {
      setUserProfile(nextProfile);
      await onSaveProfile(nextProfile);
      onBack();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <SubpageShell onBack={onBack} title="Edit Profile">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card title="Account Details">
          <div className="space-y-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-opex-teal/10 flex items-center justify-center">
                  {logo
                    ? <img src={logo} alt="Avatar" className="w-full h-full object-cover" />
                    : <span className="text-3xl font-black text-opex-teal select-none">{initials}</span>
                  }
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-opex-teal text-white p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"
                >
                  <Camera size={20} />
                </button>
                {logo && (
                  <button
                    type="button"
                    onClick={() => setLogo(null)}
                    className="absolute -top-2 -right-2 bg-white border border-gray-200 text-gray-400 hover:text-red-500 p-1.5 rounded-xl shadow-md hover:scale-110 active:scale-95 transition-all"
                    title="Remove photo"
                  >
                    <X size={14} />
                  </button>
                )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => void handleAvatarChange(e)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Display Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Legal Residence</label>
                <select value={residence} onChange={e => setResidence(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none appearance-none">
                  <option>Netherlands (NL)</option>
                  <option>Italy (IT)</option>
                  <option>Germany (DE)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">VAT Return Frequency</label>
                <select
                  value={vatFrequency}
                  onChange={e => setVatFrequency(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-opex-teal/10 outline-none appearance-none"
                >
                  <option>Monthly</option>
                  <option>Quarterly</option>
                  <option>Yearly</option>
                </select>
                <p className="text-xs text-gray-400 font-medium">Used to generate Dutch VAT deadlines in Taxes.</p>
              </div>
            </div>
            <div className="pt-4">
              <Button fullWidth size="lg" icon={Check} onClick={() => void handleSave()} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              {saveError && <p className="mt-3 text-sm text-red-600 font-medium">{saveError}</p>}
            </div>
          </div>
        </Card>
      </div>
    </SubpageShell>
  );
};

export const RenewConsentPage = ({ onBack }: { onBack: () => void }) => {
  return (
    <SubpageShell onBack={onBack} title="Renew Consent">
      <div className="max-w-xl mx-auto text-center space-y-10 py-10">
        <div className="w-24 h-24 bg-orange-100 rounded-[2rem] flex items-center justify-center text-orange-500 mx-auto shadow-inner">
          <RefreshCw size={48} className="animate-spin-slow" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Renew Rabobank</h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            To continue receiving your real-time data, Rabobank requires a renewal of the Open Banking authorization every 90 days.
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-left space-y-4">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <p className="text-xs font-bold text-gray-700">Access to transaction history</p>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <p className="text-xs font-bold text-gray-700">Real-time balance synchronization</p>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <p className="text-xs font-bold text-gray-700">Account identity information</p>
           </div>
        </div>
        <div className="flex flex-col gap-4">
           <Button size="lg" variant="secondary" fullWidth className="py-5 text-lg shadow-xl shadow-teal-900/10">Proceed to Bank Portal</Button>
           <button onClick={onBack} className="text-sm font-bold text-gray-400 hover:text-gray-600">Cancel and back to settings</button>
        </div>
      </div>
    </SubpageShell>
  );
};

export const ChangePasswordPage = ({ onBack }: { onBack: () => void }) => {
  return (
    <SubpageShell onBack={onBack} title="Change Password">
      <div className="max-w-lg mx-auto space-y-8">
        <Card title="Account Security">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Password</label>
              <input type="password" placeholder="••••••••" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Password</label>
              <input type="password" placeholder="Minimum 8 characters" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirm New Password</label>
              <input type="password" placeholder="Repeat password" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none" />
            </div>
            <div className="pt-4 flex flex-col gap-4">
               <Button fullWidth size="lg" icon={Lock} onClick={onBack}>Update Password</Button>
               <div className="p-4 bg-blue-50 rounded-xl flex gap-3 items-start">
                  <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-700 leading-relaxed font-medium">You will be logged out from all other devices after changing your password.</p>
               </div>
            </div>
          </div>
        </Card>
      </div>
    </SubpageShell>
  );
};

export const CategoriesPage = ({ onBack }: { onBack: () => void }) => {
  const initialCategories = [
    { id: 1, name: 'Shopping', icon: ShoppingBag, color: 'bg-purple-100 text-purple-600' },
    { id: 2, name: 'Transport', icon: Car, color: 'bg-blue-100 text-blue-600' },
    { id: 3, name: 'Rent & Home', icon: Home, color: 'bg-emerald-100 text-emerald-600' },
    { id: 4, name: 'Restaurants', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
    { id: 5, name: 'Subscriptions', icon: Layers, color: 'bg-indigo-100 text-indigo-600' },
    { id: 6, name: 'Coffee', icon: Coffee, color: 'bg-amber-100 text-amber-700' },
  ];

  return (
    <SubpageShell onBack={onBack} title="Category Management" actions={<Button size="sm" icon={Plus}>New</Button>}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search category..." className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {initialCategories.map(cat => (
            <div key={cat.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-opex-teal/20 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center`}>
                  <cat.icon size={24} />
                </div>
                <span className="font-bold text-gray-800">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"><Edit2 size={16} /></button>
                <button className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>

        <Card className="bg-gray-50 border-none">
           <div className="flex flex-col items-center text-center py-6 gap-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-opex-teal shadow-sm"><Sparkles size={24} /></div>
              <div>
                 <h4 className="font-black text-gray-900">AI Auto-Categorization</h4>
                 <p className="text-xs text-gray-500 max-w-sm mt-1">The Opex assistant learns from your habits. The more you customize categories, the more precise the Insights will be.</p>
              </div>
           </div>
        </Card>
      </div>
    </SubpageShell>
  );
};

export const NotificationDetailsPage = ({ onBack }: { onBack: () => void }) => {
  const [balanceThreshold, setBalanceThreshold] = useState("500");

  const sections = [
    {
      title: 'Transactions & Balance',
      items: [
        { label: 'Critical Balance', desc: 'Sends an alert when you drop below the set threshold.', enabled: true },
        { label: 'Significant Income', desc: 'Notify whenever you receive a transfer > €100.', enabled: true },
        { label: 'Abnormal Outflow', desc: 'Identify suspicious transactions or duplicates.', enabled: true },
      ]
    },
    {
      title: 'Open Banking',
      items: [
        { label: 'Consent Expiration', desc: 'Receive reminders 7 and 2 days before bank disconnection.', enabled: true },
        { label: 'Sync Errors', desc: 'Immediate alert if a bank requires reconnection.', enabled: false },
      ]
    },
    {
      title: 'Tax & Deadlines',
      items: [
        { label: 'Quarterly VAT', desc: 'Reminder 10 days before the payment deadline.', enabled: true },
        { label: 'Monthly Analysis', desc: 'Summary report of the performance of the month just ended.', enabled: false },
      ]
    }
  ];

  return (
    <SubpageShell onBack={onBack} title="Notification Details">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card title="Custom Thresholds" action={<Sliders size={18} className="text-gray-400" />}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-gray-700">Low Balance Notification (€)</label>
              <input 
                type="number" 
                value={balanceThreshold} 
                onChange={(e) => setBalanceThreshold(e.target.value)}
                className="w-24 p-2 bg-gray-50 border-none rounded-xl text-right font-black text-opex-teal focus:ring-2 focus:ring-opex-teal/10 outline-none" 
              />
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
               <div className="bg-opex-teal h-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">You will receive a push and in-app notification when the total of your accounts drops below this amount.</p>
          </div>
        </Card>

        {sections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">{section.title}</h3>
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
              {section.items.map((item, i) => (
                <div key={i} className="p-6 flex items-center justify-between group">
                  <div className="space-y-1">
                    <p className="text-sm font-black text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500 leading-relaxed max-sm:max-w-sm">{item.desc}</p>
                  </div>
                  <button className={`w-14 h-7 rounded-full relative transition-all ${item.enabled ? 'bg-opex-teal shadow-lg shadow-teal-900/20' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${item.enabled ? 'left-8' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4">
           <Button fullWidth size="lg" icon={Check} onClick={onBack}>Apply Configurations</Button>
        </div>
      </div>
    </SubpageShell>
  );
};

export const SupportPage = ({ onBack }: { onBack: () => void }) => {
  return (
    <SubpageShell onBack={onBack} title="Support & Help">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
           <h3 className="text-2xl font-black text-gray-900 tracking-tight">How can we help?</h3>
           <Card title="Report a Bug / Feedback" action={<MessageSquare size={18} className="text-gray-400" />}>
              <div className="space-y-4">
                 <textarea placeholder="Describe the issue or suggest a feature..." className="w-full h-32 p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-opex-teal/10 outline-none resize-none"></textarea>
                 <div className="flex gap-4">
                    <button className="flex-1 p-4 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-2 text-gray-400 hover:bg-gray-50 transition-all">
                       <Upload size={20} />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Screenshot</span>
                    </button>
                    <button className="flex-1 p-4 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-2 text-gray-400 hover:bg-gray-50 transition-all">
                       <Camera size={20} />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Photo</span>
                    </button>
                 </div>
                 <Button fullWidth icon={ArrowUpRight}>Send Request</Button>
              </div>
           </Card>
        </div>
        <div className="space-y-6">
           <h3 className="text-2xl font-black text-gray-900 tracking-tight">Popular FAQs</h3>
           <div className="space-y-4">
              {[
                "How do I link a foreign bank?",
                "Can I export in Excel format?",
                "How is the tax buffer calculated?",
                "Are my data safe?",
                "What are the limits of the free plan?"
              ].map((q, i) => (
                <div key={i} className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-opex-teal transition-all">
                   <span className="text-sm font-bold text-gray-700">{q}</span>
                   <ChevronRight size={18} className="text-gray-300 group-hover:text-opex-teal group-hover:translate-x-1 transition-all" />
                </div>
              ))}
           </div>
           <Card className="bg-opex-dark text-white text-center py-10">
              <div className="space-y-4">
                 <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto"><Mail size={32} /></div>
                 <h4 className="text-lg font-bold">Still have doubts?</h4>
                 <p className="text-xs text-gray-400">Write to us at support@opex.com<br/>We reply within 24 hours.</p>
                 <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">Send Direct Email</Button>
              </div>
           </Card>
        </div>
      </div>
    </SubpageShell>
  );
};



export const AddRecurringModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Expense',
    amount: '',
    currency: 'EUR',
    frequency: 'Monthly',
    startDate: '',
    nextBillingDate: '',
    notes: ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-opex-dark/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Add Recurring</h3>
            <p className="text-xs text-gray-500 font-medium">Create a new recurring income or expense.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Name</label>
            <input 
              type="text" 
              placeholder="e.g. Figma, Client Retainer" 
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Type</label>
              <select 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium appearance-none"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Frequency</label>
              <select 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium appearance-none"
                value={formData.frequency}
                onChange={e => setFormData({...formData, frequency: e.target.value})}
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  className="w-full pl-8 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Currency</label>
              <select 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium appearance-none"
                value={formData.currency}
                onChange={e => setFormData({...formData, currency: e.target.value})}
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Start Date</label>
              <input 
                type="date" 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium"
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Next Billing</label>
              <input 
                type="date" 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium"
                value={formData.nextBillingDate}
                onChange={e => setFormData({...formData, nextBillingDate: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Notes (Optional)</label>
            <textarea 
              placeholder="Add any details..." 
              rows={3}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium resize-none"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>
        </div>

        <div className="p-8 bg-gray-50 flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={() => onAdd(formData)}>Save Recurring</Button>
        </div>
      </div>
    </div>
  );
};

export const RecurringPage = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const recurringItems = [
    { id: 1, name: 'Figma', type: 'Expense', amount: 15, frequency: 'Monthly', nextBilling: '2026-03-06', status: 'Active', daysLeft: 2 },
    { id: 2, name: 'ChatGPT Plus', type: 'Expense', amount: 20, frequency: 'Monthly', nextBilling: '2026-03-09', status: 'Active', daysLeft: 5 },
    { id: 3, name: 'Client Retainer', type: 'Income', amount: 1500, frequency: 'Monthly', nextBilling: '2026-03-14', status: 'Active', daysLeft: 10 },
    { id: 4, name: 'Adobe CC', type: 'Expense', amount: 52, frequency: 'Monthly', nextBilling: '2026-03-12', status: 'Paused', daysLeft: 8 },
    { id: 5, name: 'Spotify', type: 'Expense', amount: 10, frequency: 'Monthly', nextBilling: '2026-03-15', status: 'Active', daysLeft: 11 },
    { id: 6, name: 'Office Rent', type: 'Expense', amount: 800, frequency: 'Monthly', nextBilling: '2026-04-01', status: 'Active', daysLeft: 28 },
    { id: 7, name: 'SaaS Project B', type: 'Income', amount: 900, frequency: 'Monthly', nextBilling: '2026-03-20', status: 'Active', daysLeft: 16 },
  ];

  const filteredItems = recurringItems.filter(item => {
    if (activeTab === 'All') return true;
    return item.type === activeTab;
  });

  const upcoming = [...recurringItems].sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 3);

  const stats = {
    income: 2400,
    expenses: 340,
    net: 2060
  };

  return (
    <SubpageShell 
      onBack={onBack} 
      title="Recurring" 
      subtitle="Track your recurring income and expenses"
      actions={<Button variant="primary" icon={Plus} onClick={() => setIsAddModalOpen(true)}>Add recurring</Button>}
    >
      <div className="space-y-8 pb-20">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Recurring Income</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-400">€</span>
              <span className="text-3xl font-black text-gray-900 tracking-tight">{stats.income.toLocaleString()}</span>
            </div>
          </Card>
          <Card>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Recurring Expenses</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-400">€</span>
              <span className="text-3xl font-black text-gray-900 tracking-tight">{stats.expenses.toLocaleString()}</span>
            </div>
          </Card>
          <Card className="bg-opex-dark text-white border-none">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Net Recurring</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white/40">€</span>
              <span className="text-3xl font-black text-white tracking-tight">+{stats.net.toLocaleString()}</span>
            </div>
          </Card>
        </div>

        {/* Upcoming Section */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Upcoming</h3>
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
            {upcoming.map((item) => (
              <div key={item.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {item.type === 'Income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{item.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-black text-gray-900">€{item.amount.toLocaleString()}</p>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className="text-sm font-black text-gray-900">in {item.daysLeft} days</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs & Table */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {['All', 'Income', 'Expenses'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-opex-dark text-white shadow-lg shadow-blue-900/10' 
                    : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Frequency</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Next billing</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-gray-900">{item.name}</p>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant={item.type === 'Income' ? 'success' : 'neutral'}>{item.type}</Badge>
                      </td>
                      <td className="px-6 py-5">
                        <p className={`text-sm font-black ${item.type === 'Income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                          €{item.amount.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-gray-600">{item.frequency}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-gray-600">{item.nextBilling}</p>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant={
                          item.status === 'Active' ? 'success' : 
                          item.status === 'Paused' ? 'warning' : 'danger'
                        }>
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <AddRecurringModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={(data) => {
          console.log('Adding recurring:', data);
          setIsAddModalOpen(false);
        }}
      />
    </SubpageShell>
  );
};

export const SettingsPage = ({
  userProfile,
  setUserProfile,
  onNavigate,
  bankAccounts,
  taxBufferProviders,
  legalPublicInfo,
  onBankSelect,
  onConnectionSelect,
  onCreateOpenBankConnection,
  onRemoveOpenBankConnection,
  onDownloadDataExport,
  onDeleteAccount,
  isConnectingOpenBank = false,
  openBankErrorMessage = null,
  initialSection = 'PROFILE'
}: {
  userProfile: any,
  setUserProfile: (p: any) => void,
  onNavigate: (view: string) => void,
  bankAccounts: BankAccountRecord[],
  taxBufferProviders: TaxBufferProviderItem[],
  legalPublicInfo: LegalPublicInfoRecord | null,
  onBankSelect: (bank: BankOption) => void,
  onConnectionSelect: (account: BankAccountRecord, providerName: string) => void,
  onCreateOpenBankConnection: (consent: OpenBankingConsentPayload) => Promise<void>,
  onRemoveOpenBankConnection: (connectionId: string) => Promise<void>,
  onDownloadDataExport: () => Promise<void>,
  onDeleteAccount: () => Promise<void>,
  isConnectingOpenBank?: boolean,
  openBankErrorMessage?: string | null,
  initialSection?: string
}) => {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [isBusinessMode, setIsBusinessMode] = useState(true);
  const [theme, setTheme] = useState('light');
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const hasTaxProfile = Boolean((userProfile.residence ?? '').trim()) && Boolean((userProfile.vatFrequency ?? '').trim());
  const privacyPolicyCurrent = Boolean(legalPublicInfo?.privacyPolicy.version) && userProfile.privacyPolicyVersion === legalPublicInfo?.privacyPolicy.version;
  const termsCurrent = Boolean(legalPublicInfo?.termsOfService.version) && userProfile.termsOfServiceVersion === legalPublicInfo?.termsOfService.version;
  const hasCurrentRequiredConsents = Boolean(userProfile.gdprAccepted && privacyPolicyCurrent && termsCurrent);
  const consentAuditItems = [
    {
      label: 'Privacy Notice',
      version: userProfile.privacyPolicyVersion ?? 'Not accepted',
      acceptedAt: formatConsentTimestamp(userProfile.privacyAcceptedAt)
    },
    {
      label: 'Terms of Service',
      version: userProfile.termsOfServiceVersion ?? 'Not accepted',
      acceptedAt: formatConsentTimestamp(userProfile.termsAcceptedAt)
    },
    {
      label: 'Cookie Notice',
      version: userProfile.cookiePolicyVersion ?? 'Not acknowledged',
      acceptedAt: formatConsentTimestamp(userProfile.cookiePolicyAcknowledgedAt)
    },
    {
      label: 'Open Banking Notice',
      version: userProfile.openBankingNoticeVersion ?? 'Not accepted',
      acceptedAt: formatConsentTimestamp(userProfile.openBankingNoticeAcceptedAt)
    }
  ];

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);
  
  const checklistItems = [
    { id: 1, label: 'Verify Email', completed: true, cta: 'Done', action: null },
    { id: 2, label: 'Link a Bank Account', completed: true, cta: 'Manage', action: () => setActiveSection('BANKING') },
    { id: 3, label: 'Set Base Currency', completed: true, cta: 'Change', action: () => setActiveSection('PREFERENCES') },
    { id: 4, label: 'Define Tax Profile', completed: hasTaxProfile, cta: hasTaxProfile ? 'Done' : 'Set Now', action: hasTaxProfile ? null : () => onNavigate('EDIT_PROFILE') },
    { id: 5, label: 'Customize Notifications', completed: false, cta: 'Configure', action: () => onNavigate('NOTIFICATIONS') },
  ];
  
  const completedCount = checklistItems.filter(i => i.completed).length;
  const progressPercent = (completedCount / checklistItems.length) * 100;

  const sections = [
    { id: 'PROFILE', label: 'Profile & Account', icon: Users },
    { id: 'BRANDING', label: 'Branding', icon: Palette },
    { id: 'BANKING', label: 'Open Banking', icon: Building2 },
    { id: 'PREFERENCES', label: 'Preferences', icon: Globe },
    { id: 'SECURITY', label: 'Security', icon: Lock },
    { id: 'PRIVACY', label: 'Data & Privacy', icon: ShieldCheck },
    { id: 'HELP', label: 'Help & Legal', icon: HelpCircle },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile({ ...userProfile, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setUserProfile({ ...userProfile, logo: null });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 relative z-20">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-500">Manage your account, preferences, and personal data.</p>
        </div>
        <div className="flex items-center gap-3">
          <AccountSelector />
          <QuickActions onNavigate={onNavigate} />
        </div>
      </div>

      {/* Interactive Scrollable Nav Bar */}
      <div className="w-full relative py-2">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-4 px-1">
          {sections.map(s => {
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex-shrink-0 flex items-center gap-2.5 px-6 py-3 rounded-full font-bold text-sm transition-all duration-200 whitespace-nowrap shadow-sm border ${
                  isActive 
                    ? 'bg-opex-teal text-white border-opex-teal shadow-xl shadow-teal-900/10' 
                    : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                }`}
              >
                <s.icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                {s.label}
              </button>
            );
          })}
          <div className="flex-shrink-0 w-8 h-full"></div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex-1 w-full space-y-8">
          {/* Section: Profile & Account */}
          {activeSection === 'PROFILE' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Card title="Configuration Status" action={<Badge variant="info">{completedCount}/5 Completed</Badge>}>
                <div className="space-y-6 py-2">
                  <div className="space-y-2">
                     <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Setup Progress</span>
                        <span className="text-xs font-black text-opex-teal">{Math.round(progressPercent)}%</span>
                     </div>
                     <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-opex-teal transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {checklistItems.map(item => (
                      <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${item.completed ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            {item.completed ? <Check size={18} /> : <CircleDashed size={18} className="animate-spin-slow" />}
                          </div>
                          <span className={`text-xs font-bold ${item.completed ? 'text-green-800' : 'text-gray-600'}`}>{item.label}</span>
                        </div>
                        {!item.completed && <button onClick={item.action} className="text-[10px] font-black text-opex-teal uppercase tracking-widest hover:underline px-2 py-1">{item.cta}</button>}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card title="Profile Details" action={<Button variant="ghost" size="sm" icon={Edit2} onClick={() => onNavigate('EDIT_PROFILE')}>Edit</Button>}>
                <div className="flex flex-col md:flex-row gap-10">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl transition-transform group-hover:scale-[1.02] cursor-pointer bg-opex-teal/10 flex items-center justify-center" onClick={() => onNavigate('EDIT_PROFILE')}>
                        {userProfile.logo
                          ? <img src={userProfile.logo} alt="Avatar" className="w-full h-full object-cover" />
                          : <span className="text-3xl font-black text-opex-teal select-none">
                              {userProfile.name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?'}
                            </span>
                        }
                      </div>
                      <button className="absolute -bottom-2 -right-2 bg-opex-dark text-white p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all" onClick={() => onNavigate('EDIT_PROFILE')}>
                        <Camera size={16} />
                      </button>
                    </div>
                    <div className="text-center">
                       <p className="text-xl font-black text-gray-900 tracking-tight">{userProfile.name}</p>
                       <Badge variant="success">Account Verified ✓</Badge>
                    </div>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Primary Email</label>
                      <p className="font-bold text-gray-700 flex items-center gap-2">{userProfile.email} <Badge variant="neutral">Primary</Badge></p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Legal Residence</label>
                      <p className="font-bold text-gray-700 flex items-center gap-2"><Globe size={14} /> {userProfile.residence}</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">VAT Filing</label>
                      <p className="font-bold text-gray-700 flex items-center gap-2"><Receipt size={14} /> {userProfile.vatFrequency}</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time Zone</label>
                      <p className="font-bold text-gray-700">Europe/Rome (GMT+1)</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registration Date</label>
                      <p className="font-bold text-gray-700">Jan 14, 2023</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Section: Branding */}
          {activeSection === 'BRANDING' && (
            <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Coming Soon overlay */}
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-3xl pointer-events-auto select-none">
                <div className="flex flex-col items-center gap-4 text-center px-6">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Lock size={24} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-700 tracking-tight">Coming Soon</p>
                    <p className="text-sm text-gray-400 font-medium mt-1 max-w-xs">Custom branding will be available in a future update.</p>
                  </div>
                </div>
              </div>
            <div className="space-y-8 pointer-events-none select-none" style={{ filter: 'blur(3px)', opacity: 0.45 }}>
              <Card title="Invoice Branding" description="Upload your company logo to be displayed on all your invoices and quotes.">
                <div className="space-y-8 py-4">
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="relative group">
                      <div className="w-48 h-48 rounded-[2rem] bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-opex-teal/30">
                        {userProfile.logo ? (
                          <img src={userProfile.logo} alt="Company Logo" className="w-full h-full object-contain p-4" />
                        ) : (
                          <div className="text-center space-y-2">
                            <Image size={40} className="mx-auto text-gray-300" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Logo</p>
                          </div>
                        )}
                      </div>
                      {userProfile.logo && (
                        <button 
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 space-y-6">
                      <div className="space-y-2">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Company Logo</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Recommended size: 400x400px. Supported formats: PNG, JPG, SVG. 
                          Maximum file size: 2MB.
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <label className="cursor-pointer">
                          <div className="bg-opex-teal text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-opex-teal/90 transition-all shadow-lg shadow-opex-teal/20 active:scale-95 flex items-center gap-2">
                            <Upload size={16} />
                            {userProfile.logo ? 'Replace Logo' : 'Upload Logo'}
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </label>
                        {userProfile.logo && (
                          <Button variant="outline" onClick={removeLogo}>Remove</Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100 w-full"></div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preview Fallback</h4>
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-opex-teal/10 text-opex-teal flex items-center justify-center font-black text-lg">
                        {userProfile.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">{userProfile.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fallback display if no logo is present</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            </div>
          )}

          {/* Section: Open Banking */}
          {activeSection === 'BANKING' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <AddBankPage
                embeddedInSettings
                onNavigate={onNavigate}
                onBankSelect={onBankSelect}
                onConnectionSelect={onConnectionSelect}
                bankAccounts={bankAccounts}
                taxBufferProviders={taxBufferProviders}
                onCreateOpenBankConnection={onCreateOpenBankConnection}
                onRemoveOpenBankConnection={onRemoveOpenBankConnection}
                openBankingNoticeVersion={legalPublicInfo?.openBankingNotice.version ?? null}
                isConnectingOpenBank={isConnectingOpenBank}
                openBankErrorMessage={openBankErrorMessage}
              />
            </div>
          )}

          {/* Section: Preferences */}
          {activeSection === 'PREFERENCES' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Card title="Quick Management" action={<Button size="sm" variant="ghost" icon={HelpCircle} onClick={() => onNavigate('SUPPORT')}>Support</Button>}>
                <div className="space-y-4">
                   <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 mb-2">Fast Settings</h3>
                   <div className="grid grid-cols-1 gap-4">
                      <button 
                        onClick={() => onNavigate('CATEGORIES')}
                        className="w-full flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md hover:border-opex-teal/20 transition-all group"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-opex-teal group-hover:bg-opex-teal/5 transition-colors">
                               <Layers size={24} />
                            </div>
                            <span className="font-black text-gray-800 text-lg tracking-tight">Category Management</span>
                         </div>
                         <ChevronRight size={20} className="text-gray-300 group-hover:text-opex-teal transition-all" />
                      </button>

                      <button 
                        onClick={() => onNavigate('NOTIFICATIONS')}
                        className="w-full flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md hover:border-opex-teal/20 transition-all group"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-opex-teal group-hover:bg-opex-teal/5 transition-colors">
                               <Bell size={24} />
                            </div>
                            <span className="font-black text-gray-800 text-lg tracking-tight">Notification Details</span>
                         </div>
                         <ChevronRight size={20} className="text-gray-300 group-hover:text-opex-teal transition-all" />
                      </button>
                   </div>
                </div>
              </Card>

              <Card title="App Preferences">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Display</p>
                      <div className="space-y-4">
                         <div className="flex items-center justify-between p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                            <span className="text-sm font-bold text-gray-700">App Theme</span>
                            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                               <button onClick={()=>setTheme('light')} className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-opex-teal text-white shadow-md' : 'text-gray-400'}`}><Sun size={18} /></button>
                               <button onClick={()=>setTheme('dark')} className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-opex-teal text-white shadow-md' : 'text-gray-400'}`}><Moon size={18} /></button>
                            </div>
                         </div>
                         <div className="flex items-center justify-between p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                            <span className="text-sm font-bold text-gray-700">Business Mode</span>
                            <button onClick={() => setIsBusinessMode(!isBusinessMode)} className={`w-14 h-7 rounded-full relative transition-all ${isBusinessMode ? 'bg-opex-teal shadow-lg shadow-teal-900/20' : 'bg-gray-200'}`}>
                               <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isBusinessMode ? 'left-8' : 'left-1'}`}></div>
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
              </Card>
            </div>
          )}

          {/* Section: Security */}
          {activeSection === 'SECURITY' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <Card title="Authentication">
                  <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 gap-6">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400 shadow-sm border border-gray-100"><Key size={24} /></div>
                       <div>
                          <p className="text-base font-black text-gray-900">Access Credentials</p>
                          <p className="text-xs text-gray-500 font-medium">Update your access key.</p>
                       </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-2xl border-2 font-black px-6" onClick={() => onNavigate('CHANGE_PASSWORD')}>Change Password</Button>
                  </div>
               </Card>
            </div>
          )}

          {/* Section: Data & Privacy */}
          {activeSection === 'PRIVACY' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <Card title="GDPR & Data">
                  <div className="space-y-6">
                     <div className="rounded-[2rem] border border-gray-100 bg-gray-50 p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border ${hasCurrentRequiredConsents ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                              <ShieldCheck size={22} />
                           </div>
                           <div>
                              <p className="text-base font-black text-gray-900">Consent Status</p>
                              <p className="text-xs text-gray-500 font-medium">
                                {hasCurrentRequiredConsents
                                  ? 'Current privacy notice and service terms are accepted for this account.'
                                  : 'One or more required legal documents still need acceptance or renewal.'}
                              </p>
                           </div>
                        </div>
                        <Badge variant={hasCurrentRequiredConsents ? 'success' : 'warning'}>
                          {hasCurrentRequiredConsents ? 'Current' : 'Update Required'}
                        </Badge>
                     </div>

                     <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                       <button
                         type="button"
                         onClick={() => openLegalDocument('privacy')}
                         className="rounded-[1.75rem] border border-gray-100 bg-white px-5 py-5 text-left transition-all hover:border-opex-teal/20 hover:shadow-sm"
                       >
                         <p className="text-sm font-black text-gray-900">Privacy Notice</p>
                         <p className="mt-2 text-xs font-medium leading-relaxed text-gray-500">
                           v{legalPublicInfo?.privacyPolicy.version || 'n/a'} · Open the current notice in a new tab.
                         </p>
                       </button>
                       <button
                         type="button"
                         onClick={() => openLegalDocument('terms')}
                         className="rounded-[1.75rem] border border-gray-100 bg-white px-5 py-5 text-left transition-all hover:border-opex-teal/20 hover:shadow-sm"
                       >
                         <p className="text-sm font-black text-gray-900">Terms Of Service</p>
                         <p className="mt-2 text-xs font-medium leading-relaxed text-gray-500">
                           v{legalPublicInfo?.termsOfService.version || 'n/a'} · Review the contractual rules for the app.
                         </p>
                       </button>
                       <button
                         type="button"
                         onClick={() => openLegalDocument('cookies')}
                         className="rounded-[1.75rem] border border-gray-100 bg-white px-5 py-5 text-left transition-all hover:border-opex-teal/20 hover:shadow-sm"
                       >
                         <p className="text-sm font-black text-gray-900">Cookie Notice</p>
                         <p className="mt-2 text-xs font-medium leading-relaxed text-gray-500">
                           v{legalPublicInfo?.cookiePolicy.version || 'n/a'} · See which browser storage keys are used.
                         </p>
                       </button>
                       <button
                         type="button"
                         onClick={() => openLegalDocument('open-banking')}
                         className="rounded-[1.75rem] border border-gray-100 bg-white px-5 py-5 text-left transition-all hover:border-opex-teal/20 hover:shadow-sm"
                       >
                         <p className="text-sm font-black text-gray-900">Open Banking Notice</p>
                         <p className="mt-2 text-xs font-medium leading-relaxed text-gray-500">
                           v{legalPublicInfo?.openBankingNotice.version || 'n/a'} · Review banking-specific processing terms.
                         </p>
                       </button>
                     </div>

                     <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                       <div className="rounded-[2rem] border border-gray-100 bg-white p-6">
                         <div className="flex items-center justify-between gap-4">
                           <div>
                             <p className="text-base font-black text-gray-900">Consent Audit</p>
                             <p className="mt-1 text-xs font-medium text-gray-500">Recorded versions and timestamps currently stored for your account.</p>
                           </div>
                           <Badge variant="info">{consentAuditItems.length} Entries</Badge>
                         </div>
                         <div className="mt-5 space-y-3">
                           {consentAuditItems.map((item) => (
                             <div key={item.label} className="rounded-[1.4rem] border border-gray-100 bg-gray-50 px-4 py-4">
                               <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                 <p className="text-sm font-black text-gray-900">{item.label}</p>
                                 <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">{item.version}</p>
                               </div>
                               <p className="mt-2 text-xs font-medium text-gray-500">{item.acceptedAt}</p>
                             </div>
                           ))}
                         </div>
                       </div>

                       <div className="rounded-[2rem] border border-gray-100 bg-white p-6">
                         <p className="text-base font-black text-gray-900">Data Rights</p>
                         <p className="mt-1 text-xs font-medium text-gray-500">
                           Export your data, review the processor setup or close the account from here.
                         </p>

                         <div className="mt-5 space-y-3">
                           <Button
                             fullWidth
                             variant="outline"
                             icon={Download}
                             className="py-5 rounded-[1.5rem]"
                             disabled={isExportingData}
                             onClick={() => {
                               setIsExportingData(true);
                               void onDownloadDataExport()
                                 .catch(() => undefined)
                                 .finally(() => setIsExportingData(false));
                             }}
                           >
                             {isExportingData ? 'Preparing Export...' : 'Download My Data'}
                           </Button>
                           <Button
                             fullWidth
                             variant="outline"
                             icon={Mail}
                             className="py-5 rounded-[1.5rem]"
                             onClick={() => {
                               const privacyEmail = legalPublicInfo?.controller.privacyEmail;
                               if (!privacyEmail) {
                                 return;
                               }
                               window.location.href = `mailto:${privacyEmail}`;
                             }}
                           >
                             Contact Privacy Team
                           </Button>
                           <Button
                             fullWidth
                             variant="danger"
                             icon={Trash2}
                             className="py-5 rounded-[1.5rem]"
                             disabled={isDeletingAccount}
                             onClick={() => {
                               const confirmed = window.confirm('Delete your Opex account now? This will disable your local profile and log you out.');
                               if (!confirmed) {
                                 return;
                               }

                               setIsDeletingAccount(true);
                               void onDeleteAccount()
                                 .catch(() => undefined)
                                 .finally(() => setIsDeletingAccount(false));
                             }}
                           >
                             {isDeletingAccount ? 'Closing Account...' : 'Delete Account'}
                           </Button>
                         </div>

                         <div className="mt-6 rounded-[1.5rem] bg-gray-50 px-4 py-4">
                           <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">Open Banking Scopes</p>
                           <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
                             {(userProfile.openBankingConsentScopes ?? []).length > 0
                               ? (userProfile.openBankingConsentScopes ?? []).join(', ')
                               : 'No open-banking scope accepted yet.'}
                           </p>
                         </div>
                       </div>
                     </div>
                  </div>
               </Card>
            </div>
          )}

          {/* Section: Help */}
          {activeSection === 'HELP' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <Card title="Opex Support">
                  <div className="space-y-4">
                     <Button fullWidth variant="outline" icon={MessageSquare} className="py-6 rounded-[2.5rem]" onClick={() => onNavigate('SUPPORT')}>Report a Bug</Button>
                     <Button fullWidth variant="outline" icon={HelpCircle} className="py-6 rounded-[2.5rem]" onClick={() => onNavigate('SUPPORT')}>Visit Help Center</Button>
                  </div>
               </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
