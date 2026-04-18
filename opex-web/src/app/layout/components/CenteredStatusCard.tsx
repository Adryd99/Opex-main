import { type ReactNode } from 'react';

type CenteredStatusCardProps = {
  title: string;
  description: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
};

export const CenteredStatusCard = ({ title, description, icon, actions }: CenteredStatusCardProps) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div className="bg-white border border-gray-100 rounded-3xl p-8 max-w-md w-full text-center shadow-sm space-y-4">
      {icon}
      <h1 className="text-xl font-black text-gray-900">{title}</h1>
      <div className="text-sm text-gray-500">{description}</div>
      {actions}
    </div>
  </div>
);
