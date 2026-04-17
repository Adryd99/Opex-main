import { useEffect, useState } from 'react';
import { Check, Loader2, Sliders } from 'lucide-react';
import { SubpageShell } from '../../../app/layout';
import { Button, Card } from '../../../shared/ui';
import { UserProfile } from '../../../shared/types';
import { opexApi } from '../../../services/api/opexApi';

export const NotificationDetailsPage = ({ onBack }: { onBack: () => void; }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await opexApi.syncUser();
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleToggle = (key: keyof UserProfile) => {
    if (!profile) return;
    setProfile({
      ...profile,
      [key]: !profile[key]
    });
  };

  const handleApply = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      await opexApi.updateNotificationSettings({
        notificationBalanceThreshold: profile.notificationBalanceThreshold,
        notifyCriticalBalance: profile.notifyCriticalBalance,
        notifySignificantIncome: profile.notifySignificantIncome,
        notifyAbnormalOutflow: profile.notifyAbnormalOutflow,
        notifyConsentExpiration: profile.notifyConsentExpiration,
        notifySyncErrors: profile.notifySyncErrors,
        notifyQuarterlyVat: profile.notifyQuarterlyVat,
        notifyMonthlyAnalysis: profile.notifyMonthlyAnalysis,
      });
      onBack();
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SubpageShell onBack={onBack} title="Notification Details">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-opex-teal" />
        </div>
      </SubpageShell>
    );
  }

  const sections = [
    {
      title: 'Transactions & Balance',
      items: [
        { label: 'Critical Balance', desc: 'Sends an alert when you drop below the set threshold.', key: 'notifyCriticalBalance' as const },
        { label: 'Significant Income', desc: 'Notify whenever you receive a transfer > €100.', key: 'notifySignificantIncome' as const },
        { label: 'Abnormal Outflow', desc: 'Identify suspicious transactions or duplicates.', key: 'notifyAbnormalOutflow' as const },
      ]
    },
    {
      title: 'Open Banking',
      items: [
        { label: 'Consent Expiration', desc: 'Receive reminders 7 and 2 days before bank disconnection.', key: 'notifyConsentExpiration' as const },
        { label: 'Sync Errors', desc: 'Immediate alert if a bank requires reconnection.', key: 'notifySyncErrors' as const },
      ]
    },
    {
      title: 'Tax & Deadlines',
      items: [
        { label: 'Quarterly VAT', desc: 'Reminder 10 days before the payment deadline.', key: 'notifyQuarterlyVat' as const },
        { label: 'Monthly Analysis', desc: 'Summary report of the performance of the month just ended.', key: 'notifyMonthlyAnalysis' as const },
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
                value={profile?.notificationBalanceThreshold ?? 500}
                onChange={(e) => setProfile(prev => prev ? { ...prev, notificationBalanceThreshold: Number(e.target.value) } : null)}
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
              {section.items.map((item, i) => {
                const isEnabled = profile ? !!profile[item.key] : false;
                return (
                  <div key={i} className="p-6 flex items-center justify-between group">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500 leading-relaxed max-sm:max-w-sm">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(item.key)}
                      className={`w-14 h-7 rounded-full relative transition-all ${isEnabled ? 'bg-opex-teal shadow-lg shadow-teal-900/20' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${isEnabled ? 'left-8' : 'left-1'}`}></div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-4">
          <Button fullWidth size="lg" icon={saving ? Loader2 : Check} onClick={handleApply} disabled={saving}>
            {saving ? 'Saving...' : 'Apply Configurations'}
          </Button>
        </div>
      </div>
    </SubpageShell>
  );
};


