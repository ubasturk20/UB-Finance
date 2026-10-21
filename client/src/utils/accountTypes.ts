import { ACCOUNT_TYPES, type AccountTypeInfo } from '../types';

const BY_TYPE = new Map(ACCOUNT_TYPES.map((t) => [t.value, t]));

/** Unknown types (e.g. from a newer version's backup) are treated as other assets */
export function accountTypeInfo(type: string): AccountTypeInfo {
  return BY_TYPE.get(type as AccountTypeInfo['value']) ?? BY_TYPE.get('other_asset')!;
}

export function isLiabilityType(type: string): boolean {
  return accountTypeInfo(type).liability;
}

export function accountTypeLabel(type: string): string {
  return BY_TYPE.get(type as AccountTypeInfo['value'])?.label ?? type;
}

/** Accounts with card details, statements and installments: credit cards and KMH */
export function isCardType(type: string): boolean {
  return type === 'credit' || type === 'line_of_credit';
}

/** Loans with a payment plan: ihtiyaç, konut, taşıt and eğitim kredisi */
export function isLoanType(type: string): boolean {
  return type === 'mortgage' || type === 'auto_loan' || type === 'student_loan' || type === 'loan';
}

/** BSMV and KKDF (basis points) suggested for a loan: konut kredisi 0, others %15 each */
export function defaultLoanTaxBp(type: string): number {
  return type === 'mortgage' ? 0 : 1_500;
}
