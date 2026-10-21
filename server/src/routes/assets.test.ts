import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '../db/index.js';
import { transactions } from '../db/schema.js';
import { errorHandler } from '../middleware/security.js';
import { accountsRouter } from './accounts.js';
import { assetsRouter } from './assets.js';
import { creditCardsRouter } from './creditCards.js';
import { currencyRouter } from './currency.js';
import { reportsRouter } from './reports.js';
import { transactionsRouter } from './transactions.js';

// Asset quantities and unit prices, and the net worth's equivalents. Its own file, so the
// database holds only this test's accounts (the net worth adds up all of them).

let server: Server;
let base: string;

beforeAll(async () => {
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  const app = express();
  app.use(express.json());
  app.use('/api/accounts', accountsRouter);
  app.use('/api/transactions', transactionsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/currency', currencyRouter);
  app.use('/api', creditCardsRouter);
  app.use('/api', assetsRouter);
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

const newAccount = async (name: string, type: string, startingBalance = 0) =>
  (await send('POST', '/accounts', { name, type, startingBalance })).body.id as string;

const balance = async (id: string) =>
  ((await send('GET', '/accounts')).body as { id: string; balance: number }[]).find(
    (a) => a.id === id,
  )!.balance;

const TODAY = '2026-10-21';

describe('asset details', () => {
  it('saves a quantity and unit on asset accounts, keeping the other fields', async () => {
    const gold = await newAccount('Altın', 'valuables');
    const saved = await send('PUT', `/accounts/${gold}/details`, {
      assetQuantity: '012.50',
      assetUnit: ' gram altın ',
    });
    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({
      assetQuantity: '12.5',
      assetUnit: 'gram altın',
      assetUnitPrice: null,
      assetPriceDate: null,
    });
    const again = await send('PUT', `/accounts/${gold}/details`, { assetQuantity: '13' });
    expect(again.body).toMatchObject({ assetQuantity: '13', assetUnit: 'gram altın' });
    const cleared = await send('PUT', `/accounts/${gold}/details`, { assetUnit: null });
    expect(cleared.body).toMatchObject({ assetQuantity: '13', assetUnit: null });
  });

  it.each([
    ['a comma', { assetQuantity: '12,5' }],
    ['nine decimals', { assetQuantity: '0.000000001' }],
    ['a negative quantity', { assetQuantity: '-1' }],
    ['a number', { assetQuantity: 12.5 }],
    ['a long unit', { assetUnit: 'x'.repeat(21) }],
    ['an empty unit', { assetUnit: '  ' }],
    ['a fractional price', { assetUnitPrice: 1.5 }],
    ['a date that does not exist', { assetPriceDate: '2026-02-30' }],
  ])('rejects %s', async (_label, body) => {
    const fund = await newAccount('Fon', 'investment');
    expect((await send('PUT', `/accounts/${fund}/details`, body)).status).toBe(400);
  });

  it('are only for asset accounts, and card or loan fields are not for them', async () => {
    for (const type of ['investment', 'retirement', 'crypto', 'valuables', 'other_asset']) {
      const id = await newAccount('Varlık', type);
      const put = async (body: object) =>
        (await send('PUT', `/accounts/${id}/details`, body)).status;
      expect(await put({ assetUnit: 'adet' })).toBe(200);
      expect(await put({ creditLimit: 1 })).toBe(422);
      expect(await put({ loanTerm: 12 })).toBe(422);
    }
    for (const type of ['checking', 'credit', 'loan', 'real_estate', 'vehicle']) {
      const id = await newAccount('Başka', type);
      const res = await send('PUT', `/accounts/${id}/details`, { assetQuantity: '1' });
      expect(res.status).toBe(422);
      expect(typeof res.body.error).toBe('string');
    }
    // A plain account still has no details at all
    const checking = await newAccount('Vadesiz', 'checking');
    expect((await send('PUT', `/accounts/${checking}/details`, {})).status).toBe(422);
  });
});

describe('asset price', () => {
  it('brings the balance to quantity × price with a correction', async () => {
    const gold = await newAccount('Gram Altın Hesabı', 'valuables', 1_000_000);
    await send('PUT', `/accounts/${gold}/details`, {
      assetQuantity: '12.5',
      assetUnit: 'gram altın',
    });
    const res = await send('POST', `/accounts/${gold}/asset-price`, {
      unitPrice: 295_000,
      date: '2026-10-19',
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      value: 3_687_500,
      change: 2_687_500,
      details: { assetUnitPrice: 295_000, assetPriceDate: '2026-10-19' },
    });
    expect(await balance(gold)).toBe(3_687_500);
    const row = db
      .select()
      .from(transactions)
      .where(eq(transactions.id, res.body.transactionId))
      .get()!;
    expect(row).toMatchObject({
      accountId: gold,
      date: '2026-10-19',
      amount: 2_687_500,
      isAdjustment: 1,
      categoryId: null,
    });

    // The same price again: nothing to correct
    const same = await send('POST', `/accounts/${gold}/asset-price`, {
      unitPrice: 295_000,
      date: '2026-10-20',
    });
    expect(same.body).toMatchObject({ change: 0, transactionId: null });
    expect(same.body.details.assetPriceDate).toBe('2026-10-20');

    // A lower price takes value off
    const lower = await send('POST', `/accounts/${gold}/asset-price`, {
      unitPrice: 290_000,
      date: '2026-10-20',
    });
    expect(lower.body).toMatchObject({ value: 3_625_000, change: -62_500 });
    expect(await balance(gold)).toBe(3_625_000);
  });

  it('needs a quantity, an asset account and a valid body', async () => {
    const fund = await newAccount('Fon', 'investment');
    const noQuantity = await send('POST', `/accounts/${fund}/asset-price`, {
      unitPrice: 100,
      date: TODAY,
    });
    expect(noQuantity.status).toBe(422);
    const checking = await newAccount('Vadesiz', 'checking');
    const price = { unitPrice: 1, date: TODAY };
    expect((await send('POST', `/accounts/${checking}/asset-price`, price)).status).toBe(422);
    expect((await send('POST', '/accounts/missing/asset-price', price)).status).toBe(404);
    for (const body of [
      { unitPrice: -1, date: TODAY },
      { unitPrice: 1.5, date: TODAY },
      { unitPrice: 1, date: '21.10.2026' },
      { unitPrice: '100', date: TODAY },
    ]) {
      expect((await send('POST', `/accounts/${fund}/asset-price`, body)).status).toBe(400);
    }
  });
});

describe('net worth equivalents', () => {
  it('match the net worth report, in dollars, euros and grams of gold', async () => {
    await send('PUT', '/currency', { currency: 'TRY' });
    const day = `granularity=daily&from=${TODAY}&to=${TODAY}`;
    const report = (await send('GET', `/reports/net-worth?${day}`)).body as { netWorth: number }[];
    const before = await send('GET', `/net-worth/equivalents?today=${TODAY}`);
    expect(before.status).toBe(200);
    expect(before.body.netWorth).toBe(report.at(-1)!.netWorth);
    expect(before.body.currency).toBe('TRY');
    // No rates yet
    expect(before.body.usd).toBeNull();
    expect(before.body.eur).toBeNull();

    // A debt counts against it
    await newAccount('Kredi Kartı', 'credit', -500_000);
    const after = (await send('GET', `/net-worth/equivalents?today=${TODAY}`)).body;
    expect(after.netWorth).toBe(before.body.netWorth - 500_000);

    // 1 USD = 40 TRY, 1 EUR = 45 TRY (as EUR→TRY; USD found through the euro)
    const rate = (quote: string, value: string) =>
      send('POST', '/currency/rates', { date: '2026-10-20', base: 'EUR', quote, rate: value });
    await rate('TRY', '45');
    await rate('USD', '1.125');
    const withRates = (await send('GET', `/net-worth/equivalents?today=${TODAY}`)).body;
    expect(withRates.eur).toEqual({
      value: Math.round(withRates.netWorth / 45),
      rateDate: '2026-10-20',
    });
    expect(withRates.usd.rateDate).toBe('2026-10-20');
    expect(Math.abs(withRates.usd.value - withRates.netWorth / 40)).toBeLessThanOrEqual(1);
    // Too old to use 40 days later
    const later = (await send('GET', '/net-worth/equivalents?today=2026-11-30')).body;
    expect(later.eur).toBeNull();

    // Gold: the gram price entered last, whatever the unit's spelling
    expect(withRates.goldGram).toMatchObject({
      priceDate: '2026-10-20',
      accountName: 'Gram Altın Hesabı',
    });
    const bars = await newAccount('Külçe', 'valuables');
    await send('PUT', `/accounts/${bars}/details`, {
      assetQuantity: '1',
      assetUnit: 'GRAM ALTIN',
    });
    await send('POST', `/accounts/${bars}/asset-price`, { unitPrice: 300_000, date: TODAY });
    const gold = (await send('GET', `/net-worth/equivalents?today=${TODAY}`)).body;
    expect(gold.goldGram).toMatchObject({ priceDate: TODAY, accountName: 'Külçe' });
    expect(gold.goldGram.value).toBeCloseTo(gold.netWorth / 300_000, 1);

    // Another unit doesn't count
    const coins = await newAccount('Çeyrek', 'valuables');
    await send('PUT', `/accounts/${coins}/details`, {
      assetQuantity: '2',
      assetUnit: 'çeyrek altın',
    });
    const coinPrice = { unitPrice: 500_000, date: '2026-10-22' };
    await send('POST', `/accounts/${coins}/asset-price`, coinPrice);
    const still = (await send('GET', '/net-worth/equivalents?today=2026-10-22')).body;
    expect(still.goldGram.accountName).toBe('Külçe');
    // A price dated after the day asked about isn't used for it
    const earlier = (await send('GET', '/net-worth/equivalents?today=2026-10-20')).body;
    expect(earlier.goldGram.accountName).toBe('Gram Altın Hesabı');
  });
});
