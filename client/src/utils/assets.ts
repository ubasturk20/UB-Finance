// Quantity-based assets (altın, döviz, fon, hisse, kripto): an amount held, in a unit, at a
// unit price. Exact: quantities are decimal text read as BigInts, never through parseFloat.
// The same file is at client/src/utils/assets.ts and server/src/services/assets.ts: keep them
// identical (assets.test.ts checks). No imports, so it works in both.

/** Decimals a quantity may have (0,00000001 BTC) */
export const QUANTITY_DECIMALS = 8;

/** The longest unit text ("cumhuriyet altını" fits) */
export const UNIT_MAX_LENGTH = 20;

const QUANTITY_RE = /^(\d{1,12})(?:\.(\d{1,8}))?$/;

/** A stored quantity: "12.5", "0.00012", "3" (a dot, no grouping, at most 8 decimals) */
export function isQuantity(text: string): boolean {
  return QUANTITY_RE.test(text);
}

/** The canonical form of a stored quantity ("012.50" → "12.5"), or null if it isn't one */
export function normalizeQuantity(text: string): string | null {
  const m = QUANTITY_RE.exec(text.trim());
  if (!m) return null;
  const whole = m[1].replace(/^0+(?=\d)/, '');
  const frac = (m[2] ?? '').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole;
}

/**
 * A quantity as people type it, in the stored form: "12,5" and "12.5" are both 12.5; with both
 * separators the last one is the decimal one ("1.234,5", "1,234.5"); one kind repeated is
 * grouping ("1.234.567"). Null when it isn't a quantity (or has more than 8 decimals).
 */
export function quantityFromInput(text: string): string | null {
  const s = text.replace(/[\s ']/g, '');
  if (!/^[\d.,]+$/.test(s)) return null;
  const dots = s.split('.').length - 1;
  const commas = s.split(',').length - 1;
  let plain: string;
  if (dots > 0 && commas > 0) {
    const decimal = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ',';
    const group = decimal === '.' ? ',' : '.';
    if (s.split(decimal).length - 1 > 1) return null;
    plain = s.split(group).join('').replace(decimal, '.');
  } else if (dots + commas === 1) {
    plain = s.replace(',', '.');
  } else if (dots + commas > 1) {
    plain = s.replace(/[.,]/g, '');
  } else {
    plain = s;
  }
  return normalizeQuantity(plain);
}

/**
 * What `quantity` units are worth at `unitPrice` (minor units of the account's currency), in
 * the same minor units: multiplied exactly and rounded once, halves away from zero. Null when
 * the quantity isn't one or the result doesn't fit in a safe integer.
 */
export function assetValue(quantity: string, unitPrice: number): number | null {
  const m = QUANTITY_RE.exec(quantity.trim());
  if (!m || !Number.isSafeInteger(unitPrice)) return null;
  const frac = m[2] ?? '';
  const n = BigInt(m[1] + frac) * BigInt(unitPrice);
  const d = 10n ** BigInt(frac.length);
  let q = n / d;
  const r = n % d;
  if (2n * (r < 0n ? -r : r) >= d) q += n < 0n ? -1n : 1n;
  const value = Number(q);
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * How many units `amount` buys at `unitPrice` (both in the same minor units), with `digits`
 * decimals, rounded halves away from zero: net worth in grams of gold. Null for a price of 0.
 */
export function unitsFor(amount: number, unitPrice: number, digits = 2): number | null {
  if (unitPrice <= 0 || !Number.isSafeInteger(amount) || !Number.isSafeInteger(unitPrice)) {
    return null;
  }
  const scale = 10n ** BigInt(digits);
  const n = BigInt(amount) * scale;
  const d = BigInt(unitPrice);
  let q = n / d;
  const r = n % d;
  if (2n * (r < 0n ? -r : r) >= d) q += n < 0n ? -1n : 1n;
  return Number(q) / Number(scale);
}
