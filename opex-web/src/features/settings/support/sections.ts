import { Building2, Globe, HelpCircle, Lock, Palette, ShieldCheck, Users } from 'lucide-react';
import { SettingsSectionDefinition } from '../types';

export const SETTINGS_SECTIONS: SettingsSectionDefinition[] = [
  { id: 'PROFILE', label: 'Profile & Account', icon: Users },
  { id: 'BRANDING', label: 'Branding', icon: Palette },
  { id: 'BANKING', label: 'Open Banking', icon: Building2 },
  { id: 'PREFERENCES', label: 'Preferences', icon: Globe },
  { id: 'SECURITY', label: 'Security', icon: Lock },
  { id: 'PRIVACY', label: 'Data & Privacy', icon: ShieldCheck },
  { id: 'HELP', label: 'Help & Legal', icon: HelpCircle }
];
