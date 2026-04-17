import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { LegalPublicInfoRecord, UserProfile } from '../../../shared/types';
import { openLegalDocument } from '../../../shared/legal';
import { ONBOARDING_QUESTION_STEPS, toOptionalText } from '../support';

export const OnboardingPage = ({
  userProfile,
  legalPublicInfo,
  onComplete
}: {
  userProfile: UserProfile;
  legalPublicInfo: LegalPublicInfoRecord | null;
  onComplete: (profile: UserProfile) => Promise<void>;
}) => {
  const requiresRenewedConsent = Boolean(
    legalPublicInfo && userProfile.gdprAccepted && (
      userProfile.privacyPolicyVersion !== legalPublicInfo.privacyPolicy.version ||
      userProfile.termsOfServiceVersion !== legalPublicInfo.termsOfService.version
    )
  );
  const [stepIndex, setStepIndex] = useState(requiresRenewedConsent ? ONBOARDING_QUESTION_STEPS.length : 0);
  const [lastQuestionStepIndex, setLastQuestionStepIndex] = useState(0);
  const [fullName, setFullName] = useState(userProfile.name ?? '');
  const [residence, setResidence] = useState(userProfile.residence ?? '');
  const [occupation, setOccupation] = useState(userProfile.answer3 ?? '');
  const [privacyAccepted, setPrivacyAccepted] = useState(
    Boolean(legalPublicInfo) && userProfile.privacyPolicyVersion === legalPublicInfo?.privacyPolicy.version
  );
  const [termsAccepted, setTermsAccepted] = useState(
    Boolean(legalPublicInfo) && userProfile.termsOfServiceVersion === legalPublicInfo?.termsOfService.version
  );
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isPrivacyStep = stepIndex >= ONBOARDING_QUESTION_STEPS.length;
  const currentQuestion = ONBOARDING_QUESTION_STEPS[Math.min(stepIndex, ONBOARDING_QUESTION_STEPS.length - 1)];
  const progressValue = isPrivacyStep
    ? 100
    : Math.min(100, (currentQuestion.step / ONBOARDING_QUESTION_STEPS.length) * 100);
  const CurrentIcon = isPrivacyStep ? ShieldCheck : currentQuestion.icon;

  const currentValue = currentQuestion.field === 'fullName'
    ? fullName
    : currentQuestion.field === 'residence'
      ? residence
      : occupation;

  useEffect(() => {
    if (!requiresRenewedConsent) {
      return;
    }

    setStepIndex(ONBOARDING_QUESTION_STEPS.length);
  }, [requiresRenewedConsent]);

  useEffect(() => {
    setPrivacyAccepted(Boolean(legalPublicInfo) && userProfile.privacyPolicyVersion === legalPublicInfo?.privacyPolicy.version);
    setTermsAccepted(Boolean(legalPublicInfo) && userProfile.termsOfServiceVersion === legalPublicInfo?.termsOfService.version);
  }, [legalPublicInfo, userProfile.privacyPolicyVersion, userProfile.termsOfServiceVersion]);

  const setCurrentValue = (value: string) => {
    if (currentQuestion.field === 'fullName') {
      setFullName(value);
      return;
    }
    if (currentQuestion.field === 'residence') {
      setResidence(value);
      return;
    }
    setOccupation(value);
  };

  const handleNext = () => {
    setFormError(null);
    setLastQuestionStepIndex(Math.min(stepIndex, ONBOARDING_QUESTION_STEPS.length - 1));
    setStepIndex((currentStep) => Math.min(currentStep + 1, ONBOARDING_QUESTION_STEPS.length));
  };

  const handleBack = () => {
    setFormError(null);
    if (isPrivacyStep) {
      setStepIndex(lastQuestionStepIndex);
      return;
    }
    setStepIndex((currentStep) => Math.max(currentStep - 1, 0));
  };

  const handleSkip = () => {
    setFormError(null);
    setLastQuestionStepIndex(stepIndex);
    setStepIndex(ONBOARDING_QUESTION_STEPS.length);
  };

  const handleComplete = async () => {
    if (!legalPublicInfo) {
      setFormError('Legal documents are still loading. Retry in a moment.');
      return;
    }

    if (!privacyAccepted || !termsAccepted) {
      setFormError('You must accept the privacy notice and terms of service before continuing.');
      return;
    }

    const nextName = toOptionalText(fullName) ?? userProfile.name;
    const nextResidence = toOptionalText(residence) ?? userProfile.residence;
    const nextProfile: UserProfile = {
      ...userProfile,
      name: nextName,
      residence: nextResidence,
      gdprAccepted: true,
      answer1: toOptionalText(fullName) ?? userProfile.answer1 ?? null,
      answer2: toOptionalText(residence) ?? userProfile.answer2 ?? null,
      answer3: toOptionalText(occupation) ?? userProfile.answer3 ?? null
    };

    setIsSaving(true);
    setFormError(null);

    try {
      await onComplete(nextProfile);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unexpected error while saving onboarding details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f3] px-6 py-8 md:px-10 md:py-12 text-gray-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col justify-center">
        <div className="mb-12 flex items-center justify-between gap-4">
          <div className="w-full">
            <div className="mb-3 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.24em] text-opex-dark/80">
              <span>{isPrivacyStep ? 'Final Step' : `Step ${currentQuestion.step} of 3`}</span>
              {!isPrivacyStep && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-gray-400 transition-colors hover:text-opex-dark"
                  disabled={isSaving}
                >
                  Skip
                </button>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className="h-full rounded-full bg-opex-dark transition-all duration-300"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>
        </div>

        <div className="max-w-3xl">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-slate-200/70 text-opex-dark shadow-sm">
            <CurrentIcon size={30} />
          </div>

          {isPrivacyStep ? (
            <>
              <h1 className="max-w-2xl text-4xl font-black tracking-tight text-opex-dark md:text-5xl">
                {requiresRenewedConsent ? 'We updated our legal terms.' : 'Before you continue, review the legal terms.'}
              </h1>
              <p className="mt-4 max-w-2xl text-lg font-medium leading-relaxed text-slate-500 md:text-xl">
                {requiresRenewedConsent
                  ? 'Your account already exists, but you need to accept the latest legal versions before continuing.'
                  : 'We need your acceptance of the privacy notice and service terms before activating your workspace. Manual accounts remain available even if you never connect a bank.'}
              </p>

              <div className="mt-12 space-y-4 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-sm md:p-8">
                <label className="flex cursor-pointer items-start gap-4">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(event) => {
                      setPrivacyAccepted(event.target.checked);
                      if (formError) {
                        setFormError(null);
                      }
                    }}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-opex-dark focus:ring-opex-dark"
                    disabled={isSaving}
                  />
                  <span className="space-y-1">
                    <span className="block text-base font-black text-gray-900">
                      I accept the Privacy Notice v{legalPublicInfo?.privacyPolicy.version || 'current'}.
                    </span>
                    <span className="block text-sm font-medium leading-relaxed text-slate-500">
                      This covers how Opex processes profile, workspace and optional financial data for the service.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-4">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => {
                      setTermsAccepted(event.target.checked);
                      if (formError) {
                        setFormError(null);
                      }
                    }}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-opex-dark focus:ring-opex-dark"
                    disabled={isSaving}
                  />
                  <span className="space-y-1">
                    <span className="block text-base font-black text-gray-900">
                      I accept the Terms of Service v{legalPublicInfo?.termsOfService.version || 'current'}.
                    </span>
                    <span className="block text-sm font-medium leading-relaxed text-slate-500">
                      This includes the core rules for using Opex, optional third-party integrations and account termination.
                    </span>
                  </span>
                </label>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => openLegalDocument('privacy')}
                    className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition-colors hover:border-slate-300 hover:text-opex-dark"
                    disabled={isSaving}
                  >
                    Open Privacy Notice
                  </button>
                  <button
                    type="button"
                    onClick={() => openLegalDocument('terms')}
                    className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition-colors hover:border-slate-300 hover:text-opex-dark"
                    disabled={isSaving}
                  >
                    Open Terms
                  </button>
                  <button
                    type="button"
                    onClick={() => openLegalDocument('cookies')}
                    className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition-colors hover:border-slate-300 hover:text-opex-dark"
                    disabled={isSaving}
                  >
                    Open Cookie Notice
                  </button>
                </div>

                <div className="rounded-[1.5rem] bg-slate-50 px-5 py-4 text-sm font-medium leading-relaxed text-slate-500">
                  You can review policy versions, export your data or close the account later in <span className="font-black text-opex-dark">Settings &gt; Data &amp; Privacy</span>.
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="max-w-2xl text-4xl font-black tracking-tight text-opex-dark md:text-5xl">
                {currentQuestion.title}
              </h1>
              <p className="mt-4 max-w-2xl text-lg font-medium leading-relaxed text-slate-500 md:text-xl">
                {currentQuestion.description}
              </p>

              <div className="mt-14 max-w-3xl">
                <label className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
                  {currentQuestion.fieldLabel}
                </label>
                <input
                  type="text"
                  value={currentValue}
                  onChange={(event) => {
                    setCurrentValue(event.target.value);
                    if (formError) {
                      setFormError(null);
                    }
                  }}
                  placeholder={currentQuestion.placeholder}
                  className="mt-4 w-full border-0 border-b-2 border-slate-200 bg-transparent px-0 pb-5 text-3xl font-black text-opex-dark placeholder:text-slate-300 focus:border-opex-dark focus:outline-none focus:ring-0"
                  disabled={isSaving}
                />
              </div>
            </>
          )}

          {formError && (
            <p className="mt-8 text-sm font-bold text-red-600">{formError}</p>
          )}

          <div className="mt-12 flex flex-col-reverse gap-4 sm:flex-row sm:items-center">
            {!requiresRenewedConsent && (stepIndex > 0 || isPrivacyStep) && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-14 items-center justify-center rounded-[1.3rem] border border-slate-200 bg-white px-6 text-sm font-black text-slate-500 transition-colors hover:border-slate-300 hover:text-opex-dark disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving}
              >
                Back
              </button>
            )}

            <button
              type="button"
              onClick={isPrivacyStep ? () => void handleComplete() : handleNext}
              className="inline-flex h-16 flex-1 items-center justify-center rounded-[1.3rem] bg-opex-dark px-8 text-base font-black text-white shadow-[0_20px_40px_-20px_rgba(12,33,49,0.55)] transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : isPrivacyStep ? (requiresRenewedConsent ? 'Accept and Continue' : 'Enter Opex') : currentQuestion.ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};



