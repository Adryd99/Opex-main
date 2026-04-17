import { useEffect, useState } from 'react';
import { Calculator, Check, X } from 'lucide-react';
import { UserProfile } from '../../../shared/types';
import {
  TAX_ACTIVITY_OPTIONS,
  TAX_REGIME_OPTIONS,
  TAX_RESIDENCE_OPTIONS,
  getInitialFiscalResidence
} from '../support';

export const TaxProfileSetupDialog = ({
  isOpen,
  isRequired,
  userProfile,
  onClose,
  onSave
}: {
  isOpen: boolean;
  isRequired: boolean;
  userProfile: UserProfile;
  onClose: () => void;
  onSave: (profile: UserProfile) => Promise<void>;
}) => {
  const [selectedRegime, setSelectedRegime] = useState<string>((userProfile.taxRegime ?? '').trim());
  const [selectedActivity, setSelectedActivity] = useState<string>((userProfile.activityType ?? '').trim());
  const [selectedFiscalResidence, setSelectedFiscalResidence] = useState<string>(getInitialFiscalResidence(userProfile));
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedRegime((userProfile.taxRegime ?? '').trim());
    setSelectedActivity((userProfile.activityType ?? '').trim());
    setSelectedFiscalResidence(getInitialFiscalResidence(userProfile));
    setFormError(null);
  }, [isOpen, userProfile]);

  if (!isOpen) {
    return null;
  }

  const isComplete = selectedRegime.length > 0 && selectedActivity.length > 0 && selectedFiscalResidence.length > 0;

  const handleSave = async () => {
    if (!isComplete) {
      setFormError('Select tax regime, activity type, and fiscal residence to continue.');
      return;
    }

    const nextProfile: UserProfile = {
      ...userProfile,
      fiscalResidence: selectedFiscalResidence,
      taxRegime: selectedRegime,
      activityType: selectedActivity
    };

    setIsSaving(true);
    setFormError(null);

    try {
      await onSave(nextProfile);
      onClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unexpected error while saving tax setup.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-slate-900/15 px-4 pb-28 pt-24 backdrop-blur-[6px] md:left-64 md:pb-8 md:pt-24">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/95 p-6 shadow-[0_32px_80px_-32px_rgba(15,23,42,0.45)] md:p-8">
        {!isRequired && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-opex-dark"
            disabled={isSaving}
          >
            <X size={18} />
          </button>
        )}

        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] bg-opex-dark text-white shadow-lg shadow-slate-900/15">
            <Calculator size={26} />
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-gray-900">Set up your tax profile</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              We need a few details to estimate taxes correctly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.45fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Tax Regime</p>
              </div>
              <div className="space-y-3">
                {TAX_REGIME_OPTIONS.map((option) => {
                  const isSelected = selectedRegime === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSelectedRegime(option.value);
                        if (formError) {
                          setFormError(null);
                        }
                      }}
                      className={`w-full rounded-[1.5rem] border p-4 text-left transition-all ${isSelected
                          ? 'border-opex-dark bg-slate-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-slate-300'
                        }`}
                      disabled={isSaving}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-black text-gray-900">{option.label}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">{option.description}</p>
                        </div>
                        <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${isSelected ? 'border-opex-dark bg-opex-dark text-white' : 'border-slate-200 text-transparent'}`}>
                          <Check size={14} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Fiscal Residence</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {TAX_RESIDENCE_OPTIONS.map((option) => {
                  const isSelected = selectedFiscalResidence === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSelectedFiscalResidence(option.value);
                        if (formError) {
                          setFormError(null);
                        }
                      }}
                      className={`rounded-[1.2rem] border px-4 py-3 text-left transition-all ${isSelected
                          ? 'border-opex-dark bg-slate-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-slate-300'
                        }`}
                      disabled={isSaving}
                    >
                      <p className="text-sm font-black text-gray-900">{option.label}</p>
                      <p className="mt-1 text-[11px] font-medium text-slate-500">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Activity Type</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
                {selectedRegime ? 'Select your business area' : 'Select a tax regime first.'}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TAX_ACTIVITY_OPTIONS.map((option) => {
                const isSelected = selectedActivity === option.value;
                const isDisabled = selectedRegime.length === 0;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (isDisabled) {
                        return;
                      }
                      setSelectedActivity(option.value);
                      if (formError) {
                        setFormError(null);
                      }
                    }}
                    className={`rounded-[1.5rem] border p-4 text-left transition-all ${isDisabled
                        ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-slate-300'
                        : isSelected
                          ? 'border-opex-dark bg-slate-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-slate-300'
                      }`}
                    disabled={isSaving || isDisabled}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-base font-black ${isDisabled ? 'text-slate-300' : 'text-gray-900'}`}>{option.label}</p>
                        <p className={`mt-1 text-xs font-medium ${isDisabled ? 'text-slate-300' : 'text-slate-500'}`}>{option.description}</p>
                        {option.meta && (
                          <p className={`mt-2 text-[11px] font-black uppercase tracking-widest ${isDisabled ? 'text-slate-300' : 'text-slate-400'}`}>
                            {option.meta}
                          </p>
                        )}
                      </div>
                      <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${isSelected ? 'border-opex-dark bg-opex-dark text-white' : 'border-slate-200 text-transparent'}`}>
                        <Check size={14} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {formError && (
          <p className="mt-6 text-sm font-bold text-red-600">{formError}</p>
        )}

        <div className="mt-8">
          <button
            type="button"
            onClick={() => void handleSave()}
            className="flex h-14 w-full items-center justify-center rounded-[1.2rem] bg-opex-dark text-base font-black text-white shadow-[0_20px_40px_-20px_rgba(12,33,49,0.55)] transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!isComplete || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save and continue'}
          </button>
          <p className="mt-4 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            You can update this later in tax settings.
          </p>
        </div>
      </div>
    </div>
  );
};
