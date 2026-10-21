import { z } from 'zod';

// Keep in sync with ACCOUNT_TYPES in client/src/types/index.ts
export const ACCOUNT_TYPES = [
  'checking',
  'savings',
  'cash',
  'credit',
  'line_of_credit',
  'investment',
  'retirement',
  'crypto',
  'real_estate',
  'vehicle',
  'valuables',
  'mortgage',
  'auto_loan',
  'student_loan',
  'loan',
  'other_asset',
  'other_liability',
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const accountTypeSchema = z.enum(ACCOUNT_TYPES);

/** Debts: their balance is what's owed, stored as a negative number */
const LIABILITY_TYPES = new Set<string>([
  'credit',
  'line_of_credit',
  'mortgage',
  'auto_loan',
  'student_loan',
  'loan',
  'other_liability',
]);

/** Everyday spending accounts; everything else is tracked off budget by default */
const ON_BUDGET_TYPES = new Set<string>([
  'checking',
  'savings',
  'cash',
  'credit',
  'line_of_credit',
]);

export function isLiabilityType(type: string): boolean {
  return LIABILITY_TYPES.has(type);
}

export function defaultOffBudget(type: string): 0 | 1 {
  return ON_BUDGET_TYPES.has(type) ? 0 : 1;
}

/** Accounts with card details: a limit, statements and installments (credit card, KMH) */
const CARD_TYPES = new Set<string>(['credit', 'line_of_credit']);

export function isCardType(type: string): boolean {
  return CARD_TYPES.has(type);
}

/** Loans with a payment plan: ihtiyaç, konut, taşıt and eğitim kredisi */
const LOAN_TYPES = new Set<string>(['mortgage', 'auto_loan', 'student_loan', 'loan']);

export function isLoanType(type: string): boolean {
  return LOAN_TYPES.has(type);
}

/**
 * BSMV and KKDF (basis points) when a loan has none entered: konut kredisi is exempt from
 * both, other consumer loans pay %15 of each on the interest.
 */
export function defaultLoanTaxBp(type: string): number {
  return type === 'mortgage' ? 0 : 1_500;
}
