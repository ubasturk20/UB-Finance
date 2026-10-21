import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { parseDayOfMonth, parsePercent, percentToInput } from './percent';

describe('parsePercent', () => {
  it('reads percentages the way people type them', () => {
    expect(parsePercent('%20')).toBe(2_000);
    expect(parsePercent('20')).toBe(2_000);
    expect(parsePercent('4,25')).toBe(425);
    expect(parsePercent('4.25 %')).toBe(425);
    expect(parsePercent('% 4,5')).toBe(450);
    expect(parsePercent('100')).toBe(10_000);
    expect(parsePercent('0')).toBe(0);
  });

  it("refuses what isn't a percentage", () => {
    for (const text of ['', '%', 'abc', '-5', '4,255', '1.000,5', '100,01', '1e2', '4,']) {
      expect(parsePercent(text)).toBeNull();
    }
  });

  it('reads back what it shows, for every rate', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000 }), (bp) => {
        expect(parsePercent(percentToInput(bp))).toBe(bp);
        expect(parsePercent(`%${percentToInput(bp)}`)).toBe(bp);
      }),
    );
  });

  it('shows rates without trailing zeros', () => {
    expect(percentToInput(2_000)).toBe('20');
    expect(percentToInput(425)).toBe('4,25');
    expect(percentToInput(450)).toBe('4,5');
    expect(percentToInput(5)).toBe('0,05');
    expect(percentToInput(null)).toBe('');
  });
});

describe('parseDayOfMonth', () => {
  it('takes 1-31 only', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100, max: 100 }), (n) => {
        expect(parseDayOfMonth(String(n))).toBe(n >= 1 && n <= 31 ? n : null);
      }),
    );
    expect(parseDayOfMonth(' 15 ')).toBe(15);
    expect(parseDayOfMonth('')).toBeNull();
    expect(parseDayOfMonth('1,5')).toBeNull();
  });
});
