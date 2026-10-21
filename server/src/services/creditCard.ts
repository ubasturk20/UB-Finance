import { allocate } from '../utils/money.js';

// Credit card tracking the way Turkish cards work: a statement (hesap kesim) on a fixed day
// each month, a due date (son ödeme) after it, a minimum payment (asgari ödeme) as a share of
// the statement, and installment purchases (taksit) billed in equal parts on later statements.
// Pure: no database, no clock (`today` comes in as a parameter), so it runs anywhere.

/** yyyy-MM-dd */
export type IsoDay = string;
/** yyyy-MM */
export type IsoMonth = string;

const pad = (n: number) => String(n).padStart(2, '0');

const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/** `day` of a month, or its last day when the month is shorter (31 → 30 Nisan, 28 Şubat) */
function clampedDay(year: number, month: number, day: number): IsoDay {
  return `${year}-${pad(month)}-${pad(Math.min(day, daysInMonth(year, month)))}`;
}

/** A month `delta` months after (or before) year/month, as [year, month] */
function shiftMonth(year: number, month: number, delta: number): [number, number] {
  const index = year * 12 + (month - 1) + delta;
  return [Math.floor(index / 12), (index % 12) + 1];
}

function parseDay(day: IsoDay): [number, number, number] {
  return [Number(day.slice(0, 4)), Number(day.slice(5, 7)), Number(day.slice(8, 10))];
}

/** The number of months from `from` to `to` (both yyyy-MM): 2026-01 → 2026-03 is 2 */
export function monthsBetween(from: IsoMonth, to: IsoMonth): number {
  const index = (m: IsoMonth) => Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1;
  return index(to) - index(from);
}

/** The month `delta` months after `month` */
export function addMonth(month: IsoMonth, delta: number): IsoMonth {
  const [y, m] = shiftMonth(Number(month.slice(0, 4)), Number(month.slice(5, 7)), delta);
  return `${y}-${pad(m)}`;
}

export interface StatementDates {
  /** The statement before the last one: the last period runs after it, up to `lastStatement` */
  previousStatement: IsoDay;
  /** The latest statement day on or before today */
  lastStatement: IsoDay;
  /** The statement after it (the current period closes then) */
  nextStatement: IsoDay;
  /** The last statement's due date: the first due day after it (null without a due day) */
  dueDate: IsoDay | null;
  /** The month of the last statement (its installments are billed on it) */
  statementMonth: IsoMonth;
  /** The month of the next statement (the next installments are billed on it) */
  nextStatementMonth: IsoMonth;
}

/**
 * A card's statement and due dates around `today`. Days 29-31 fall on the last day of shorter
 * months. The due date is the first `dueDay` after the last statement (a due day on or before
 * the statement day is in the following month).
 */
export function statementDates(
  today: IsoDay,
  statementDay: number,
  dueDay: number | null,
): StatementDates {
  const [y, m] = parseDay(today);
  let [ly, lm] = [y, m];
  if (clampedDay(y, m, statementDay) > today) [ly, lm] = shiftMonth(y, m, -1);
  const lastStatement = clampedDay(ly, lm, statementDay);
  const [py, pm] = shiftMonth(ly, lm, -1);
  const [ny, nm] = shiftMonth(ly, lm, 1);

  let dueDate: IsoDay | null = null;
  if (dueDay !== null) {
    const sameMonth = clampedDay(ly, lm, dueDay);
    dueDate = sameMonth > lastStatement ? sameMonth : clampedDay(ny, nm, dueDay);
  }

  return {
    previousStatement: clampedDay(py, pm, statementDay),
    lastStatement,
    nextStatement: clampedDay(ny, nm, statementDay),
    dueDate,
    statementMonth: `${ly}-${pad(lm)}`,
    nextStatementMonth: `${ny}-${pad(nm)}`,
  };
}

/** Equal installments that add up to exactly `total` (the first ones take the extra kuruş) */
export function installmentShares(total: number, count: number): number[] {
  if (count < 1) return [];
  return allocate(
    total,
    Array.from({ length: count }, () => 1),
  );
}

export interface InstallmentPlan {
  totalAmount: number;
  installmentCount: number;
  /** The statement month the first installment is billed on */
  firstMonth: IsoMonth;
}

/** What `plan` adds to the statement of `month` (0 outside its months) */
export function installmentDueInMonth(plan: InstallmentPlan, month: IsoMonth): number {
  const index = monthsBetween(plan.firstMonth, month);
  if (index < 0 || index >= plan.installmentCount) return 0;
  return installmentShares(plan.totalAmount, plan.installmentCount)[index];
}

export interface RemainingInstallments {
  /** Installments billed on statements up to and including `month` */
  billed: number;
  /** Installments still to come on later statements */
  count: number;
  /** What they add up to */
  amount: number;
}

/** The installments of `plan` still to be billed after the statement of `month` */
export function remainingInstallments(
  plan: InstallmentPlan,
  month: IsoMonth,
): RemainingInstallments {
  const shares = installmentShares(plan.totalAmount, plan.installmentCount);
  const billed = Math.min(
    plan.installmentCount,
    Math.max(0, monthsBetween(plan.firstMonth, month) + 1),
  );
  const rest = shares.slice(billed);
  return { billed, count: rest.length, amount: rest.reduce((a, b) => a + b, 0) };
}

/**
 * A transaction of the last statement period: `spending` (purchases and refunds), `transfer`
 * (payments, transfers and balance corrections, never spending) or `installment` (a purchase
 * recorded in full whose installments are billed instead).
 */
export interface PeriodTransaction {
  amount: number;
  kind: 'spending' | 'transfer' | 'installment';
}

export interface CardSummaryInput {
  /** The card's balance in its own currency: negative while money is owed */
  balance: number;
  limit: number | null;
  /** Minimum payment rate, basis points (2000 = 20%) */
  minRate: number | null;
  periodTransactions: PeriodTransaction[];
  /** Money that came onto the card after the last statement (payments, refunds) */
  paymentsSinceStatement: number;
  plans: InstallmentPlan[];
  /** The last statement's month; null while the card has no statement day */
  statementMonth: IsoMonth | null;
  /** Without a statement day, installments up to the month before this one count as billed */
  currentMonth: IsoMonth;
}

export interface CardSummary {
  /** What's owed now (0 when the card is in credit) */
  used: number;
  /** Limit minus what's owed (negative when over the limit); null without a limit */
  available: number | null;
  /** The last statement: its spending (less refunds) plus the installments billed on it */
  statementDebt: number | null;
  /** Rounded up to the kuruş */
  minimumPayment: number | null;
  /** The statement less what came in since it */
  remainingAfterPayments: number | null;
  /** Installments still to be billed on later statements */
  installmentDebtRemaining: number;
}

/**
 * The month of the latest closed statement. Without a statement day, months are taken as
 * statements: the previous month is the closed one.
 */
export const closedMonth = (statementMonth: IsoMonth | null, currentMonth: IsoMonth) =>
  statementMonth ?? addMonth(currentMonth, -1);

/** Whole days from `from` to `to` (yyyy-MM-dd): negative when `to` is earlier */
export function daysBetween(from: IsoDay, to: IsoDay): number {
  const utc = (d: IsoDay) => {
    const [y, m, day] = parseDay(d);
    return Date.UTC(y, m - 1, day);
  };
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

/**
 * Which installment of `plan` the open period's statement (`openMonth`) bills: 0 before the
 * first one, `installmentCount` once all of them have been billed. Shown as "2/6 taksit".
 */
export function currentInstallment(plan: InstallmentPlan, openMonth: IsoMonth): number {
  const n = monthsBetween(plan.firstMonth, openMonth) + 1;
  return Math.min(plan.installmentCount, Math.max(0, n));
}

const ceilDiv = (n: bigint, d: bigint) => (n + d - 1n) / d;

export function cardSummary(input: CardSummaryInput): CardSummary {
  const used = Math.max(0, -input.balance);
  const available = input.limit === null ? null : input.limit - used;
  const billedThrough = closedMonth(input.statementMonth, input.currentMonth);
  const installmentDebtRemaining = input.plans.reduce(
    (sum, plan) => sum + remainingInstallments(plan, billedThrough).amount,
    0,
  );

  if (input.statementMonth === null) {
    return {
      used,
      available,
      statementDebt: null,
      minimumPayment: null,
      remainingAfterPayments: null,
      installmentDebtRemaining,
    };
  }

  const statementMonth = input.statementMonth;
  const spending = input.periodTransactions
    .filter((tx) => tx.kind === 'spending')
    .reduce((sum, tx) => sum - tx.amount, 0);
  const installments = input.plans.reduce(
    (sum, plan) => sum + installmentDueInMonth(plan, statementMonth),
    0,
  );
  const statementDebt = Math.max(0, spending + installments);
  const minimumPayment =
    input.minRate === null
      ? null
      : Number(ceilDiv(BigInt(statementDebt) * BigInt(input.minRate), 10_000n));

  return {
    used,
    available,
    statementDebt,
    minimumPayment,
    remainingAfterPayments: Math.max(0, statementDebt - Math.max(0, input.paymentsSinceStatement)),
    installmentDebtRemaining,
  };
}
