import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react';
import { SubpageShell } from '../../../app/layout';
import { Badge, Button, Card } from '../../../shared/ui';
import { AddRecurringModal } from '../modals/AddRecurringModal';

export const RecurringPage = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const recurringItems = [
    { id: 1, name: 'Figma', type: 'Expense', amount: 15, frequency: 'Monthly', nextBilling: '2026-03-06', status: 'Active', daysLeft: 2 },
    { id: 2, name: 'ChatGPT Plus', type: 'Expense', amount: 20, frequency: 'Monthly', nextBilling: '2026-03-09', status: 'Active', daysLeft: 5 },
    { id: 3, name: 'Client Retainer', type: 'Income', amount: 1500, frequency: 'Monthly', nextBilling: '2026-03-14', status: 'Active', daysLeft: 10 },
    { id: 4, name: 'Adobe CC', type: 'Expense', amount: 52, frequency: 'Monthly', nextBilling: '2026-03-12', status: 'Paused', daysLeft: 8 },
    { id: 5, name: 'Spotify', type: 'Expense', amount: 10, frequency: 'Monthly', nextBilling: '2026-03-15', status: 'Active', daysLeft: 11 },
    { id: 6, name: 'Office Rent', type: 'Expense', amount: 800, frequency: 'Monthly', nextBilling: '2026-04-01', status: 'Active', daysLeft: 28 },
    { id: 7, name: 'SaaS Project B', type: 'Income', amount: 900, frequency: 'Monthly', nextBilling: '2026-03-20', status: 'Active', daysLeft: 16 }
  ];

  const filteredItems = recurringItems.filter((item) => {
    if (activeTab === 'All') {
      return true;
    }

    return item.type === activeTab;
  });

  const upcoming = [...recurringItems].sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 3);

  const stats = {
    income: 2400,
    expenses: 340,
    net: 2060
  };

  return (
    <SubpageShell
      onBack={onBack}
      title="Recurring"
      subtitle="Track your recurring income and expenses"
      actions={(
        <Button variant="primary" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
          Add recurring
        </Button>
      )}
    >
      <div className="space-y-8 pb-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
              Recurring Income
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-400">EUR</span>
              <span className="text-3xl font-black tracking-tight text-gray-900">
                {stats.income.toLocaleString()}
              </span>
            </div>
          </Card>
          <Card>
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
              Recurring Expenses
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-400">EUR</span>
              <span className="text-3xl font-black tracking-tight text-gray-900">
                {stats.expenses.toLocaleString()}
              </span>
            </div>
          </Card>
          <Card className="border-none bg-opex-dark text-white">
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-white/40">
              Net Recurring
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white/40">EUR</span>
              <span className="text-3xl font-black tracking-tight text-white">
                +{stats.net.toLocaleString()}
              </span>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="px-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Upcoming</h3>
          <div className="divide-y divide-gray-50 overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-sm">
            {upcoming.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-6 transition-colors hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      item.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {item.type === 'Income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{item.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-black text-gray-900">EUR {item.amount.toLocaleString()}</p>
                  </div>
                  <div className="min-w-[100px] text-right">
                    <p className="text-sm font-black text-gray-900">in {item.daysLeft} days</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {['All', 'Income', 'Expenses'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap rounded-full px-6 py-2 text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-opex-dark text-white shadow-lg shadow-blue-900/10'
                    : 'border border-gray-100 bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Frequency</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Next billing</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="group transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-gray-900">{item.name}</p>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant={item.type === 'Income' ? 'success' : 'neutral'}>{item.type}</Badge>
                      </td>
                      <td className="px-6 py-5">
                        <p className={`text-sm font-black ${item.type === 'Income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                          EUR {item.amount.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-gray-600">{item.frequency}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-gray-600">{item.nextBilling}</p>
                      </td>
                      <td className="px-6 py-5">
                        <Badge
                          variant={
                            item.status === 'Active'
                              ? 'success'
                              : item.status === 'Paused'
                                ? 'warning'
                                : 'danger'
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <AddRecurringModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(_data) => {
          setIsAddModalOpen(false);
        }}
      />
    </SubpageShell>
  );
};
