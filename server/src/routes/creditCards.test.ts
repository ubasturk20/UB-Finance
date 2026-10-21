import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '../db/index.js';
import { errorHandler } from '../middleware/security.js';
import { accountsRouter } from './accounts.js';
import { creditCardsRouter } from './creditCards.js';
import { transactionsRouter } from './transactions.js';

// Credit card details, statement summary and installments. Its own file, so the database
// holds only this test's data.

let server: Server;
let base: string;

beforeAll(async () => {
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  const app = express();
  app.use(express.json());
  app.use('/api/accounts', accountsRouter);
  app.use('/api/transactions', transactionsRouter);
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

const newAccount = async (type: string, startingBalance = 0) =>
  (await send('POST', '/accounts', { name: 'Hesap', type, startingBalance })).body.id as string;

const TODAY = '2026-10-21';

describe('card details', () => {
  it('saves only the fields sent, and keeps the others', async () => {
    const card = await newAccount('credit');
    expect((await send('GET', `/accounts/${card}/details`)).body).toMatchObject({
      creditLimit: null,
      statementDay: null,
    });
    await send('PUT', `/accounts/${card}/details`, {
      creditLimit: 5_000_000,
      statementDay: 15,
      dueDay: 25,
      minPaymentRate: 2_000,
      interestRate: 425,
    });
    const { status, body } = await send('PUT', `/accounts/${card}/details`, { dueDay: 26 });
    expect(status).toBe(200);
    expect(body).toMatchObject({
      creditLimit: 5_000_000,
      statementDay: 15,
      dueDay: 26,
      minPaymentRate: 2_000,
      interestRate: 425,
    });
    // Clearing a field
    const cleared = await send('PUT', `/accounts/${card}/details`, { interestRate: null });
    expect(cleared.body).toMatchObject({ interestRate: null, dueDay: 26 });
  });

  it.each([
    ['a day of 0', { statementDay: 0 }],
    ['a day of 32', { dueDay: 32 }],
    ['a fractional day', { dueDay: 2.5 }],
    ['a negative limit', { creditLimit: -1 }],
    ['a rate over 100%', { minPaymentRate: 10_001 }],
    ['a rate as text', { interestRate: '4,25' }],
  ])('rejects %s', async (_label, body) => {
    const card = await newAccount('credit');
    expect((await send('PUT', `/accounts/${card}/details`, body)).status).toBe(400);
  });

  it('are only for credit cards and lines of credit', async () => {
    const checking = await newAccount('checking');
    const res = await send('PUT', `/accounts/${checking}/details`, { creditLimit: 100 });
    expect(res.status).toBe(422);
    expect(typeof res.body.error).toBe('string');
    const kmh = await newAccount('line_of_credit');
    expect((await send('PUT', `/accounts/${kmh}/details`, { creditLimit: 100 })).status).toBe(200);
    expect((await send('PUT', '/accounts/missing/details', { creditLimit: 1 })).status).toBe(404);
  });
});

describe('card summary', () => {
  it('adds up the last statement, its installments and the payments since', async () => {
    const card = await newAccount('credit');
    const checking = await newAccount('checking', 1_000_000);
    await send('PUT', `/accounts/${card}/details`, {
      creditLimit: 2_000_000,
      statementDay: 15,
      dueDay: 25,
      minPaymentRate: 2_000,
    });
    const tx = (date: string, amount: number, extra: object = {}) =>
      send('POST', '/transactions', {
        accountId: card,
        date,
        amount,
        payeeName: 'Mağaza',
        ...extra,
      });

    // Before the closed period (16 Sep – 15 Oct): not on this statement
    await tx('2026-09-10', -30_000);
    // In the period: purchases, a refund, a split purchase (counted once)
    await tx('2026-09-16', -100_000);
    await tx('2026-10-01', 10_000);
    await tx('2026-10-15', -50_000, {
      splits: [
        { categoryId: null, amount: -20_000 },
        { categoryId: null, amount: -30_000 },
      ],
    });
    // Last month's payment, as a transfer from checking: not spending
    await send('POST', '/transactions/transfer', {
      fromAccountId: checking,
      toAccountId: card,
      date: '2026-09-20',
      amount: 30_000,
    });
    // A purchase in 3 installments, the first billed on October's statement
    const phone = (await tx('2026-10-05', -90_000)).body;
    const plan = await send('POST', `/accounts/${card}/installments?today=${TODAY}`, {
      description: 'Telefon',
      totalAmount: 90_000,
      installmentCount: 3,
      firstMonth: '2026-10',
      transactionId: phone.id,
    });
    expect(plan.status).toBe(201);
    // After the statement: a payment (counts as paid) and a purchase (next statement)
    await send('POST', '/transactions/transfer', {
      fromAccountId: checking,
      toAccountId: card,
      date: '2026-10-18',
      amount: 40_000,
    });
    await tx('2026-10-19', -7_000);

    const { status, body } = await send('GET', `/accounts/${card}/card-summary?today=${TODAY}`);
    expect(status).toBe(200);
    // Balance: -30k -100k +10k -50k +30k -90k +40k -7k
    expect(body.balance).toBe(-197_000);
    expect(body).toMatchObject({
      hasDetails: true,
      used: 197_000,
      available: 1_803_000,
      lastStatement: '2026-10-15',
      nextStatement: '2026-11-15',
      dueDate: '2026-10-25',
      daysUntilDue: 4,
      openMonth: '2026-11',
      // 100k + 50k - 10k refund + 30k first installment
      statementDebt: 170_000,
      minimumPayment: 34_000,
      remainingAfterPayments: 130_000,
      installmentDebtRemaining: 60_000,
    });
  });

  it('a card without details still shows what is used', async () => {
    const card = await newAccount('credit', -25_000);
    const { body } = await send('GET', `/accounts/${card}/card-summary?today=${TODAY}`);
    expect(body).toMatchObject({
      hasDetails: false,
      used: 25_000,
      available: null,
      statementDebt: null,
      minimumPayment: null,
      dueDate: null,
    });
    expect((await send('GET', '/accounts/missing/card-summary')).status).toBe(404);
  });
});

describe('installments', () => {
  it('validates new plans', async () => {
    const card = await newAccount('credit');
    const valid = {
      description: 'Buzdolabı',
      totalAmount: 1_200_000,
      installmentCount: 6,
      firstMonth: '2026-11',
    };
    const post = (body: object, account = card) =>
      send('POST', `/accounts/${account}/installments`, body);
    expect((await post({ ...valid, installmentCount: 1 })).status).toBe(400);
    expect((await post({ ...valid, installmentCount: 37 })).status).toBe(400);
    expect((await post({ ...valid, totalAmount: 0 })).status).toBe(400);
    expect((await post({ ...valid, firstMonth: '2026-13' })).status).toBe(400);
    expect((await post({ ...valid, description: '  ' })).status).toBe(400);
    expect((await post({ ...valid, transactionId: 'missing' })).status).toBe(422);
    expect((await post(valid, await newAccount('savings'))).status).toBe(422);
    expect((await post(valid, 'missing')).status).toBe(404);
    expect((await post(valid)).status).toBe(201);
  });

  it('lists where each plan is, and deletes one', async () => {
    const card = await newAccount('credit');
    await send('PUT', `/accounts/${card}/details`, { statementDay: 15, dueDay: 25 });
    const created = await send('POST', `/accounts/${card}/installments?today=${TODAY}`, {
      description: 'Televizyon',
      totalAmount: 100_000,
      installmentCount: 6,
      firstMonth: '2026-09',
    });
    expect(created.body).toMatchObject({
      perInstallment: 16_667,
      // Sep and Oct were billed; November's statement (still open) bills the third
      current: 3,
      remainingCount: 4,
      remainingAmount: 66_666,
    });

    const list = await send('GET', `/accounts/${card}/installments?today=${TODAY}`);
    expect(list.body).toHaveLength(1);

    expect((await send('DELETE', `/installments/${created.body.id}`)).status).toBe(204);
    expect((await send('DELETE', `/installments/${created.body.id}`)).status).toBe(404);
    expect((await send('GET', `/accounts/${card}/installments`)).body).toEqual([]);
  });

  it('deleting the purchase keeps the plan, without its link', async () => {
    const card = await newAccount('credit');
    const purchase = (
      await send('POST', '/transactions', {
        accountId: card,
        date: '2026-10-05',
        amount: -60_000,
        payeeName: 'Mağaza',
      })
    ).body;
    const plan = (
      await send('POST', `/accounts/${card}/installments`, {
        description: 'Koltuk',
        totalAmount: 60_000,
        installmentCount: 3,
        firstMonth: '2026-11',
        transactionId: purchase.id,
      })
    ).body;
    expect(plan.transactionId).toBe(purchase.id);
    await send('DELETE', `/transactions/${purchase.id}`);
    const [after] = (await send('GET', `/accounts/${card}/installments`)).body;
    expect(after).toMatchObject({ id: plan.id, transactionId: null });
  });
});

describe('loan details', () => {
  const loan = {
    loanPrincipal: 10_000_000,
    loanRate: 300,
    loanTerm: 12,
    loanFirstPayment: '2026-11-21',
  };

  it('are saved on loans, and only on loans', async () => {
    const credit = await newAccount('loan', -10_000_000);
    const saved = await send('PUT', `/accounts/${credit}/details`, loan);
    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({ ...loan, loanBsmvRate: null, loanKkdfRate: null });
    // Only the fields sent change
    const term = await send('PUT', `/accounts/${credit}/details`, { loanTerm: 24 });
    expect(term.body).toMatchObject({ loanPrincipal: 10_000_000, loanRate: 300, loanTerm: 24 });

    for (const type of ['mortgage', 'auto_loan', 'student_loan']) {
      const id = await newAccount(type);
      expect((await send('PUT', `/accounts/${id}/details`, loan)).status).toBe(200);
    }
    // Card fields don't go on a loan, loan fields don't go on a card or anything else
    const cardField = await send('PUT', `/accounts/${credit}/details`, { creditLimit: 1 });
    expect(cardField.status).toBe(422);
    const card = await newAccount('credit');
    const onCard = await send('PUT', `/accounts/${card}/details`, { loanTerm: 12 });
    expect(onCard.status).toBe(422);
    expect(typeof onCard.body.error).toBe('string');
    const savings = await newAccount('savings');
    expect((await send('PUT', `/accounts/${savings}/details`, loan)).status).toBe(422);
  });

  it.each([
    ['a term of 0', { loanTerm: 0 }],
    ['a term over 30 years', { loanTerm: 361 }],
    ['a date that does not exist', { loanFirstPayment: '2026-02-30' }],
    ['a date in another format', { loanFirstPayment: '21.11.2026' }],
    ['a negative principal', { loanPrincipal: -1 }],
    ['a rate over 100%', { loanRate: 10_001 }],
    ['a fractional tax rate', { loanBsmvRate: 15.5 }],
  ])('rejects %s', async (_label, body) => {
    const id = await newAccount('loan');
    expect((await send('PUT', `/accounts/${id}/details`, body)).status).toBe(400);
  });

  it('gives the payment plan and where the loan stands', async () => {
    const id = await newAccount('loan', -10_000_000);
    const empty = await send('GET', `/accounts/${id}/loan-schedule?today=${TODAY}`);
    expect(empty.status).toBe(200);
    expect(empty.body).toMatchObject({ schedule: null, status: null, balance: -10_000_000 });

    await send('PUT', `/accounts/${id}/details`, loan);
    // Three installments paid by 21 January 2027
    const { body } = await send('GET', `/accounts/${id}/loan-schedule?today=2027-01-21`);
    expect(body.schedule).toHaveLength(12);
    // An ihtiyaç kredisi pays %15 BSMV and %15 KKDF unless told otherwise
    expect(body).toMatchObject({ bsmvRate: 1_500, kkdfRate: 1_500 });
    expect(body.schedule[0]).toMatchObject({
      n: 1,
      date: '2026-11-21',
      payment: 1_059_348,
      interest: 300_000,
      kkdf: 45_000,
      bsmv: 45_000,
    });
    expect(body.status).toMatchObject({
      paidCount: 3,
      remainingCount: 9,
      remainingPrincipal: body.schedule[2].balance,
    });
    expect(body.status.nextPayment).toMatchObject({ n: 4, date: '2027-02-21' });

    expect((await send('GET', '/accounts/missing/loan-schedule')).status).toBe(404);
  });

  it('a konut kredisi pays no BSMV or KKDF unless they are entered', async () => {
    const id = await newAccount('mortgage');
    await send('PUT', `/accounts/${id}/details`, loan);
    const { body } = await send('GET', `/accounts/${id}/loan-schedule?today=${TODAY}`);
    expect(body).toMatchObject({ bsmvRate: 0, kkdfRate: 0 });
    expect(body.schedule[0]).toMatchObject({ kkdf: 0, bsmv: 0 });
    await send('PUT', `/accounts/${id}/details`, { loanBsmvRate: 500 });
    const taxed = await send('GET', `/accounts/${id}/loan-schedule?today=${TODAY}`);
    expect(taxed.body.bsmvRate).toBe(500);
    expect(taxed.body.schedule[0].bsmv).toBe(15_000);
  });
});
