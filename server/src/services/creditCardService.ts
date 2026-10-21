import { and, asc, eq, gt, lte, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index.js';
import { accountDetails, accounts, installmentPlans, transactions } from '../db/schema.js';
import { accountTransactionSum, inAccountBalance } from './balances.js';
import {
  addMonth,
  cardSummary,
  closedMonth,
  currentInstallment,
  daysBetween,
  installmentShares,
  remainingInstallments,
  statementDates,
  type CardSummary,
  type PeriodTransaction,
} from './creditCard.js';

// Database side of credit card tracking (the math is in creditCard.ts). Every write to
// account_details and installment_plans goes through here.

export type AccountDetails = typeof accountDetails.$inferSelect;
export type DetailsPatch = Partial<
  Pick<
    AccountDetails,
    'creditLimit' | 'statementDay' | 'dueDay' | 'minPaymentRate' | 'interestRate'
  >
>;

/** A card's details; every field null when none were entered */
export function getDetails(accountId: string): AccountDetails {
  return (
    db.select().from(accountDetails).where(eq(accountDetails.accountId, accountId)).get() ?? {
      accountId,
      creditLimit: null,
      statementDay: null,
      dueDay: null,
      minPaymentRate: null,
      interestRate: null,
      updatedAt: '',
    }
  );
}

/** Saves the fields in `patch`, keeping the others */
export function saveDetails(accountId: string, patch: DetailsPatch): AccountDetails {
  const updatedAt = new Date().toISOString();
  db.insert(accountDetails)
    .values({ ...getDetails(accountId), ...patch, accountId, updatedAt })
    .onConflictDoUpdate({ target: accountDetails.accountId, set: { ...patch, updatedAt } })
    .run();
  return getDetails(accountId);
}

const hasDetails = (d: AccountDetails) =>
  d.creditLimit !== null ||
  d.statementDay !== null ||
  d.dueDay !== null ||
  d.minPaymentRate !== null ||
  d.interestRate !== null;

/** The statement month still open on `today` (new purchases are billed on it) */
function openMonth(details: AccountDetails, today: string): string {
  if (details.statementDay === null) return today.slice(0, 7);
  return statementDates(today, details.statementDay, details.dueDay).nextStatementMonth;
}

export interface InstallmentRow {
  id: string;
  accountId: string;
  transactionId: string | null;
  description: string;
  totalAmount: number;
  installmentCount: number;
  firstMonth: string;
  createdAt: string;
  /** The first (largest) installment; the others are the same or one kuruş less */
  perInstallment: number;
  /** The installment the open statement bills (0 before the first, count after the last) */
  current: number;
  /** Installments not billed on a closed statement yet, and what they add up to */
  remainingCount: number;
  remainingAmount: number;
}

function planRows(accountId: string) {
  return db
    .select()
    .from(installmentPlans)
    .where(eq(installmentPlans.accountId, accountId))
    .orderBy(asc(installmentPlans.firstMonth), asc(installmentPlans.createdAt))
    .all();
}

function shownPlan(
  plan: typeof installmentPlans.$inferSelect,
  open: string,
  closed: string,
): InstallmentRow {
  const rest = remainingInstallments(plan, closed);
  return {
    ...plan,
    perInstallment: installmentShares(plan.totalAmount, plan.installmentCount)[0] ?? 0,
    current: currentInstallment(plan, open),
    remainingCount: rest.count,
    remainingAmount: rest.amount,
  };
}

export function listInstallments(accountId: string, today: string): InstallmentRow[] {
  const details = getDetails(accountId);
  const open = openMonth(details, today);
  const closed = closedMonth(
    details.statementDay === null ? null : addMonth(open, -1),
    today.slice(0, 7),
  );
  return planRows(accountId).map((plan) => shownPlan(plan, open, closed));
}

export interface NewInstallmentPlan {
  description: string;
  totalAmount: number;
  installmentCount: number;
  firstMonth: string;
  transactionId?: string | null;
}

export function createInstallmentPlan(
  accountId: string,
  data: NewInstallmentPlan,
  today: string,
): InstallmentRow {
  const id = nanoid();
  db.insert(installmentPlans)
    .values({
      id,
      accountId,
      transactionId: data.transactionId ?? null,
      description: data.description,
      totalAmount: data.totalAmount,
      installmentCount: data.installmentCount,
      firstMonth: data.firstMonth,
      createdAt: new Date().toISOString(),
    })
    .run();
  return listInstallments(accountId, today).find((p) => p.id === id)!;
}

/** False when there was no such plan. The purchase on the card (if any) stays. */
export function deleteInstallmentPlan(id: string): boolean {
  const existing = db.select().from(installmentPlans).where(eq(installmentPlans.id, id)).get();
  if (!existing) return false;
  db.delete(installmentPlans).where(eq(installmentPlans.id, id)).run();
  return true;
}

export interface CardSummaryResponse extends CardSummary {
  accountId: string;
  /** The account's currency (null = the budget's) */
  currency: string | null;
  balance: number;
  hasDetails: boolean;
  limit: number | null;
  statementDay: number | null;
  dueDay: number | null;
  minPaymentRate: number | null;
  interestRate: number | null;
  lastStatement: string | null;
  nextStatement: string | null;
  dueDate: string | null;
  /** Days from today to the due date (negative once it has passed) */
  daysUntilDue: number | null;
  /** The month the open statement bills (the default first month of a new installment plan) */
  openMonth: string;
  today: string;
}

/** Null when there's no such account */
export function cardSummaryFor(accountId: string, today: string): CardSummaryResponse | null {
  const account = db.select().from(accounts).where(eq(accounts.id, accountId)).get();
  if (!account) return null;
  const details = getDetails(accountId);
  const balance = account.startingBalance + accountTransactionSum(accountId);
  const plans = planRows(accountId);
  const installmentTxIds = new Set(plans.map((p) => p.transactionId).filter(Boolean));

  const dates =
    details.statementDay === null
      ? null
      : statementDates(today, details.statementDay, details.dueDay);

  let periodTransactions: PeriodTransaction[] = [];
  let paymentsSinceStatement = 0;
  if (dates) {
    // The closed period: after the statement before it, up to and including its day. Split
    // parts are left out (the parent holds the full amount, like the balance counts it).
    const rows = db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        transferId: transactions.transferTransactionId,
        isAdjustment: transactions.isAdjustment,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId),
          inAccountBalance,
          gt(transactions.date, dates.previousStatement),
          lte(transactions.date, dates.lastStatement),
        ),
      )
      .all();
    // Payments and transfers move money onto the card; corrections aren't spending either
    const kindOf = (row: (typeof rows)[number]): PeriodTransaction['kind'] => {
      if (row.transferId !== null || row.isAdjustment === 1) return 'transfer';
      return installmentTxIds.has(row.id) ? 'installment' : 'spending';
    };
    periodTransactions = rows.map((row) => ({ amount: row.amount, kind: kindOf(row) }));

    // Everything that came onto the card since the statement: payments, transfers, refunds
    paymentsSinceStatement =
      db
        .select({ sum: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
        .from(transactions)
        .where(
          and(
            eq(transactions.accountId, accountId),
            inAccountBalance,
            gt(transactions.date, dates.lastStatement),
            gt(transactions.amount, 0),
          ),
        )
        .get()?.sum ?? 0;
  }

  const summary = cardSummary({
    balance,
    limit: details.creditLimit,
    minRate: details.minPaymentRate,
    periodTransactions,
    paymentsSinceStatement,
    plans,
    statementMonth: dates?.statementMonth ?? null,
    currentMonth: today.slice(0, 7),
  });

  return {
    ...summary,
    accountId,
    currency: account.currency,
    balance,
    hasDetails: hasDetails(details),
    limit: details.creditLimit,
    statementDay: details.statementDay,
    dueDay: details.dueDay,
    minPaymentRate: details.minPaymentRate,
    interestRate: details.interestRate,
    lastStatement: dates?.lastStatement ?? null,
    nextStatement: dates?.nextStatement ?? null,
    dueDate: dates?.dueDate ?? null,
    daysUntilDue: dates?.dueDate ? daysBetween(today, dates.dueDate) : null,
    openMonth: openMonth(details, today),
    today,
  };
}
