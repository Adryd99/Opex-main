import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { UserProfile } from '../../../shared/types';
import { TaxProfileSetupForm } from '../../tax-profile';

type TaxProfileSetupDialogProps = {
  isOpen: boolean;
  isRequired: boolean;
  userProfile: UserProfile;
  onClose: () => void;
  onSave: (profile: UserProfile) => Promise<void>;
};

export const TaxProfileSetupDialog = ({
  isOpen,
  isRequired,
  userProfile,
  onClose,
  onSave
}: TaxProfileSetupDialogProps) => {
  const { t } = useTranslation('taxes');

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-slate-900/15 px-4 pb-28 pt-24 backdrop-blur-[6px] md:left-64 md:pb-8 md:pt-24">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/95 p-6 shadow-[0_32px_80px_-32px_rgba(15,23,42,0.45)] md:p-8">
        {!isRequired && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-opex-dark"
          >
            <X size={18} />
          </button>
        )}
        <TaxProfileSetupForm
          userProfile={userProfile}
          onSave={onSave}
          onSaved={onClose}
          footerNote={t('page.settingsHint')}
        />
      </div>
    </div>
  );
};
