import { and, desc, eq, isNotNull, isNull, lte } from 'drizzle-orm';
import { db } from '../db/index.js';
import { accountDetails, accounts } from '../db/schema.js';
import { foldText } from '../utils/textFold.js';
import { accountTransactionSum } from './balances.js';
import { assetValue, unitsFor } from './assets.js';
import { getDetails, saveDetails, type AccountDetails } from './creditCardService.js';
import { convertAmount, currencyContext } from './mainAmountService.js';
import { netWorthOn } from './netWorth.js';
import { insertNewTransaction } from './ruleService.js';

// Database side of quantity-based assets (the math is in assets.ts). The details are saved with
// the card and loan details (account_details, through creditCardService.saveDetails).

export const ASSET_PRICE_NOTE = 'Birim fiyatı güncellemesi';

export interface AssetPriceSaved {
  ok: true;
  details: AccountDetails;
  /** The account's value now: quantity × unit price */
  value: number;
  /** The correction added (0 when the balance already was the value) */
  change: number;
  transactionId: string | null;
}

export type AssetPriceResult =
  AssetPriceSaved | { ok: false; reason: 'not_found' | 'no_quantity' | 'too_large' };

/**
 * Saves a new unit price and its day, and brings the account's balance to quantity × price
 * with a balance correction dated that day (as "Update value" does). Nothing is added when the
 * balance already is that.
 */
export function setAssetPrice(
  accountId: string,
  unitPrice: number,
  date: string,
): AssetPriceResult {
  const account = db.select().from(accounts).where(eq(accounts.id, accountId)).get();
  if (!account) return { ok: false, reason: 'not_found' };
  const quantity = getDetails(accountId).assetQuantity;
  if (quantity === null) return { ok: false, reason: 'no_quantity' };
  const value = assetValue(quantity, unitPrice);
  if (value === null) return { ok: false, reason: 'too_large' };

  const balance = account.startingBalance + accountTransactionSum(accountId);
  const change = value - balance;
  let transactionId: string | null = null;
  if (change !== 0) {
    const { transaction } = insertNewTransaction({
      accountId,
      date,
      amount: change,
      payeeId: null,
      payeeName: null,
      importedPayee: null,
      notes: ASSET_PRICE_NOTE,
      categoryId: null,
      importedId: null,
      isAdjustment: true,
    });
    transactionId = transaction.id;
  }
  const details = saveDetails(accountId, { assetUnitPrice: unitPrice, assetPriceDate: date });
  return { ok: true, details, value, change, transactionId };
}

/** The unit of a gram of gold, however it's written ("Gram Altın", "GRAM ALTIN", "gram altin") */
const GOLD_GRAM = foldText('gram altın');

export const isGoldGram = (unit: string | null) =>
  unit !== null && foldText(unit).replace(/\s+/g, ' ').trim() === GOLD_GRAM;

export interface Equivalent {
  /** In the other currency's minor units */
  value: number;
  /** The day of the rate used */
  rateDate: string;
}

export interface NetWorthEquivalents {
  /** Net worth today, in the budget's currency */
  netWorth: number;
  /** The budget's currency (null while none is chosen) */
  currency: string | null;
  /** Null without a rate, or when the budget is in that currency */
  usd: Equivalent | null;
  eur: Equivalent | null;
  /** Net worth in grams of gold at the latest gram price entered on an account */
  goldGram: { value: number; priceDate: string; accountName: string } | null;
  /** Currencies of accounts left out of the net worth for want of a rate */
  unconverted: string[];
}

function inCurrency(
  netWorth: number,
  currency: string,
  today: string,
  ctx: ReturnType<typeof currencyContext>,
): Equivalent | null {
  if (!ctx.budget || ctx.budget === currency) return null;
  const found = ctx.rates.find(ctx.budget, currency, today);
  const value = convertAmount(netWorth, ctx.budget, currency, today, ctx);
  return found && value !== null ? { value, rateDate: found.date } : null;
}

/** The open account with a gram-of-gold unit and the newest price up to `today` */
function latestGoldPrice(today: string) {
  const rows = db
    .select({
      name: accounts.name,
      currency: accounts.currency,
      unit: accountDetails.assetUnit,
      price: accountDetails.assetUnitPrice,
      priceDate: accountDetails.assetPriceDate,
    })
    .from(accountDetails)
    .innerJoin(accounts, eq(accounts.id, accountDetails.accountId))
    .where(
      and(
        isNull(accounts.closedAt),
        isNotNull(accountDetails.assetUnitPrice),
        isNotNull(accountDetails.assetPriceDate),
        lte(accountDetails.assetPriceDate, today),
      ),
    )
    .orderBy(desc(accountDetails.assetPriceDate), desc(accountDetails.updatedAt))
    .all();
  return rows.find((row) => isGoldGram(row.unit) && (row.price ?? 0) > 0) ?? null;
}

/** Net worth today in US dollars, euros and grams of gold, each when it can be worked out */
export function netWorthEquivalents(today: string): NetWorthEquivalents {
  const ctx = currencyContext();
  const { netWorth, unconverted } = netWorthOn(today, ctx);

  let goldGram: NetWorthEquivalents['goldGram'] = null;
  const gold = latestGoldPrice(today);
  if (gold) {
    // A price in another currency counts at today's rate
    const price = convertAmount(gold.price!, gold.currency ?? ctx.budget, ctx.budget, today, ctx);
    const grams = price === null ? null : unitsFor(netWorth, price);
    if (grams !== null) {
      goldGram = { value: grams, priceDate: gold.priceDate!, accountName: gold.name };
    }
  }

  return {
    netWorth,
    currency: ctx.budget,
    usd: inCurrency(netWorth, 'USD', today, ctx),
    eur: inCurrency(netWorth, 'EUR', today, ctx),
    goldGram,
    unconverted,
  };
}
