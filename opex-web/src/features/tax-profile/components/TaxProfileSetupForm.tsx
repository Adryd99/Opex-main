import { useEffect, useState } from 'react';
import { Calculator, Check } from 'lucide-react';
import { UserProfile } from '../../../shared/types';
import {
  TAX_ACTIVITY_OPTIONS,
  TAX_REGIME_OPTIONS,
  TAX_RESIDENCE_OPTIONS,
  getInitialFiscalResidence
} from '../support';

type TaxProfileSetupFormProps = {
  userProfile: UserProfile;
  onSave: (profile: UserProfile) => Promise<void>;
  onSaved?: () => void;
  title?: string;
  description?: string;
  saveLabel?: string;
  footerNote?: string;
};

export const TaxProfileSetupForm = ({
  userProfile,
  onSave,
  onSaved,
  title = 'Set up your tax profile',
  description = 'We need a few details to estimate taxes correctly.',
  saveLabel = 'Save and continue',
  footerNote = 'You can update this later from Settings.'
}: TaxProfileSetupFormProps) => {
  const [selectedRegime, setSelectedRegime] = useState<string>((userProfile.taxRegime ?? '').trim());
  const [selectedActivity, setSelectedActivity] = useState<string>((userProfile.activityType ?? '').trim());
  const [selectedFiscalResidence, setSelectedFiscalResidence] = useState<string>(getInitialFiscalResidence(userProfile));
  const [selectedVatFrequency, setSelectedVatFrequency] = useState<string>(userProfile.vatFrequency?.trim() || 'Yearly');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRegime((userProfile.taxRegime ?? '').trim());
    setSelectedActivity((userProfile.activityType ?? '').trim());
    setSelectedFiscalResidence(getInitialFiscalResidence(userProfile));
    setSelectedVatFrequency(userProfile.vatFrequency?.trim() || 'Yearly');
    setIsSaved(false);
    setFormError(null);
  }, [userProfile]);

  useEffect(() => {
    if (!isSaved) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsSaved(false);
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [isSaved]);

  const isComplete = selectedRegime.length > 0 && selectedActivity.length > 0 && selectedFiscalResidence.length > 0;

  const handleSave = async () => {
    if (!isComplete) {
      setFormError('Select tax regime, activity type, and fiscal residence to continue.');
      return;
    }

    const nextProfile: UserProfile = {
      ...userProfile,
      residence: selectedFiscalResidence,
      fiscalResidence: selectedFiscalResidence,
      taxRegime: selectedRegime,
      activityType: selectedActivity,
      vatFrequency: selectedVatFrequency
    };

    setIsSaving(true);
    setIsSaved(false);
    setFormError(null);

    try {
      await onSave(nextProfile);
      setIsSaved(true);
      onSaved?.();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unexpected error while saving tax setup.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] bg-opex-dark text-white shadow-lg shadow-slate-900/15">
          <Calculator size={26} />
        </div>
        <div>
          <h3 className="text-3xl font-black tracking-tight text-gray-900">{title}</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {description}
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
                      setIsSaved(false);
                      if (formError) {
                        setFormError(null);
                      }
                    }}
                    className={`w-full rounded-[1.5rem] border p-4 text-left transition-all ${
                      isSelected
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
                      <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${
                        isSelected ? 'border-opex-dark bg-opex-dark text-white' : 'border-slate-200 text-transparent'
                      }`}>
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
                      setIsSaved(false);
                      if (formError) {
                        setFormError(null);
                      }
                    }}
                    className={`rounded-[1.2rem] border px-4 py-3 text-left transition-all ${
                      isSelected
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

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
              VAT Filing
            </p>
            <div className="grid grid-cols-3 gap-3">
              {['Monthly', 'Quarterly', 'Yearly'].map((option) => {
                const isSelected = selectedVatFrequency === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSelectedVatFrequency(option);
                      setIsSaved(false);
                      if (formError) {
                        setFormError(null);
                      }
                    }}
                    className={`rounded-[1.2rem] border px-4 py-3 text-left transition-all ${
                      isSelected
                        ? 'border-opex-dark bg-slate-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-slate-300'
                    }`}
                    disabled={isSaving}
                  >
                    <p className="text-sm font-black text-gray-900">{option}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-medium text-slate-500">
              Used to estimate VAT deadlines and recurring tax obligations.
            </p>
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
                    setIsSaved(false);
                    if (formError) {
                      setFormError(null);
                    }
                  }}
                  className={`rounded-[1.5rem] border p-4 text-left transition-all ${
                    isDisabled
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
                    <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${
                      isSelected ? 'border-opex-dark bg-opex-dark text-white' : 'border-slate-200 text-transparent'
                    }`}>
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
        <p className="text-sm font-bold text-red-600">{formError}</p>
      )}

      <div>
        <button
          type="button"
          onClick={() => void handleSave()}
          className={`flex h-14 w-full items-center justify-center gap-2 rounded-[1.2rem] text-base font-black text-white shadow-[0_20px_40px_-20px_rgba(12,33,49,0.55)] transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            isSaved
              ? 'bg-emerald-600 hover:bg-emerald-600'
              : 'bg-opex-dark hover:bg-slate-800'
          }`}
          disabled={!isComplete || isSaving}
        >
          {isSaving ? (
            'Saving...'
          ) : isSaved ? (
            <>
              <Check size={18} />
              Tax profile saved
            </>
          ) : (
            saveLabel
          )}
        </button>
        <p
          className={`mt-3 text-center text-xs font-semibold transition-colors ${
            isSaved ? 'text-emerald-600' : 'text-slate-500'
          }`}
          aria-live="polite"
        >
          {isSaved ? 'Saved. Your Taxes workspace is now up to date.' : 'Save changes here to update the Taxes workspace.'}
        </p>
        <p className="mt-4 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
          {footerNote}
        </p>
      </div>
    </div>
  );
};
