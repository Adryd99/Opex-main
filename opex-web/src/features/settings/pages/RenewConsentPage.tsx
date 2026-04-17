import { RefreshCw } from 'lucide-react';
import { SubpageShell } from '../../../app/layout';
import { Button } from '../../../shared/ui';

export const RenewConsentPage = ({ onBack }: { onBack: () => void; }) => {
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


