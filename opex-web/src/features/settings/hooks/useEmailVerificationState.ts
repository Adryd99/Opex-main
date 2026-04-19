import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmailVerificationRequestResult, VerificationEmailActionState } from '../types';

export const formatVerificationCooldown = (seconds: number): string => {
  const normalized = Math.max(0, seconds);
  const minutes = Math.floor(normalized / 60);
  const remainingSeconds = normalized % 60;

  if (minutes <= 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

type UseEmailVerificationStateArgs = {
  emailVerified: boolean;
  onRequestEmailVerification: () => Promise<EmailVerificationRequestResult>;
};

export const useEmailVerificationState = ({
  emailVerified,
  onRequestEmailVerification
}: UseEmailVerificationStateArgs): {
  isSendingVerificationEmail: boolean;
  verificationEmailAction: VerificationEmailActionState;
} => {
  const { t } = useTranslation('settings');
  const [isSendingVerificationEmail, setIsSendingVerificationEmail] = useState(false);
  const [verificationEmailDetail, setVerificationEmailDetail] = useState<string | null>(null);
  const [verificationEmailCooldownSeconds, setVerificationEmailCooldownSeconds] = useState(0);

  const requestVerificationEmail = useCallback(async () => {
    setIsSendingVerificationEmail(true);
    setVerificationEmailDetail(null);

    try {
      const response = await onRequestEmailVerification();
      setVerificationEmailCooldownSeconds(Math.max(0, response.cooldownRemainingSeconds ?? 0));

      if (response.emailVerified) {
        setVerificationEmailDetail(t('profile.verified'));
        return;
      }

      if (response.verificationEmailSent || response.cooldownRemainingSeconds > 0) {
        setVerificationEmailDetail(t('notices.profile.verifyEmailDescription'));
        return;
      }

      setVerificationEmailDetail(t('notices.profile.verifyEmailTitle'));
    } catch {
      setVerificationEmailDetail(null);
    } finally {
      setIsSendingVerificationEmail(false);
    }
  }, [onRequestEmailVerification, t]);

  useEffect(() => {
    if (emailVerified) {
      setVerificationEmailDetail(null);
      setVerificationEmailCooldownSeconds(0);
    }
  }, [emailVerified]);

  useEffect(() => {
    if (verificationEmailCooldownSeconds <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setVerificationEmailCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [verificationEmailCooldownSeconds]);

  const cooldownLabel = formatVerificationCooldown(verificationEmailCooldownSeconds);

  return {
    isSendingVerificationEmail,
    verificationEmailAction: {
      cta: isSendingVerificationEmail
        ? t('profileEditor.savingChanges')
        : verificationEmailCooldownSeconds > 0
          ? t('profile.retryIn', { cooldown: cooldownLabel })
          : t('profile.verifyEmail'),
      detail: verificationEmailCooldownSeconds > 0
        ? t('profile.verifyEmailCooldown', { cooldown: cooldownLabel })
        : verificationEmailDetail ?? t('profile.sendVerificationLink'),
      actionDisabled: isSendingVerificationEmail || verificationEmailCooldownSeconds > 0,
      requestVerificationEmail
    }
  };
};
