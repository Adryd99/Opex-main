import { HelpCircle, MessageSquare } from 'lucide-react';
import { Button, Card } from '../../../shared/ui';

type SettingsHelpSectionProps = {
  onNavigate: (view: string) => void;
};

export const SettingsHelpSection = ({ onNavigate }: SettingsHelpSectionProps) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card title="Opex Support">
        <div className="space-y-4">
          <Button fullWidth variant="outline" icon={MessageSquare} className="py-6 rounded-[2.5rem]" onClick={() => onNavigate('SUPPORT')}>
            Report a Bug
          </Button>
          <Button fullWidth variant="outline" icon={HelpCircle} className="py-6 rounded-[2.5rem]" onClick={() => onNavigate('SUPPORT')}>
            Visit Help Center
          </Button>
        </div>
      </Card>
    </div>
  );
};
