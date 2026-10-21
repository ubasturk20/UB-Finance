import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '../db/index.js';
import { errorHandler } from '../middleware/security.js';
import { accountsRouter } from './accounts.js';
import { creditCardsRouter } from './creditCards.js';
import { currencyRouter } from './currency.js';
import { transactionsRouter } from './transactions.js';

// The dashboard's upcoming card and loan payments. Its own file, so the database holds only
// this test's accounts (the totals add up all of them).

let server: Server;
let base: string;

beforeAll(async () => {
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  const app = express();
  app.use(express.json());
  app.use('/api/accounts', accountsRouter);
  app.use('/api/transactions', transactionsRouter);
  app.use('/api/currency', currencyRouter);
  app.use('/api', creditCardsRouter);
  app.use(errorHandler);
  server = await new Promise<Server>((r) => {
    const s = app.listen(0, '127.0.0.1', () => r(s));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
afterAll(() => server.close());

const send = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: res.status === 204 ? null : await res.json() };
};

const newAccount = async (name: string, type: string, startingBalance = 0, extra = {}) =>
  (await send('POST', '/accounts', { name, type, startingBalance, ...extra })).body.id as string;

const TODAY = '2026-10-21';
const obligations = async () => (await send('GET', `/dashboard/obligations?today=${TODAY}`)).body;

describe('dashboard obligations', () => {
  it('is empty without cards or loans', async () => {
    await send('PUT', '/currency', { currency: 'TRY' });
    await newAccount('Vadesiz', 'checking', 100_000);
    expect(await obligations()).toEqual({
      cards: [],
      loans: [],
      totals: { cardDebt: 0, loanPrincipal: 0 },
      unconverted: [],
    });
  });

  it('lists open cards and loans with details, by date, with the service figures', async () => {
    // Statement on the 15th, due on the 25th: 4 days left; 1.000 ₺ spent in the period
    const bonus = await newAccount('Bonus', 'credit', -500_000);
    await send('PUT', `/accounts/${bonus}/details`, {
      creditLimit: 5_000_000,
      statementDay: 15,
      dueDay: 25,
      minPaymentRate: 2_000,
    });
    await send('POST', '/transactions', {
      accountId: bonus,
      date: '2026-10-05',
      amount: -100_000,
      payeeName: 'Market',
    });
    // Due tomorrow: listed first
    const axess = await newAccount('Axess', 'credit', -200_000);
    await send('PUT', `/accounts/${axess}/details`, { statementDay: 12, dueDay: 22 });
    // No details, closed, or in another currency
    await newAccount('Bilgisiz Kart', 'credit', -300_000);
    const closed = await newAccount('Kapalı Kart', 'credit', -400_000);
    await send('PUT', `/accounts/${closed}/details`, { statementDay: 1, dueDay: 10 });
    await send('DELETE', `/accounts/${closed}`);
    const euro = await newAccount('Euro Kart', 'credit', -50_000, { currency: 'EUR' });
    await send('PUT', `/accounts/${euro}/details`, { statementDay: 20, dueDay: 30 });

    // A loan with a plan, one without, and one already paid off
    const loan = await newAccount('İhtiyaç Kredisi', 'loan', -10_000_000);
    await send('PUT', `/accounts/${loan}/details`, {
      loanPrincipal: 10_000_000,
      loanRate: 300,
      loanTerm: 12,
      loanFirstPayment: '2026-11-21',
    });
    await newAccount('Bilgisiz Kredi', 'loan', -1_000_000);
    const paid = await newAccount('Biten Kredi', 'auto_loan', 0);
    await send('PUT', `/accounts/${paid}/details`, {
      loanPrincipal: 1_000_000,
      loanRate: 200,
      loanTerm: 3,
      loanFirstPayment: '2025-01-10',
    });

    const result = await obligations();
    const bonusSummary = (await send('GET', `/accounts/${bonus}/card-summary?today=${TODAY}`)).body;
    const loanPlan = (await send('GET', `/accounts/${loan}/loan-schedule?today=${TODAY}`)).body;

    expect(result.cards.map((c: { name: string }) => c.name)).toEqual([
      'Axess',
      'Bonus',
      'Euro Kart',
    ]);
    expect(result.cards[0]).toMatchObject({ dueDate: '2026-10-22', daysLeft: 1 });
    expect(result.cards[1]).toEqual({
      accountId: bonus,
      name: 'Bonus',
      // In the budget's currency: stored as none
      currency: null,
      dueDate: '2026-10-25',
      daysLeft: 4,
      statementDebt: bonusSummary.statementDebt,
      remaining: bonusSummary.remainingAfterPayments,
      minimumPayment: bonusSummary.minimumPayment,
      available: bonusSummary.available,
      used: 600_000,
    });
    expect(result.cards[1]).toMatchObject({ statementDebt: 100_000, minimumPayment: 20_000 });

    expect(result.loans).toEqual([
      {
        accountId: loan,
        name: 'İhtiyaç Kredisi',
        currency: null,
        nextDate: '2026-11-21',
        daysLeft: 31,
        nextAmount: loanPlan.status.nextPayment.payment,
        remainingPrincipal: 10_000_000,
        paidCount: 0,
        term: 12,
      },
    ]);

    // The euro card is left out of the totals and named
    expect(result.totals).toEqual({ cardDebt: 800_000, loanPrincipal: 10_000_000 });
    expect(result.unconverted).toEqual(['EUR']);
  });

  it('a card without a due date sorts last', async () => {
    const noDue = await newAccount('Son Ödemesiz', 'line_of_credit', -100);
    await send('PUT', `/accounts/${noDue}/details`, { creditLimit: 1_000_000 });
    const result = await obligations();
    expect(result.cards.at(-1)).toMatchObject({ name: 'Son Ödemesiz', dueDate: null });
  });

  it('falls back to the server day for a date that does not exist', async () => {
    const res = await send('GET', '/dashboard/obligations?today=2026-02-30');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.cards)).toBe(true);
  });
});
