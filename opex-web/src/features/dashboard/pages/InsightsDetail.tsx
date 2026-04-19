import { Activity, AlertTriangle, ExternalLink, TrendingUp, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SubpageShell } from '../../../app/layout';
import { Badge, Button, Card } from '../../../shared/ui';

type InsightsDetailProps = {
  onBack: () => void;
};

export const InsightsDetail = ({ onBack }: InsightsDetailProps) => {
  const { t } = useTranslation('dashboard');
  const insights = [
    {
      title: t('insights.items.concentrationAlert.title'),
      desc: t('insights.items.concentrationAlert.description'),
      icon: AlertTriangle,
      color: 'bg-red-500',
      cta: t('insights.items.concentrationAlert.cta'),
      tag: t('insights.tags.risk'),
      badgeVariant: 'danger' as const
    },
    {
      title: t('insights.items.trendSignal.title'),
      desc: t('insights.items.trendSignal.description'),
      icon: TrendingUp,
      color: 'bg-opex-teal',
      cta: t('insights.items.trendSignal.cta'),
      tag: t('insights.tags.growth'),
      badgeVariant: 'success' as const
    }
  ];

  return (
    <SubpageShell onBack={onBack} title={t('insights.title')}>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full space-y-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-gray-900">{t('insights.hubTitle')}</h2>
            <p className="text-sm font-medium text-gray-400">{t('insights.hubDescription')}</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {insights.map((item) => (
              <div key={item.title} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 group hover:border-opex-teal/20 transition-all">
                <div className={`w-16 h-16 rounded-2xl ${item.color} text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform`}>
                  <item.icon size={32} />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                    <Badge variant={item.badgeVariant}>{item.tag}</Badge>
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
          <Card title={t('insights.overallScore')} action={<Activity size={18} className="text-opex-teal" />}>
            <div className="space-y-8 py-4">
              <div className="flex flex-col items-center justify-center relative">
                <svg className="w-48 h-48 transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="#F3F4F6" strokeWidth="8" fill="transparent" />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1F4650" />
                      <stop offset="100%" stopColor="#22C55E" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
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
                  <p className="text-[10px] font-black text-opex-teal uppercase tracking-[0.2em] mt-1">{t('insights.excellent')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-6">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('insights.previous')}</p>
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-black text-gray-700">89</span>
                    <TrendingUp size={12} className="text-green-500" />
                  </div>
                </div>
                <div className="text-center border-l border-gray-50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('insights.peerAverage')}</p>
                  <span className="font-black text-gray-700">74</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="bg-opex-dark rounded-[2.5rem] p-8 text-white text-center space-y-5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform" />

            <div className="relative">
              <Badge variant="warning" className="bg-yellow-400 text-opex-dark mb-4">{t('overview.comingSoon')}</Badge>
              <Zap size={48} className="mx-auto text-yellow-400 mb-2" fill="currentColor" />
              <h4 className="text-xl font-black tracking-tight">{t('insights.smartAlertsTitle')}</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-medium mt-2">{t('insights.smartAlertsDescription')}</p>
              <div className="pt-4 opacity-50 cursor-not-allowed">
                <Button variant="primary" fullWidth className="bg-white/10 border-white/10 text-white cursor-not-allowed pointer-events-none">
                  {t('insights.joinWaitlist')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SubpageShell>
  );
};
