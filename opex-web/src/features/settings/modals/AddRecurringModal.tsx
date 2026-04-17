import { useState } from 'react';
import { XCircle } from 'lucide-react';
import { Button } from '../../../shared/ui';
import { AddRecurringFormData, AddRecurringModalProps } from '../types';

export const AddRecurringModal = ({ isOpen, onClose, onAdd }: AddRecurringModalProps) => {
  const [formData, setFormData] = useState<AddRecurringFormData>({
    name: '',
    type: 'Expense',
    amount: '',
    currency: 'EUR',
    frequency: 'Monthly',
    startDate: '',
    nextBillingDate: '',
    notes: ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-opex-dark/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Add Recurring</h3>
            <p className="text-xs text-gray-500 font-medium">Create a new recurring income or expense.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <XCircle size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Name</label>
            <input
              type="text"
              placeholder="e.g. Figma, Client Retainer"
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Type</label>
              <select
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium appearance-none"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Frequency</label>
              <select
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium appearance-none"
                value={formData.frequency}
                onChange={e => setFormData({ ...formData, frequency: e.target.value })}
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Currency</label>
              <select
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium appearance-none"
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Start Date</label>
              <input
                type="date"
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Next Billing</label>
              <input
                type="date"
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium"
                value={formData.nextBillingDate}
                onChange={e => setFormData({ ...formData, nextBillingDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Notes (Optional)</label>
            <textarea
              placeholder="Add any details..."
              rows={3}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-opex-teal/10 outline-none font-medium resize-none"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="p-8 bg-gray-50 flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={() => onAdd(formData)}>Save Recurring</Button>
        </div>
      </div>
    </div>
  );
};


