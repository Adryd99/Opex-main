import { ArrowLeft, Clock3, FileText } from 'lucide-react';

import { Button, Card } from '../../shared/ui';
import type { BankAccountRecord, UserProfile } from '../../shared/types';

type InvoicingPageProps = {
  userProfile: UserProfile;
};

type AddInvoicePageProps = {
  onBack: () => void;
  userProfile: UserProfile;
  bankAccounts: BankAccountRecord[];
};

type ComingSoonCardProps = {
  title: string;
  description: string;
  onBack?: () => void;
};

const ComingSoonCard = ({ title, description, onBack }: ComingSoonCardProps) => (
  <div className="p-4 md:p-6">
    <div className="max-w-3xl mx-auto">
      <Card className="border-dashed border-gray-200 shadow-sm">
        <div className="px-6 py-12 md:px-10 md:py-16 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center">
            <Clock3 size={28} />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-gray-500">
              <FileText size={14} />
              Invoicing
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
              {title}
            </h1>
            <p className="max-w-2xl mx-auto text-sm md:text-base text-gray-500 font-medium leading-relaxed">
              {description}
            </p>
          </div>

          {onBack ? (
            <div className="pt-2">
              <Button variant="outline" icon={ArrowLeft} onClick={onBack}>
                Go back
              </Button>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  </div>
);

export const InvoicingPage = (_props: InvoicingPageProps) => (
  <ComingSoonCard
    title="Invoicing is coming soon"
    description="A new invoicing experience will be available in a future update."
  />
);

export const AddInvoicePage = ({ onBack }: AddInvoicePageProps) => (
  <ComingSoonCard
    title="Invoice creation is not available yet"
    description="This shortcut is reserved for the upcoming invoicing module. For now, use the active banking, budgeting and tax features."
    onBack={onBack}
  />
);
