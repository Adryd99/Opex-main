import { type ReactNode } from 'react';

type CenteredStatusCardProps = {
  title: string;
  description: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
};

export const CenteredStatusCard = ({ title, description, icon, actions }: CenteredStatusCardProps) => (
  <div className="min-h-screen bg-app-base flex items-center justify-center p-6 transition-colors duration-200">
    <div className="bg-app-surface border border-app-border rounded-3xl p-8 max-w-md w-full text-center shadow-sm space-y-4 transition-colors duration-200">
      {icon}
      <h1 className="text-xl font-black text-app-primary">{title}</h1>
      <div className="text-sm text-app-secondary">{description}</div>
      {actions}
    </div>
  </div>
);
