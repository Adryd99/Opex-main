import { Briefcase, Globe, Users } from 'lucide-react';
import React from 'react';

export type OnboardingQuestionField = 'fullName' | 'residence' | 'occupation';

export type OnboardingQuestionStep = {
  field: OnboardingQuestionField;
  step: number;
  title: string;
  description: string;
  fieldLabel: string;
  placeholder: string;
  ctaLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string; }>;
};

export const ONBOARDING_QUESTION_STEPS: OnboardingQuestionStep[] = [
  {
    field: 'fullName',
    step: 1,
    title: 'What should we call you?',
    description: 'Your name helps us personalize your dashboard insights.',
    fieldLabel: 'Full Name',
    placeholder: 'Type here...',
    ctaLabel: 'Next Question',
    icon: Users
  },
  {
    field: 'residence',
    step: 2,
    title: 'Where are you based?',
    description: 'Tax rules and bank integrations vary by country.',
    fieldLabel: 'Place of Residence',
    placeholder: 'Type here...',
    ctaLabel: 'Next Question',
    icon: Globe
  },
  {
    field: 'occupation',
    step: 3,
    title: "What's your occupation?",
    description: 'Tell us what you do to refine your expense categories.',
    fieldLabel: 'Job Title or Industry',
    placeholder: 'Type here...',
    ctaLabel: 'Review Privacy',
    icon: Briefcase
  }
];

export const toOptionalText = (value: string | null | undefined): string | null => {
  const trimmedValue = (value ?? '').trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};
