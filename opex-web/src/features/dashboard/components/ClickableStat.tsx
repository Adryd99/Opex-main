import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export const ClickableStat = ({ title, amount, trend, icon: Icon, trendUp = true, onClick }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col text-left justify-center bg-white rounded-2xl border border-gray-100 shadow-sm p-5 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-opex-teal/30 hover:bg-gray-50/30 active:scale-[0.98] group w-full"
  >
    <div className="flex justify-between items-start mb-3 w-full">
      <div className="p-2 bg-gray-50 rounded-xl text-gray-600 group-hover:bg-opex-teal group-hover:text-white transition-colors">
        <Icon size={18} />
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${trendUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />} {trend}
        </span>
      )}
    </div>
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{title}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-bold text-gray-400">€</span>
      <span className="text-xl font-bold text-gray-900 tracking-tight">{amount}</span>
    </div>
  </button>
);


