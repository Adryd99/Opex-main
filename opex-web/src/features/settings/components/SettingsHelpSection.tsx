import { HelpCircle, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button, Card } from '../../../shared/ui';

type SettingsHelpSectionProps = {
  onNavigate: (view: string) => void;
};

export const SettingsHelpSection = ({ onNavigate }: SettingsHelpSectionProps) => {
  const { t } = useTranslation('settings');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card title={t('help.title')}>
        <div className="space-y-4">
          <Button fullWidth variant="outline" icon={MessageSquare} className="py-6 rounded-[2.5rem]" onClick={() => onNavigate('SUPPORT')}>
            {t('help.reportBug')}
          </Button>
          <Button fullWidth variant="outline" icon={HelpCircle} className="py-6 rounded-[2.5rem]" onClick={() => onNavigate('SUPPORT')}>
            {t('help.visitHelpCenter')}
          </Button>
        </div>
      </Card>
    </div>
  );
};
