import { Camera, Check, CircleDashed, Edit2, Globe, Receipt } from 'lucide-react';
import { Badge, Button, Card } from '../../../shared/ui';
import { UserProfile } from '../../../shared/types';

type ChecklistItem = {
  id: number;
  label: string;
  completed: boolean;
  cta: string;
  action: (() => void) | null;
};

type SettingsProfileSectionProps = {
  userProfile: UserProfile;
  checklistItems: ChecklistItem[];
  progressPercent: number;
  completedCount: number;
  onNavigate: (view: string) => void;
};

export const SettingsProfileSection = ({
  userProfile,
  checklistItems,
  progressPercent,
  completedCount,
  onNavigate
}: SettingsProfileSectionProps) => {
  return (
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
            {checklistItems.map((item) => (
              <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${item.completed ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {item.completed ? <Check size={18} /> : <CircleDashed size={18} className="animate-spin-slow" />}
                  </div>
                  <span className={`text-xs font-bold ${item.completed ? 'text-green-800' : 'text-gray-600'}`}>{item.label}</span>
                </div>
                {!item.completed && (
                  <button type="button" onClick={item.action ?? undefined} className="text-[10px] font-black text-opex-teal uppercase tracking-widest hover:underline px-2 py-1">
                    {item.cta}
                  </button>
                )}
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
                    {userProfile.name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || '?'}
                  </span>
                }
              </div>
              <button type="button" className="absolute -bottom-2 -right-2 bg-opex-dark text-white p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all" onClick={() => onNavigate('EDIT_PROFILE')}>
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
  );
};
