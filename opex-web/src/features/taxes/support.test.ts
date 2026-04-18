import { describe, expect, it } from 'vitest';
import type { TaxBufferDashboardResponse } from '../../shared/types/tax';
import type { UserProfile } from '../../shared/types/user';
import {
  getInitialFiscalResidence,
  getSortedTaxDeadlines,
  getTaxLiabilities
} from './support';

const buildProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  name: 'Daniele',
  email: 'daniele@example.com',
  residence: 'Italy (IT)',
  vatFrequency: 'Yearly',
  logo: null,
  gdprAccepted: true,
  ...overrides
});

const buildDashboard = (
  overrides: Partial<TaxBufferDashboardResponse> = {}
): TaxBufferDashboardResponse => ({
  selectedConnectionId: 'connection-1',
  year: 2026,
  currency: 'EUR',
  summary: {
    shouldSetAside: 1000,
    alreadySaved: 500,
    missing: 500,
    completionPercentage: 50,
    weeklyTarget: 100,
    safeToSpend: 2000,
    targetDate: null
  },
  incomeSocial: {
    taxableIncome: 20000,
    incomeTax: 3000,
    socialContributions: 2000,
    subtotal: 5000
  },
  vat: {
    regime: 'Ordinario',
    rate: 22,
    vatLiability: 1500,
    warningMessage: null
  },
  liabilitySplit: [],
  deadlines: [],
  activity: [],
  providers: [],
  safeMode: {
    compliant: true,
    message: 'ok',
    recommendation: 'keep going'
  },
  ...overrides
});

describe('tax support', () => {
  it('prefers the explicit fiscal residence and falls back to a supported residence match', () => {
    expect(getInitialFiscalResidence(buildProfile({ fiscalResidence: 'Belgium (BE)' }))).toBe('Belgium (BE)');
    expect(getInitialFiscalResidence(buildProfile({ fiscalResidence: null, residence: 'Italy (IT)' }))).toBe(
      'Italy (IT)'
    );
    expect(getInitialFiscalResidence(buildProfile({ fiscalResidence: null, residence: 'Spain (ES)' }))).toBe('');
  });

  it('sorts deadlines chronologically', () => {
    const dashboard = buildDashboard({
      deadlines: [
        {
          id: 'late',
          title: 'Late',
          dueDate: '2026-07-16',
          status: 'OPEN',
          amount: 100,
          currency: 'EUR'
        },
        {
          id: 'early',
          title: 'Early',
          dueDate: '2026-05-16',
          status: 'OPEN',
          amount: 100,
          currency: 'EUR'
        }
      ]
    });

    expect(getSortedTaxDeadlines(dashboard).map((item) => item.id)).toEqual(['early', 'late']);
  });

  it('builds a fallback liability view when the backend split is empty', () => {
    expect(getTaxLiabilities(buildDashboard())).toEqual([
      { label: 'Income Tax', amount: 3000, percentage: 0 },
      { label: 'Social Contributions', amount: 2000, percentage: 0 },
      { label: 'VAT', amount: 1500, percentage: 0 }
    ]);
  });
});
