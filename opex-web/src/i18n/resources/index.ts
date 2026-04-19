import { appEn } from './en/app';
import { bankingEn } from './en/banking';
import { budgetEn } from './en/budget';
import { commonEn } from './en/common';
import { dashboardEn } from './en/dashboard';
import { settingsEn } from './en/settings';
import { taxesEn } from './en/taxes';
import { appIt } from './it/app';
import { bankingIt } from './it/banking';
import { budgetIt } from './it/budget';
import { commonIt } from './it/common';
import { dashboardIt } from './it/dashboard';
import { settingsIt } from './it/settings';
import { taxesIt } from './it/taxes';

export const resources = {
  it: {
    app: appIt,
    banking: bankingIt,
    budget: budgetIt,
    common: commonIt,
    dashboard: dashboardIt,
    settings: settingsIt,
    taxes: taxesIt
  },
  en: {
    app: appEn,
    banking: bankingEn,
    budget: budgetEn,
    common: commonEn,
    dashboard: dashboardEn,
    settings: settingsEn,
    taxes: taxesEn
  }
} as const;
