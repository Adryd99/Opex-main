import { Bell, ChevronRight, HelpCircle, Layers, Lock, Moon, Sun } from 'lucide-react';
import { Button, Card } from '../../../shared/ui';

type SettingsPreferencesSectionProps = {
  theme: string;
  onThemeChange: (theme: string) => void;
  onNavigate: (view: string) => void;
};

export const SettingsPreferencesSection = ({
  theme,
  onThemeChange,
  onNavigate
}: SettingsPreferencesSectionProps) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card title="Quick Management" action={<Button size="sm" variant="ghost" icon={HelpCircle} onClick={() => onNavigate('SUPPORT')}>Support</Button>}>
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 mb-2">Fast Settings</h3>
          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
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
              type="button"
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
                  <button type="button" onClick={() => onThemeChange('light')} className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-opex-teal text-white shadow-md' : 'text-gray-400'}`}><Sun size={18} /></button>
                  <button type="button" onClick={() => onThemeChange('dark')} className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-opex-teal text-white shadow-md' : 'text-gray-400'}`}><Moon size={18} /></button>
                </div>
              </div>
              <div className="relative flex items-center justify-between p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-[2rem] pointer-events-auto select-none">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Lock size={12} className="text-gray-400" />
                    </div>
                    <p className="text-[10px] font-black text-gray-700 tracking-tight">Coming Soon</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-700 pointer-events-none select-none" style={{ filter: 'blur(1px)', opacity: 0.5 }}>Business Mode</span>
                <button type="button" disabled className="w-14 h-7 rounded-full relative transition-all bg-gray-200 pointer-events-none select-none" style={{ filter: 'blur(1px)', opacity: 0.5 }}>
                  <div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
