import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import {
  assetValue,
  isQuantity,
  normalizeQuantity,
  quantityFromInput,
  unitsFor,
} from './assets.js';

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8').replace(/\r\n/g, '\n');

// A quantity as its count of 10⁻⁸ units and its decimal text, small enough that every value
// below fits in a safe integer
const quantity = fc
  .tuple(fc.bigInt({ min: 0n, max: 10n ** 9n }), fc.integer({ min: 0, max: 8 }))
  .map(([units, decimals]) => {
    const s = units.toString().padStart(decimals + 1, '0');
    const text = decimals ? `${s.slice(0, -decimals)}.${s.slice(-decimals)}` : s;
    return { text, scaled: units * 10n ** BigInt(8 - decimals) };
  });

const price = fc.integer({ min: 0, max: 1_000_000 });

describe('asset values', () => {
  it('is the same file as the client copy', () => {
    expect(read('../../../client/src/utils/assets.ts')).toBe(read('./assets.ts'));
  });

  it('is the exact product, rounded once to the nearest minor unit', () => {
    fc.assert(
      fc.property(quantity, price, ({ text, scaled }, unitPrice) => {
        const value = assetValue(text, unitPrice);
        // value · 10⁸ is within half a minor unit of quantity · price
        const exact = scaled * BigInt(unitPrice);
        const diff = BigInt(value!) * 10n ** 8n - exact;
        expect(2n * (diff < 0n ? -diff : diff) <= 10n ** 8n).toBe(true);
        if (diff !== 0n && 2n * (diff < 0n ? -diff : diff) === 10n ** 8n) {
          expect(diff > 0n).toBe(true); // a half rounds up
        }
      }),
    );
  });

  it('grows with the quantity and the price', () => {
    fc.assert(
      fc.property(quantity, quantity, price, (a, b, unitPrice) => {
        const [lo, hi] = a.scaled <= b.scaled ? [a, b] : [b, a];
        expect(assetValue(lo.text, unitPrice)!).toBeLessThanOrEqual(
          assetValue(hi.text, unitPrice)!,
        );
      }),
    );
  });

  it('reads the usual cases', () => {
    expect(assetValue('12.5', 295_000)).toBe(3_687_500);
    expect(assetValue('10', 300_000)).toBe(3_000_000);
    expect(assetValue('0.005', 100)).toBe(1); // 0,5 kuruş rounds up
    expect(assetValue('0.004', 100)).toBe(0);
    expect(assetValue('0.12345678', 250_000_000)).toBe(30_864_195);
    expect(assetValue('12,5', 100)).toBeNull();
    expect(assetValue('0.123456789', 100)).toBeNull();
    expect(assetValue('-1', 100)).toBeNull();
    expect(assetValue('1', 1.5)).toBeNull();
  });

  it('reads quantities typed with a comma or a dot', () => {
    expect(quantityFromInput('12,5')).toBe('12.5');
    expect(quantityFromInput(' 12.50 ')).toBe('12.5');
    expect(quantityFromInput('1.234,5')).toBe('1234.5');
    expect(quantityFromInput('1,234.5')).toBe('1234.5');
    expect(quantityFromInput('1.234.567')).toBe('1234567');
    expect(quantityFromInput('0,00000001')).toBe('0.00000001');
    expect(quantityFromInput('0,000000001')).toBeNull();
    expect(quantityFromInput('')).toBeNull();
    expect(quantityFromInput('-3')).toBeNull();
    expect(quantityFromInput('on iki')).toBeNull();
  });

  it('keeps any stored quantity as it is, once normalized', () => {
    fc.assert(
      fc.property(quantity, ({ text }) => {
        const normal = normalizeQuantity(text)!;
        expect(isQuantity(normal)).toBe(true);
        expect(quantityFromInput(normal.replace('.', ','))).toBe(normal);
        expect(normalizeQuantity(normal)).toBe(normal);
        expect(assetValue(normal, 12_345)).toBe(assetValue(text, 12_345));
      }),
    );
  });

  it('turns an amount back into units', () => {
    expect(unitsFor(3_000_000, 300_000)).toBe(10);
    expect(unitsFor(12_345_678, 295_000)).toBe(41.85);
    expect(unitsFor(100, 0)).toBeNull();
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1e9 }), fc.integer({ min: 1, max: 1e9 }), (a, p) => {
        const units = unitsFor(a, p)!;
        expect(Math.abs(units - a / p)).toBeLessThanOrEqual(0.005 + 1e-9);
      }),
    );
  });
});
