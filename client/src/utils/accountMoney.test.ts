import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { assetsAndLiabilities, earlierValue } from './accountMoney';

describe('earlierValue', () => {
  it("rescales an earlier balance by today's rate exactly, even for large balances", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1e12, max: 1e12 }).filter((b) => b !== 0),
        fc.integer({ min: 1, max: 3_000_000 }),
        fc.integer({ min: -1e12, max: 1e12 }),
        (balance, permille, earlier) => {
          // Today's value at a rate of permille/1000
          const value = Math.round((balance * permille) / 1000);
          if (value === 0) return;
          const result = earlierValue(
            { balance, mainBalance: value, rateDate: '2026-01-01' },
            earlier,
          );
          const exact = (BigInt(earlier) * BigInt(value)) / BigInt(balance);
          // Within one unit of the exact rescale, and with its sign
          expect(Math.abs(Number(BigInt(result!) - exact))).toBeLessThanOrEqual(1);
        },
      ),
    );
  });

  it('keeps amounts in the budget currency, and has nothing to go on without a rate', () => {
    expect(earlierValue({ balance: 500, mainBalance: 500, rateDate: null }, 300)).toBe(300);
    expect(earlierValue({ balance: 500, mainBalance: null, rateDate: null }, 300)).toBeNull();
    expect(earlierValue({ balance: 0, mainBalance: 0, rateDate: '2026-01-01' }, 300)).toBeNull();
    expect(earlierValue({ balance: -1000, mainBalance: -900, rateDate: '2026-01-01' }, -500)).toBe(
      -450,
    );
  });
});

describe('assetsAndLiabilities', () => {
  it('splits accounts by type and adds up to the total, leaving out ones without a rate', () => {
    const accountArb = fc.record({
      type: fc.constantFrom('checking', 'credit', 'investment', 'mortgage', 'other_liability'),
      balance: fc.integer({ min: -1e10, max: 1e10 }),
      mainBalance: fc.option(fc.integer({ min: -1e10, max: 1e10 })),
    });
    fc.assert(
      fc.property(fc.array(accountArb, { maxLength: 20 }), (accounts) => {
        const { assets, liabilities } = assetsAndLiabilities(accounts);
        const total = accounts.reduce((sum, a) => sum + (a.mainBalance ?? 0), 0);
        expect(assets + liabilities).toBe(total);
      }),
    );
    expect(
      assetsAndLiabilities([
        { type: 'checking', balance: 1000, mainBalance: 1000 },
        { type: 'credit', balance: -300, mainBalance: -300 },
        { type: 'loan', balance: -500, mainBalance: null },
      ]),
    ).toEqual({ assets: 1000, liabilities: -300 });
  });
});
