import { ArrowUpRight, Camera, ChevronRight, Mail, MessageSquare, Upload } from 'lucide-react';
import { SubpageShell } from '../../../app/layout';
import { Button, Card } from '../../../shared/ui';

export const SupportPage = ({ onBack }: { onBack: () => void; }) => {
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
              <p className="text-xs text-gray-400">Write to us at support@opex.com<br />We reply within 24 hours.</p>
              <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">Send Direct Email</Button>
            </div>
          </Card>
        </div>
      </div>
    </SubpageShell>
  );
};




