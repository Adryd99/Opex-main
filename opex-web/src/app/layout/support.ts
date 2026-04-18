import { type ComponentType } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUp,
  Bell,
  Building2,
  Calculator,
  CheckCircle2,
  FileText,
  LayoutGrid,
  Settings,
  Sparkles,
  Wallet
} from 'lucide-react';

import { APP_TABS, type AppTab } from '../navigation';

export type IconComponent = ComponentType<{
  size?: number | string;
  className?: string;
}>;

export type ProviderOption = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
};

export const ICON_MAP: Record<string, IconComponent> = {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Sparkles,
  Bell
};

const PROVIDER_COLORS = [
  'bg-opex-teal',
  'bg-orange-600',
  'bg-black',
  'bg-green-600',
  'bg-red-600',
  'bg-slate-700'
] as const;

export const QUICK_ACTION_ITEMS = [
  { label: 'Add Income', icon: ArrowUp, color: 'text-green-500', bg: 'bg-green-50', id: APP_TABS.QUICK_INCOME },
  { label: 'Add Expense', icon: ArrowDownRight, color: 'text-red-500', bg: 'bg-red-50', id: APP_TABS.QUICK_EXPENSE },
  { label: 'Open Banking', icon: Building2, color: 'text-purple-500', bg: 'bg-purple-50', id: APP_TABS.OPEN_BANKING }
] as const;

export const NAV_ITEMS: Array<{ id: AppTab; label: string; icon: IconComponent }> = [
  { id: APP_TABS.DASHBOARD, label: 'Dashboard', icon: LayoutGrid },
  { id: APP_TABS.BUDGET, label: 'Budget', icon: Wallet },
  { id: APP_TABS.TAXES, label: 'Taxes', icon: Calculator },
  { id: APP_TABS.INVOICING, label: 'Invoicing', icon: FileText },
  { id: APP_TABS.SETTINGS, label: 'Settings', icon: Settings }
];

const toProviderIcon = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return 'B';
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
};

export const loadProviderOptions = (
  rawValue: string | null
): ProviderOption[] => {
  if (!rawValue) {
    return [{ id: 'all', name: 'All Providers', icon: 'A', color: 'bg-opex-dark', type: 'Combined' }];
  }

  try {
    const providerNames = JSON.parse(rawValue);
    const normalizedNames = Array.isArray(providerNames)
      ? providerNames.filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
      : [];

    return [
      { id: 'all', name: 'All Providers', icon: 'A', color: 'bg-opex-dark', type: 'Combined' },
      ...normalizedNames.map((name, index) => ({
        id: `provider-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name,
        icon: toProviderIcon(name),
        color: PROVIDER_COLORS[index % PROVIDER_COLORS.length],
        type: 'Provider'
      }))
    ];
  } catch {
    return [{ id: 'all', name: 'All Providers', icon: 'A', color: 'bg-opex-dark', type: 'Combined' }];
  }
};
