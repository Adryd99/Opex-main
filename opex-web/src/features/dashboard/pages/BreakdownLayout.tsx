import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { SubpageShell } from '../../../app/layout';
import { Badge, Button, Card, ToggleFilter } from '../../../shared/ui';
import { EnhancedLineChart } from '../components/EnhancedLineChart';
import { MiniPieChart } from '../components/MiniPieChart';

export const BreakdownLayout = ({ type, onBack }: { type: 'INCOME' | 'EXPENSES', onBack: () => void; }) => {
  const [filter, setFilter] = useState('Week');
  const isIncome = type === 'INCOME';

  const getSubtitle = (f: string) => {
    switch (f) {
      case 'Week': return "Current week activity recap";
      case 'Month': return "Last 30 days financial analysis";
      case 'Year': return "Full year revenue breakdown";
      default: return "Analysis";
    }
  };

  const sources = isIncome
    ? [
      { name: 'Freelance', tag: 'Direct', amount: '€2,400', color: 'bg-green-500', icon: 'F' },
      { name: 'Dividends', tag: 'Invest', amount: '€1,200', color: 'bg-blue-500', icon: 'D' },
      { name: 'Consulting', tag: 'Project', amount: '€650', color: 'bg-purple-500', icon: 'C' }
    ]
    : [
      { name: 'Software', tag: 'SaaS', amount: '€1,200', color: 'bg-blue-500', icon: 'S' },
      { name: 'Groceries', tag: 'Essential', amount: '€450', color: 'bg-yellow-500', icon: 'G' },
      { name: 'Rent', tag: 'Monthly', amount: '€1,200', color: 'bg-red-400', icon: 'R' }
    ];

  const groupedTransactions = [
    {
      date: '9 July',
      total: isIncome ? '+$1,400' : '-$250',
      items: isIncome
        ? [{ name: 'Client X', tag: 'Payment', amount: 1400, icon: 'CX', color: 'bg-green-500' }]
        : [{ name: 'Adobe CC', stroke: 'Software', amount: -52.99, icon: 'A', color: 'bg-red-500' }]
    },
    {
      date: '8 July',
      total: isIncome ? '+$850' : '-$124',
      items: isIncome
        ? [{ name: 'Upwork', tag: 'Withdrawal', amount: 850, icon: 'U', color: 'bg-emerald-500' }]
        : [{ name: 'Webflow', tag: 'Hosting', amount: -124, icon: 'W', color: 'bg-blue-600' }]
    },
    {
      date: '7 July',
      total: isIncome ? '+$320' : '-$45',
      items: isIncome
        ? [{ name: 'Shutterstock', tag: 'Royalty', amount: 320, icon: 'S', color: 'bg-orange-500' }]
        : [{ name: 'Grab', tag: 'Transport', amount: -45.00, icon: 'G', color: 'bg-green-600' }]
    }
  ];

  return (
    <SubpageShell onBack={onBack} title={isIncome ? "Income" : "Expenses"}>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main Content Pane (Chart & Analysis) */}
        <div className="flex-1 w-full space-y-8">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-gray-900">{isIncome ? 'Income Breakdown' : 'Expense Breakdown'}</h2>
                <p className="text-sm font-medium text-gray-400 transition-all duration-300">{getSubtitle(filter)}</p>
              </div>
              <ToggleFilter options={['Week', 'Month', 'Year']} active={filter} onChange={setFilter} />
            </div>

            <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col justify-center">
              <EnhancedLineChart color={isIncome ? "#22C55E" : "#3B82F6"} period={filter} heightPixels={300} />
            </div>
          </div>

          <Card title={isIncome ? 'Income Sources' : 'Expense Categories'} action={<button className="text-opex-teal text-xs font-bold hover:underline">Full Analytics</button>}>
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex flex-col items-center gap-4">
                <MiniPieChart type={isIncome ? 'income' : 'expense'} />
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Rate</p>
                  <p className="text-xl font-black text-gray-900">82.4%</p>
                </div>
              </div>
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                {sources.map((src, i) => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50/50 p-2 -m-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${src.color} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>{src.icon}</div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{src.name}</p>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{src.tag}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{src.amount}</span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-900 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Pane (Recent Transactions) */}
        <div className="w-full lg:w-[380px] space-y-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-gray-900">Activity History</h3>
            <button className="text-[10px] font-black text-opex-teal uppercase tracking-widest hover:underline">Download CSV</button>
          </div>

          <div className="space-y-8">
            {groupedTransactions.map((group, idx) => (
              <div key={idx} className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{group.date}</span>
                  <span className={`text-[10px] font-black ${isIncome ? 'text-green-500' : 'text-gray-900'}`}>{group.total}</span>
                </div>
                <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {group.items.map((item, i) => (
                    <div key={i} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-white text-xs font-bold transition-transform group-hover:scale-105 shadow-sm`}>
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{item.name}</p>
                          <Badge>{item.tag || (item as any).stroke}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${item.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          {item.amount > 0 ? '+' : ''}€{Math.abs(item.amount)}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold">14:24</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" fullWidth className="py-4 border-dashed border-2 hover:border-opex-teal hover:text-opex-teal">
            Load More Transactions
          </Button>
        </div>
      </div>
    </SubpageShell>
  );
};



