import { asc, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { accounts } from '../db/schema.js';
import { isForeign } from '../utils/currencies.js';
import { isCardType, isLoanType } from '../utils/accountTypes.js';
import { daysBetween } from './creditCard.js';
import { cardSummaryFor } from './creditCardService.js';
import { loanScheduleFor } from './loanService.js';
import { getBudgetSettings } from './mainAmountService.js';

// What the dashboard's "Yaklaşan Ödemeler" card shows: each open credit card's next due date
// and statement, and each open loan's next installment. The figures come from the card and
// loan services (the same ones the account pages show); this only gathers and sorts them.

export interface CardObligation {
  accountId: string;
  name: string;
  /** The account's currency (null = the budget's) */
  currency: string | null;
  /** The last statement's due date; null without a statement day and due day */
  dueDate: string | null;
  /** Days from today to the due date (negative once it has passed) */
  daysLeft: number | null;
  statementDebt: number | null;
  /** The statement less what came in since it */
  remaining: number | null;
  minimumPayment: number | null;
  /** Limit minus what's owed; null without a limit */
  available: number | null;
  /** What's owed on the card now */
  used: number;
}

export interface LoanObligation {
  accountId: string;
  name: string;
  currency: string | null;
  nextDate: string;
  daysLeft: number;
  nextAmount: number;
  remainingPrincipal: number;
  /** Installments due on or before today */
  paidCount: number;
  term: number;
}

export interface Obligations {
  cards: CardObligation[];
  loans: LoanObligation[];
  /** In the budget's currency: accounts in another currency are left out and named */
  totals: { cardDebt: number; loanPrincipal: number };
  unconverted: string[];
}

/** Nulls last, then by date */
const byDate = (a: string | null, b: string | null) =>
  a === b ? 0 : a === null ? 1 : b === null ? -1 : a < b ? -1 : 1;

/**
 * Open cards with details entered (by due date) and open loans with a payment plan and an
 * installment still to come (by next installment). Paid-off loans have nothing upcoming.
 */
export function obligationsFor(today: string): Obligations {
  const budget = getBudgetSettings().currency;
  const rows = db
    .select({ id: accounts.id, name: accounts.name, type: accounts.type })
    .from(accounts)
    .where(isNull(accounts.closedAt))
    .orderBy(asc(accounts.sortOrder))
    .all();

  const cards: CardObligation[] = [];
  const loans: LoanObligation[] = [];
  const totals = { cardDebt: 0, loanPrincipal: 0 };
  const unconverted = new Set<string>();

  for (const row of rows) {
    if (isCardType(row.type)) {
      const card = cardSummaryFor(row.id, today);
      if (!card?.hasDetails) continue;
      cards.push({
        accountId: row.id,
        name: row.name,
        currency: card.currency,
        dueDate: card.dueDate,
        daysLeft: card.daysUntilDue,
        statementDebt: card.statementDebt,
        remaining: card.remainingAfterPayments,
        minimumPayment: card.minimumPayment,
        available: card.available,
        used: card.used,
      });
      if (isForeign(card.currency, budget)) {
        if (card.used !== 0) unconverted.add(card.currency!);
      } else totals.cardDebt += card.used;
    } else if (isLoanType(row.type)) {
      const loan = loanScheduleFor(row.id, today);
      const next = loan?.status?.nextPayment;
      if (!loan?.schedule || !loan.status || !next) continue;
      loans.push({
        accountId: row.id,
        name: row.name,
        currency: loan.currency,
        nextDate: next.date,
        daysLeft: daysBetween(today, next.date),
        nextAmount: next.payment,
        remainingPrincipal: loan.status.remainingPrincipal,
        paidCount: loan.status.paidCount,
        term: loan.schedule.length,
      });
      if (isForeign(loan.currency, budget)) unconverted.add(loan.currency!);
      else totals.loanPrincipal += loan.status.remainingPrincipal;
    }
  }

  cards.sort((a, b) => byDate(a.dueDate, b.dueDate));
  loans.sort((a, b) => byDate(a.nextDate, b.nextDate));
  return { cards, loans, totals, unconverted: [...unconverted].sort() };
}
