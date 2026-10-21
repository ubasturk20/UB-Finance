// Loans the way Turkish banks pay them back (ihtiyaç, konut, taşıt, eğitim kredisi): equal
// monthly installments (eşit taksit), where each installment pays the month's interest, the
// taxes on that interest (KKDF and BSMV) and the rest goes to the principal (anapara).
// Pure: no database, no clock (`today` comes in as a parameter), so it runs anywhere.

/** yyyy-MM-dd */
export type IsoDay = string;

export interface LoanInput {
  /** Çekilen anapara, in minor units */
  principal: number;
  /** Aylık akdi faiz, basis points (349 = %3,49) */
  monthlyRateBp: number;
  /** Vade in months */
  term: number;
  /** The first installment's day; later ones fall on the same day each month */
  firstPayment: IsoDay;
  /** BSMV on the interest, basis points (1500 = %15) */
  bsmvBp: number;
  /** KKDF on the interest, basis points (1500 = %15) */
  kkdfBp: number;
}

export interface LoanRow {
  /** 1 for the first installment */
  n: number;
  date: IsoDay;
  /** The whole installment: principal + interest + KKDF + BSMV */
  payment: number;
  principal: number;
  interest: number;
  kkdf: number;
  bsmv: number;
  /** The principal still owed after this installment */
  balance: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/** The installment day `k` months after `first`: the same day, or a shorter month's last one */
export function paymentDate(first: IsoDay, k: number): IsoDay {
  const day = Number(first.slice(8, 10));
  const index = Number(first.slice(0, 4)) * 12 + Number(first.slice(5, 7)) - 1 + k;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${pad(month)}-${pad(Math.min(day, daysInMonth(year, month)))}`;
}

/** `amount · bp / 10 000`, rounded to the nearest minor unit (halves up), exactly */
function share(amount: number, bp: number): number {
  const n = BigInt(amount) * BigInt(bp);
  return Number((n * 2n + 10_000n) / 20_000n);
}

/** The effective monthly rate r' = r·(1 + BSMV + KKDF) as a fraction */
const effectiveRate = (input: Omit<LoanInput, 'firstPayment' | 'principal' | 'term'>) =>
  (input.monthlyRateBp / 10_000) * (1 + input.bsmvBp / 10_000 + input.kkdfBp / 10_000);

/**
 * The equal installment: `P·r' / (1 − (1 + r')^−n)` with the effective rate
 * `r' = r·(1 + BSMV + KKDF)`, as Turkish banks quote it; `P / n` without interest.
 */
export function loanPayment(input: Omit<LoanInput, 'firstPayment'>): number {
  const { principal, term } = input;
  if (term < 1) return 0;
  const effective = effectiveRate(input);
  if (effective === 0) return Math.round(principal / term);
  // -expm1(-n·log1p(r')) is 1 − (1 + r')^−n without losing digits when r' is small
  const factor = -Math.expm1(-term * Math.log1p(effective));
  return Math.round((principal * effective) / factor);
}

/**
 * The payment plan (ödeme planı), one row per installment. Every month's interest is the
 * remaining principal × the monthly rate, KKDF and BSMV are shares of that interest, and the
 * rest of the installment (A − faiz − KKDF − BSMV) pays the principal.
 *
 * Paying `A − costs` month after month lets rounding errors compound (by (1 + r')^n over a long
 * loan), so the principal part is taken instead from where the exact plan stands after each
 * installment, rounded to the minor unit: the installment stays within a kuruş or two of A,
 * the balance never rises, the principal parts add up to exactly `principal`, and the last
 * installment closes the loan (balance 0).
 */
export function loanSchedule(input: LoanInput): LoanRow[] {
  const term = Math.max(0, Math.floor(input.term));
  const total = Math.max(0, Math.round(input.principal));
  const rate = effectiveRate(input);
  const log = Math.log1p(rate);
  /** 1 − (1 + r')^−k, with negative powers only, so it never overflows */
  const discount = (k: number) => -Math.expm1(-k * log);
  /** What the exact plan still owes after `k` installments: P·(1 − v^(n−k)) / (1 − v^n) */
  const exactBalance = (k: number) =>
    rate === 0 ? (total * (term - k)) / term : (total * discount(term - k)) / discount(term);

  const rows: LoanRow[] = [];
  let balance = total;
  for (let n = 1; n <= term; n++) {
    const interest = share(balance, input.monthlyRateBp);
    const kkdf = share(interest, input.kkdfBp);
    const bsmv = share(interest, input.bsmvBp);
    const target = n === term ? 0 : Math.round(exactBalance(n));
    const next = Math.min(balance, Math.max(0, Number.isFinite(target) ? target : 0));
    const principal = balance - next;
    balance = next;
    rows.push({
      n,
      date: paymentDate(input.firstPayment, n - 1),
      payment: principal + interest + kkdf + bsmv,
      principal,
      interest,
      kkdf,
      bsmv,
      balance,
    });
  }
  return rows;
}

export interface LoanStatus {
  /** Installments due on or before today (taken as paid) */
  paidCount: number;
  remainingCount: number;
  /** The principal of the installments still to come (kalan anapara) */
  remainingPrincipal: number;
  /** The first installment after today; null once the loan is paid off */
  nextPayment: LoanRow | null;
  /** The regular installment (the first one; the last one may differ by a few kuruş) */
  monthlyPayment: number;
  /** What the remaining installments add up to: remaining principal + interest and taxes */
  totalRemainingPayment: number;
  /** Interest, KKDF and BSMV of the remaining installments */
  totalInterestAndTaxes: number;
  /** Interest, KKDF and BSMV over the whole loan */
  loanInterestAndTaxes: number;
}

/** Where a loan stands on `today`: installments dated today or earlier count as paid */
export function loanStatus(schedule: LoanRow[], today: IsoDay): LoanStatus {
  const rest = schedule.filter((row) => row.date > today);
  const sum = (rows: LoanRow[], pick: (row: LoanRow) => number) =>
    rows.reduce((total, row) => total + pick(row), 0);
  const costs = (row: LoanRow) => row.interest + row.kkdf + row.bsmv;
  return {
    paidCount: schedule.length - rest.length,
    remainingCount: rest.length,
    remainingPrincipal: sum(rest, (row) => row.principal),
    nextPayment: rest[0] ?? null,
    monthlyPayment: schedule[0]?.payment ?? 0,
    totalRemainingPayment: sum(rest, (row) => row.payment),
    totalInterestAndTaxes: sum(rest, costs),
    loanInterestAndTaxes: sum(schedule, costs),
  };
}
