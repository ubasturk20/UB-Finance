import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { loanPayment, loanSchedule, loanStatus, paymentDate, type LoanInput } from './loan.js';

const pad = (n: number) => String(n).padStart(2, '0');
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

const arbDay = fc
  .record({
    y: fc.integer({ min: 2000, max: 2080 }),
    m: fc.integer({ min: 1, max: 12 }),
    d: fc.integer({ min: 1, max: 31 }),
  })
  .map(({ y, m, d }) => `${y}-${pad(m)}-${pad(Math.min(d, lastDay(y, m)))}`);

const arbLoan: fc.Arbitrary<LoanInput> = fc.record({
  principal: fc.integer({ min: 0, max: 1e11 }),
  monthlyRateBp: fc.integer({ min: 0, max: 1_000 }),
  term: fc.integer({ min: 1, max: 360 }),
  firstPayment: arbDay,
  bsmvBp: fc.integer({ min: 0, max: 3_000 }),
  kkdfBp: fc.integer({ min: 0, max: 3_000 }),
});

const monthIndex = (day: string) => Number(day.slice(0, 4)) * 12 + Number(day.slice(5, 7));

describe('loanSchedule', () => {
  it('has one row per month of the term, numbered from 1', () => {
    fc.assert(
      fc.property(arbLoan, (loan) => {
        const rows = loanSchedule(loan);
        expect(rows).toHaveLength(loan.term);
        rows.forEach((row, i) => expect(row.n).toBe(i + 1));
      }),
    );
  });

  it('pays off exactly the principal, the balance falling to 0', () => {
    fc.assert(
      fc.property(arbLoan, (loan) => {
        const rows = loanSchedule(loan);
        let previous = loan.principal;
        for (const row of rows) {
          expect(row.balance).toBeGreaterThanOrEqual(0);
          expect(row.balance).toBeLessThanOrEqual(previous);
          expect(row.principal).toBe(previous - row.balance);
          previous = row.balance;
        }
        expect(rows.reduce((sum, row) => sum + row.principal, 0)).toBe(loan.principal);
        expect(rows.at(-1)!.balance).toBe(0);
      }),
    );
  });

  it('every installment is its parts, in whole minor units', () => {
    fc.assert(
      fc.property(arbLoan, (loan) => {
        for (const row of loanSchedule(loan)) {
          for (const part of [row.payment, row.principal, row.interest, row.kkdf, row.bsmv]) {
            expect(Number.isInteger(part)).toBe(true);
            expect(part).toBeGreaterThanOrEqual(0);
          }
          expect(row.payment).toBe(row.principal + row.interest + row.kkdf + row.bsmv);
        }
      }),
    );
  });

  it('interest is on the remaining principal, the taxes on the interest', () => {
    fc.assert(
      fc.property(arbLoan, (loan) => {
        let balance = loan.principal;
        for (const row of loanSchedule(loan)) {
          // Rounded to the nearest minor unit: off by at most half of one
          const off = (part: number, base: number, bp: number) =>
            Math.abs(part * 10_000 - base * bp);
          expect(off(row.interest, balance, loan.monthlyRateBp)).toBeLessThanOrEqual(5_000);
          expect(off(row.kkdf, row.interest, loan.kkdfBp)).toBeLessThanOrEqual(5_000);
          expect(off(row.bsmv, row.interest, loan.bsmvBp)).toBeLessThanOrEqual(5_000);
          balance = row.balance;
        }
      }),
    );
  });

  it('the installments are equal, give or take a few kuruş', () => {
    fc.assert(
      fc.property(arbLoan, (loan) => {
        const payment = loanPayment(loan);
        for (const row of loanSchedule(loan)) {
          expect(Math.abs(row.payment - payment)).toBeLessThanOrEqual(
            3 + Math.ceil(payment * 1e-9),
          );
        }
      }),
    );
  });

  it("falls due every month on the same day, or a shorter month's last day", () => {
    fc.assert(
      fc.property(arbLoan, (loan) => {
        const rows = loanSchedule(loan);
        const day = Number(loan.firstPayment.slice(8, 10));
        expect(rows[0].date).toBe(loan.firstPayment);
        rows.forEach((row, i) => {
          expect(monthIndex(row.date) - monthIndex(loan.firstPayment)).toBe(i);
          const [y, m] = [Number(row.date.slice(0, 4)), Number(row.date.slice(5, 7))];
          expect(Number(row.date.slice(8, 10))).toBe(Math.min(day, lastDay(y, m)));
          if (i > 0) expect(row.date > rows[i - 1].date).toBe(true);
        });
      }),
    );
  });

  it('without interest there is no interest or tax, only principal', () => {
    fc.assert(
      fc.property(arbLoan, (loan) => {
        const rows = loanSchedule({ ...loan, monthlyRateBp: 0 });
        for (const row of rows) {
          expect(row.interest).toBe(0);
          expect(row.kkdf).toBe(0);
          expect(row.bsmv).toBe(0);
          expect(row.payment).toBe(row.principal);
        }
      }),
    );
  });

  it('works through a Turkish example', () => {
    // 100.000 ₺ ihtiyaç kredisi, %3 aylık faiz, 12 ay, %15 BSMV + %15 KKDF (r' = %3,9)
    const rows = loanSchedule({
      principal: 10_000_000,
      monthlyRateBp: 300,
      term: 12,
      firstPayment: '2026-11-21',
      bsmvBp: 1_500,
      kkdfBp: 1_500,
    });
    const terms = { principal: 10_000_000, monthlyRateBp: 300, term: 12 };
    expect(loanPayment({ ...terms, bsmvBp: 1_500, kkdfBp: 1_500 })).toBe(1_059_348);
    expect(rows[0]).toEqual({
      n: 1,
      date: '2026-11-21',
      payment: 1_059_348,
      principal: 669_348,
      interest: 300_000,
      kkdf: 45_000,
      bsmv: 45_000,
      balance: 9_330_652,
    });
    expect(rows.at(-1)!.date).toBe('2027-10-21');
    // Konut kredisi: no BSMV or KKDF
    const home = loanSchedule({
      principal: 10_000_000,
      monthlyRateBp: 300,
      term: 12,
      firstPayment: '2026-01-31',
      bsmvBp: 0,
      kkdfBp: 0,
    });
    expect(home.map((r) => r.date.slice(5))).toContain('02-28');
    expect(home[0].kkdf + home[0].bsmv).toBe(0);
  });
});

describe('loanStatus', () => {
  it('splits the plan at today', () => {
    fc.assert(
      fc.property(arbLoan, arbDay, (loan, today) => {
        const rows = loanSchedule(loan);
        const s = loanStatus(rows, today);
        expect(s.paidCount + s.remainingCount).toBe(rows.length);
        rows.slice(0, s.paidCount).forEach((row) => expect(row.date <= today).toBe(true));
        rows.slice(s.paidCount).forEach((row) => expect(row.date > today).toBe(true));
        expect(s.nextPayment).toEqual(rows[s.paidCount] ?? null);
        const owed = s.paidCount ? rows[s.paidCount - 1].balance : loan.principal;
        expect(s.remainingPrincipal).toBe(owed);
        expect(s.totalRemainingPayment).toBe(s.remainingPrincipal + s.totalInterestAndTaxes);
        expect(s.totalInterestAndTaxes).toBeLessThanOrEqual(s.loanInterestAndTaxes);
      }),
    );
  });

  it('before the first installment nothing is paid; after the last, nothing is left', () => {
    const rows = loanSchedule({
      principal: 5_000_000,
      monthlyRateBp: 349,
      term: 6,
      firstPayment: '2026-11-15',
      bsmvBp: 1_500,
      kkdfBp: 1_500,
    });
    expect(loanStatus(rows, '2026-11-14')).toMatchObject({ paidCount: 0, remainingCount: 6 });
    expect(loanStatus(rows, '2026-11-15')).toMatchObject({ paidCount: 1, remainingCount: 5 });
    expect(loanStatus(rows, '2027-04-15')).toMatchObject({
      paidCount: 6,
      remainingCount: 0,
      remainingPrincipal: 0,
      nextPayment: null,
      totalRemainingPayment: 0,
    });
  });

  it('counts payment days from the first one', () => {
    expect(paymentDate('2026-01-31', 1)).toBe('2026-02-28');
    expect(paymentDate('2028-01-31', 1)).toBe('2028-02-29');
    expect(paymentDate('2026-11-30', 3)).toBe('2027-02-28');
    expect(paymentDate('2026-12-15', 1)).toBe('2027-01-15');
  });
});
