import { Car, Coffee, Edit2, Home, Layers, Plus, Search, ShoppingBag, Sparkles, Trash2, Utensils } from 'lucide-react';
import { SubpageShell } from '../../../app/layout';
import { Button, Card } from '../../../shared/ui';

export const CategoriesPage = ({ onBack }: { onBack: () => void; }) => {
  const initialCategories = [
    { id: 1, name: 'Shopping', icon: ShoppingBag, color: 'bg-purple-100 text-purple-600' },
    { id: 2, name: 'Transport', icon: Car, color: 'bg-blue-100 text-blue-600' },
    { id: 3, name: 'Rent & Home', icon: Home, color: 'bg-emerald-100 text-emerald-600' },
    { id: 4, name: 'Restaurants', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
    { id: 5, name: 'Subscriptions', icon: Layers, color: 'bg-indigo-100 text-indigo-600' },
    { id: 6, name: 'Coffee', icon: Coffee, color: 'bg-amber-100 text-amber-700' },
  ];

  return (
    <SubpageShell onBack={onBack} title="Category Management" actions={<Button size="sm" icon={Plus}>New</Button>}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search category..." className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {initialCategories.map(cat => (
            <div key={cat.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-opex-teal/20 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center`}>
                  <cat.icon size={24} />
                </div>
                <span className="font-bold text-gray-800">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"><Edit2 size={16} /></button>
                <button className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>

        <Card className="bg-gray-50 border-none">
          <div className="flex flex-col items-center text-center py-6 gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-opex-teal shadow-sm"><Sparkles size={24} /></div>
            <div>
              <h4 className="font-black text-gray-900">AI Auto-Categorization</h4>
              <p className="text-xs text-gray-500 max-w-sm mt-1">The Opex assistant learns from your habits. The more you customize categories, the more precise the Insights will be.</p>
            </div>
          </div>
        </Card>
      </div>
    </SubpageShell>
  );
};


