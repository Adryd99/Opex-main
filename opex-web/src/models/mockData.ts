import { AlertTriangle, CheckCircle2, FileText, Sparkles } from 'lucide-react';

export const ACCOUNTS = [
  { id: 'all', name: 'All Accounts', icon: 'A', color: 'bg-opex-dark', type: 'Combined' },
  { id: 'bunq', name: 'Bunq Bank', icon: 'B', color: 'bg-opex-teal', type: 'Personal' },
  { id: 'rabobank', name: 'Rabobank', icon: 'R', color: 'bg-orange-600', type: 'Business' },
  { id: 'revolut', name: 'Revolut', icon: 'Rv', color: 'bg-black', type: 'Business' }
];

export const PERIOD_DATA: Record<string, Array<{ label: string; value: number }>> = {
  Week: [
    { label: 'Mon', value: 420 },
    { label: 'Tue', value: 780 },
    { label: 'Wed', value: 360 },
    { label: 'Thu', value: 540 },
    { label: 'Fri', value: 960 },
    { label: 'Sat', value: 300 },
    { label: 'Sun', value: 660 }
  ],
  Month: [
    { label: 'W1', value: 1850 },
    { label: 'W2', value: 1200 },
    { label: 'W3', value: 2100 },
    { label: 'W4', value: 1550 }
  ],
  Year: [
    { label: 'Q1', value: 14200 },
    { label: 'Q2', value: 11500 },
    { label: 'Q3', value: 18500 },
    { label: 'Q4', value: 15200 }
  ]
};

export const MOCK_NOTIFICATIONS: any[] = [];
