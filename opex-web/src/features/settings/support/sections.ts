import { Building2, Globe, HelpCircle, Lock, ShieldCheck, Users } from 'lucide-react';
import { SettingsSectionDefinition } from '../types';
import { Calculator } from 'lucide-react';
type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export const buildSettingsSections = (t: TranslateFn): SettingsSectionDefinition[] => [
  { id: 'PROFILE', label: t('settings:sections.profile'), icon: Users },
  { id: 'SECURITY', label: t('settings:sections.security'), icon: Lock },
  { id: 'TAXES', label: t('settings:sections.taxes'), icon: Calculator },
  { id: 'BANKING', label: t('settings:sections.banking'), icon: Building2 },
  { id: 'PREFERENCES', label: t('settings:sections.preferences'), icon: Globe },
  { id: 'PRIVACY', label: t('settings:sections.privacy'), icon: ShieldCheck },
  { id: 'HELP', label: t('settings:sections.help'), icon: HelpCircle }
];
