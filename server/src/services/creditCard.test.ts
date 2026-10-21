import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  addMonth,
  cardSummary,
  currentInstallment,
  daysBetween,
  installmentDueInMonth,
  installmentShares,
  monthsBetween,
  remainingInstallments,
  statementDates,
  type InstallmentPlan,
  type PeriodTransaction,
} from './creditCard.js';

const pad = (n: number) => String(n).padStart(2, '0');
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

const arbDay = fc
  .record({
    y: fc.integer({ min: 2000, max: 2100 }),
    m: fc.integer({ min: 1, max: 12 }),
    d: fc.integer({ min: 1, max: 31 }),
  })
  .map(({ y, m, d }) => `${y}-${pad(m)}-${pad(Math.min(d, lastDay(y, m)))}`);
const arbMonth = fc
  .record({ y: fc.integer({ min: 2000, max: 2100 }), m: fc.integer({ min: 1, max: 12 }) })
  .map(({ y, m }) => `${y}-${pad(m)}`);
const arbDayOfMonth = fc.integer({ min: 1, max: 31 });

const arbPlan: fc.Arbitrary<InstallmentPlan> = fc.record({
  totalAmount: fc.integer({ min: 1, max: 1e10 }),
  installmentCount: fc.integer({ min: 2, max: 36 }),
  firstMonth: arbMonth,
});

const dayOf = (iso: string) => Number(iso.slice(8, 10));
const isRealDay = (iso: string) => {
  const [y, m, d] = [Number(iso.slice(0, 4)), Number(iso.slice(5, 7)), dayOf(iso)];
  return m >= 1 && m <= 12 && d >= 1 && d <= lastDay(y, m);
};

describe('statementDates', () => {
  it('the last statement is on or before today, the next one after it', () => {
    fc.assert(
      fc.property(arbDay, arbDayOfMonth, fc.option(arbDayOfMonth), (today, sDay, dDay) => {
        const d = statementDates(today, sDay, dDay);
        for (const day of [d.previousStatement, d.lastStatement, d.nextStatement]) {
          expect(isRealDay(day)).toBe(true);
        }
        expect(d.previousStatement < d.lastStatement).toBe(true);
        expect(d.lastStatement <= today).toBe(true);
        expect(d.nextStatement > today).toBe(true);
        expect(d.statementMonth).toBe(d.lastStatement.slice(0, 7));
        expect(d.nextStatementMonth).toBe(addMonth(d.statementMonth, 1));
      }),
    );
  });

  it('falls on the statement day, or the last day of a shorter month', () => {
    fc.assert(
      fc.property(arbDay, arbDayOfMonth, (today, sDay) => {
        const { lastStatement } = statementDates(today, sDay, null);
        const [y, m] = [Number(lastStatement.slice(0, 4)), Number(lastStatement.slice(5, 7))];
        expect(dayOf(lastStatement)).toBe(Math.min(sDay, lastDay(y, m)));
      }),
    );
  });

  it('the due date is the first due day after the statement, within about a month', () => {
    fc.assert(
      fc.property(arbDay, arbDayOfMonth, arbDayOfMonth, (today, sDay, dDay) => {
        const d = statementDates(today, sDay, dDay);
        expect(d.dueDate).not.toBeNull();
        const due = d.dueDate!;
        expect(isRealDay(due)).toBe(true);
        expect(due > d.lastStatement).toBe(true);
        expect(monthsBetween(d.statementMonth, due.slice(0, 7))).toBeLessThanOrEqual(1);
        const [y, m] = [Number(due.slice(0, 4)), Number(due.slice(5, 7))];
        expect(dayOf(due)).toBe(Math.min(dDay, lastDay(y, m)));
      }),
    );
  });

  it('works through a Turkish example', () => {
    // Kesim the 15th, son ödeme the 25th
    expect(statementDates('2026-10-21', 15, 25)).toEqual({
      previousStatement: '2026-09-15',
      lastStatement: '2026-10-15',
      nextStatement: '2026-11-15',
      dueDate: '2026-10-25',
      statementMonth: '2026-10',
      nextStatementMonth: '2026-11',
    });
    // Kesim the 31st in February, due the 10th of the next month
    expect(statementDates('2026-03-05', 31, 10)).toMatchObject({
      lastStatement: '2026-02-28',
      nextStatement: '2026-03-31',
      dueDate: '2026-03-10',
    });
    expect(statementDates('2026-03-31', 31, 10).lastStatement).toBe('2026-03-31');
  });
});

describe('installments', () => {
  it('equal shares add up to exactly the total, at most one kuruş apart', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1e12 }),
        fc.integer({ min: 1, max: 36 }),
        (total, count) => {
          const shares = installmentShares(total, count);
          expect(shares).toHaveLength(count);
          expect(shares.reduce((a, b) => a + b, 0)).toBe(total);
          expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1);
          for (const s of shares) expect(s).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });

  it('every month of a plan bills one share, and all of them add up to the total', () => {
    fc.assert(
      fc.property(arbPlan, (plan) => {
        let sum = 0;
        for (let i = -2; i < plan.installmentCount + 2; i++) {
          const due = installmentDueInMonth(plan, addMonth(plan.firstMonth, i));
          if (i < 0 || i >= plan.installmentCount) expect(due).toBe(0);
          else expect(due).toBeGreaterThanOrEqual(0);
          sum += due;
        }
        expect(sum).toBe(plan.totalAmount);
      }),
    );
  });

  it('what was billed and what remains add up to the plan', () => {
    fc.assert(
      fc.property(arbPlan, fc.integer({ min: -5, max: 45 }), (plan, offset) => {
        const month = addMonth(plan.firstMonth, offset);
        const rest = remainingInstallments(plan, month);
        expect(rest.billed + rest.count).toBe(plan.installmentCount);
        expect(rest.count).toBeGreaterThanOrEqual(0);
        let billedSum = 0;
        for (let i = 0; i <= offset && i < plan.installmentCount; i++) {
          billedSum += installmentDueInMonth(plan, addMonth(plan.firstMonth, i));
        }
        expect(billedSum + rest.amount).toBe(plan.totalAmount);
      }),
    );
  });

  it('6 installments of 1.000,00 ₺ after the third statement', () => {
    const plan = { totalAmount: 100_000, installmentCount: 6, firstMonth: '2026-08' };
    expect(remainingInstallments(plan, '2026-10')).toEqual({
      billed: 3,
      count: 3,
      amount: 49_999,
    });
    expect(installmentShares(100_000, 6)).toEqual([16_667, 16_667, 16_667, 16_667, 16_666, 16_666]);
  });
});

describe('cardSummary', () => {
  const arbTx: fc.Arbitrary<PeriodTransaction> = fc.record({
    amount: fc.integer({ min: -1e8, max: 1e8 }),
    kind: fc.constantFrom('spending', 'transfer', 'installment'),
  });
  const arbInput = fc.record({
    balance: fc.integer({ min: -1e10, max: 1e10 }),
    limit: fc.option(fc.integer({ min: 0, max: 1e10 })),
    minRate: fc.option(fc.integer({ min: 0, max: 10_000 })),
    periodTransactions: fc.array(arbTx, { maxLength: 20 }),
    paymentsSinceStatement: fc.integer({ min: -1e8, max: 1e9 }),
    plans: fc.array(arbPlan, { maxLength: 4 }),
    statementMonth: fc.option(arbMonth),
    currentMonth: arbMonth,
  });

  it('never shows a negative debt or payment', () => {
    fc.assert(
      fc.property(arbInput, (input) => {
        const s = cardSummary(input);
        expect(s.used).toBeGreaterThanOrEqual(0);
        expect(s.installmentDebtRemaining).toBeGreaterThanOrEqual(0);
        if (s.statementDebt !== null) {
          expect(s.statementDebt).toBeGreaterThanOrEqual(0);
          expect(s.remainingAfterPayments!).toBeGreaterThanOrEqual(0);
          expect(s.remainingAfterPayments!).toBeLessThanOrEqual(s.statementDebt);
        }
        if (s.minimumPayment !== null) {
          expect(s.minimumPayment).toBeGreaterThanOrEqual(0);
          expect(s.minimumPayment).toBeLessThanOrEqual(s.statementDebt ?? 0);
          // Rounded up: never less than the exact share
          expect(s.minimumPayment * 10_000).toBeGreaterThanOrEqual(
            (s.statementDebt ?? 0) * input.minRate!,
          );
          expect((s.minimumPayment - 1) * 10_000).toBeLessThan(
            (s.statementDebt ?? 0) * input.minRate!,
          );
        }
      }),
    );
  });

  it('used plus available is the limit', () => {
    fc.assert(
      fc.property(arbInput, (input) => {
        const s = cardSummary(input);
        expect(s.used).toBe(Math.max(0, -input.balance));
        if (input.limit === null) expect(s.available).toBeNull();
        else expect(s.available! + s.used).toBe(input.limit);
      }),
    );
  });

  it('payments, transfers and installment purchases are never statement spending', () => {
    fc.assert(
      fc.property(arbInput, arbMonth, (input, month) => {
        const withMonth = { ...input, statementMonth: month };
        const others = input.periodTransactions.filter((tx) => tx.kind !== 'spending');
        const spendingOnly = input.periodTransactions.filter((tx) => tx.kind === 'spending');
        const a = cardSummary(withMonth);
        const b = cardSummary({ ...withMonth, periodTransactions: spendingOnly });
        expect(a.statementDebt).toBe(b.statementDebt);
        const c = cardSummary({ ...withMonth, periodTransactions: [...spendingOnly, ...others] });
        expect(c.statementDebt).toBe(a.statementDebt);
      }),
    );
  });

  it("adds the installments billed on the statement's month", () => {
    fc.assert(
      fc.property(fc.array(arbPlan, { maxLength: 4 }), arbMonth, (plans, month) => {
        const s = cardSummary({
          balance: 0,
          limit: null,
          minRate: null,
          periodTransactions: [],
          paymentsSinceStatement: 0,
          plans,
          statementMonth: month,
          currentMonth: month,
        });
        const billed = plans.reduce((sum, p) => sum + installmentDueInMonth(p, month), 0);
        expect(s.statementDebt).toBe(billed);
        const remaining = plans.reduce((sum, p) => sum + remainingInstallments(p, month).amount, 0);
        expect(s.installmentDebtRemaining).toBe(remaining);
      }),
    );
  });

  it('works through an example', () => {
    expect(
      cardSummary({
        balance: -350_000,
        limit: 2_000_000,
        minRate: 2_000,
        periodTransactions: [
          { amount: -100_000, kind: 'spending' },
          { amount: 10_000, kind: 'spending' }, // a refund
          { amount: -60_000, kind: 'installment' }, // billed in installments instead
          { amount: 50_000, kind: 'transfer' }, // last month's payment
        ],
        paymentsSinceStatement: 40_000,
        plans: [{ totalAmount: 60_000, installmentCount: 3, firstMonth: '2026-10' }],
        statementMonth: '2026-10',
        currentMonth: '2026-10',
      }),
    ).toEqual({
      used: 350_000,
      available: 1_650_000,
      statementDebt: 110_000,
      minimumPayment: 22_000,
      remainingAfterPayments: 70_000,
      installmentDebtRemaining: 40_000,
    });
  });
});

describe('helpers', () => {
  it('counts days and installments', () => {
    expect(daysBetween('2026-10-21', '2026-10-25')).toBe(4);
    expect(daysBetween('2026-10-25', '2026-10-21')).toBe(-4);
    expect(daysBetween('2026-02-27', '2026-03-01')).toBe(2);
    const plan = { totalAmount: 90_000, installmentCount: 3, firstMonth: '2026-11' };
    expect(currentInstallment(plan, '2026-10')).toBe(0);
    expect(currentInstallment(plan, '2026-11')).toBe(1);
    expect(currentInstallment(plan, '2027-06')).toBe(3);
  });

  it('daysBetween agrees with adding months of days', () => {
    fc.assert(
      fc.property(arbDay, arbDay, (a, b) => {
        expect(daysBetween(a, b)).toBe(-daysBetween(b, a));
        expect(Math.sign(daysBetween(a, b))).toBe(a < b ? 1 : a > b ? -1 : 0);
      }),
    );
  });
});
