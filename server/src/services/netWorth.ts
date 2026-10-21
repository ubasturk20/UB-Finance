import { and, isNull, lte, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { accounts, transactions } from '../db/schema.js';
import { isLiabilityType } from '../utils/accountTypes.js';
import { isForeign } from '../utils/currencies.js';
import { inAccountBalance } from './balances.js';
import { valueToday, type CurrencyContext } from './mainAmountService.js';

// Net worth: what the open accounts are worth in the budget's currency, assets less what's
// owed. The Net Worth report adds it up for every period with addUpNetWorth; the net worth
// equivalents (USD, EUR, grams of gold) start from netWorthOn.

export interface AccountBalance {
  type: string;
  /** The account's own currency (null = the budget's) */
  currency: string | null;
  /** In the account's currency */
  balance: number;
}

export interface NetWorthTotals {
  assets: number;
  liabilities: number;
  netWorth: number;
  /** Currencies of accounts left out for want of a rate on that day */
  unconverted: string[];
}

/**
 * Assets and liabilities in the budget's currency, accounts in another currency at the rate on
 * `date`. An account without a rate is left out and named in `unconverted` (when it has money).
 */
export function addUpNetWorth(
  balances: AccountBalance[],
  ctx: CurrencyContext,
  date: string,
): NetWorthTotals {
  let assets = 0;
  let liabilities = 0;
  const unconverted = new Set<string>();
  for (const item of balances) {
    let balance = item.balance;
    const currency = item.currency ?? ctx.budget;
    if (isForeign(currency, ctx.budget)) {
      const value = valueToday(balance, currency, ctx, date);
      if (value.mainBalance === null) {
        if (balance !== 0) unconverted.add(currency!);
        continue;
      }
      balance = value.mainBalance;
    }
    if (isLiabilityType(item.type)) liabilities += Math.abs(Math.min(balance, 0));
    else assets += Math.max(balance, 0);
  }
  return {
    assets,
    liabilities,
    netWorth: assets - liabilities,
    unconverted: [...unconverted].sort(),
  };
}

/** Net worth at the end of `date`: open accounts with the transactions up to that day */
export function netWorthOn(date: string, ctx: CurrencyContext): NetWorthTotals {
  const sums = new Map(
    db
      .select({
        accountId: transactions.accountId,
        total: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(and(lte(transactions.date, date), inAccountBalance))
      .groupBy(transactions.accountId)
      .all()
      .map((row) => [row.accountId, row.total]),
  );
  const open = db.select().from(accounts).where(isNull(accounts.closedAt)).all();
  const balances = open.map((account) => ({
    type: account.type,
    currency: account.currency,
    balance: account.startingBalance + (sums.get(account.id) ?? 0),
  }));
  return addUpNetWorth(balances, ctx, date);
}
