import type { Page } from '@playwright/test';
import { test, expect, open, isoDay, otherDayThisMonth, typeAmount, type Api } from './fixtures';

// Entering and editing transactions in an account register, checking both what the
// page shows and what the server stored.

async function setup(api: Api) {
  const checking = await api.createAccount('Everyday Checking', 100_000);
  const savings = await api.createAccount('Rainy Day Savings', 500_000, 'savings');
  return { checking, savings };
}

const header = (page: Page) => page.getByRole('main').locator('div').first();

const newForm = (page: Page) => page.getByRole('form', { name: 'Yeni işlem' });

/** The register row for a payee */
const row = (page: Page, payee: string) =>
  page.getByTestId('transaction-row').filter({ hasText: payee });

async function fillNewTransaction(
  page: Page,
  fields: { payee?: string; category?: string; notes?: string; outflow?: string; inflow?: string },
) {
  await page.getByRole('button', { name: 'İşlem ekle' }).click();
  const form = newForm(page);
  if (fields.payee) await form.getByRole('textbox', { name: 'Alıcı' }).fill(fields.payee);
  if (fields.category) {
    await form.getByRole('combobox', { name: 'Kategori' }).selectOption({ label: fields.category });
  }
  if (fields.notes) await form.getByRole('textbox', { name: 'Notlar' }).fill(fields.notes);
  if (fields.outflow) await form.getByRole('textbox', { name: 'Çıkış' }).fill(fields.outflow);
  if (fields.inflow) await form.getByRole('textbox', { name: 'Giriş' }).fill(fields.inflow);
}

test.describe('account register', () => {
  test('adds an expense with a payee and category', async ({ page, api }) => {
    const { checking } = await setup(api);
    await open(page, `/accounts/${checking.id}`);
    await fillNewTransaction(page, {
      payee: 'Corner Grocery',
      category: '🛒 Market alışverişi',
      notes: 'weekly shop',
      outflow: '42.50',
    });
    await newForm(page).getByRole('button', { name: 'Kaydet' }).click();

    await expect(page.getByRole('button', { name: 'Corner Grocery', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '🛒 Market alışverişi' })).toBeVisible();
    await expect(header(page)).toContainText('957,50 ₺');
    expect(await api.balance(checking.id)).toBe(95_750);

    const [tx] = await api.transactions(`?account_id=${checking.id}`);
    expect(tx).toMatchObject({ amount: -4_250, payeeName: 'Corner Grocery', notes: 'weekly shop' });
    expect(tx.categoryId).toBe((await api.category('Market alışverişi')).id);
    // A new payee was created for it
    const payees = await api.call<{ name: string }[]>('GET', '/payees');
    expect(payees.map((p) => p.name)).toContain('Corner Grocery');
  });

  test("never saves text that isn't an amount as 0", async ({ page, api }) => {
    const { checking } = await setup(api);
    await open(page, `/accounts/${checking.id}`);
    await fillNewTransaction(page, { payee: 'Corner Grocery', outflow: 'abc' });
    const form = newForm(page);
    await form.getByRole('button', { name: 'Kaydet' }).click();
    await expect(form.getByRole('textbox', { name: 'Çıkış' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(form.getByRole('alert')).toHaveText(
      'Bu bir tutar değil. 12,50 ya da 12.50 gibi yazın.',
    );
    expect(await api.transactions(`?account_id=${checking.id}`)).toHaveLength(0);

    // Fixed, it saves
    await form.getByRole('textbox', { name: 'Çıkış' }).fill('4,50');
    await expect(form.getByRole('alert')).toBeHidden();
    await form.getByRole('button', { name: 'Kaydet' }).click();
    await expect.poll(() => api.balance(checking.id)).toBe(100_000 - 450);
  });

  test('adds income as an inflow', async ({ page, api }) => {
    const { checking } = await setup(api);
    await open(page, `/accounts/${checking.id}`);
    await fillNewTransaction(page, {
      payee: 'Acme Corp',
      category: '💵 Maaş',
      inflow: '2500',
    });
    await newForm(page).getByRole('button', { name: 'Kaydet' }).click();
    await expect(header(page)).toContainText('3.500 ₺');
    expect(await api.balance(checking.id)).toBe(350_000);
  });

  test('tabbing past the inflow keeps the outflow (#92)', async ({ page, api }) => {
    const { checking } = await setup(api);
    await open(page, `/accounts/${checking.id}`);
    await fillNewTransaction(page, { payee: 'Corner Grocery', outflow: '12.34' });
    const form = newForm(page);
    await form.getByRole('textbox', { name: 'Çıkış' }).press('Tab');
    await expect(form.getByRole('textbox', { name: 'Giriş' })).toBeFocused();
    await expect(form.getByRole('textbox', { name: 'Çıkış' })).toHaveValue('12.34');
    // Typing an inflow still replaces the outflow
    await page.keyboard.type('5');
    await expect(form.getByRole('textbox', { name: 'Çıkış' })).toHaveValue('');
    await form.getByRole('textbox', { name: 'Çıkış' }).fill('12.34');
    await expect(form.getByRole('textbox', { name: 'Giriş' })).toHaveValue('');
    await form.getByRole('button', { name: 'Kaydet' }).click();
    await expect(header(page)).toContainText('987,66 ₺');
  });

  test('a split transaction counts once toward the balance', async ({ page, api }) => {
    const { checking } = await setup(api);
    await open(page, `/accounts/${checking.id}`);
    await fillNewTransaction(page, { payee: 'Big Box Store', outflow: '100' });
    const form = newForm(page);
    await form.getByRole('button', { name: 'İşlemi böl' }).click();
    await form
      .getByRole('combobox', { name: 'Parça 1 kategorisi' })
      .selectOption({ label: '🛒 Market alışverişi' });
    await form.getByRole('textbox', { name: 'Parça 1 tutarı' }).fill('60');
    await expect(form.getByText('40 ₺ kalan')).toBeVisible();
    await form
      .getByRole('combobox', { name: 'Parça 2 kategorisi' })
      .selectOption({ label: '🏠 Rent / Mortgage' });
    await form.getByRole('textbox', { name: 'Parça 2 tutarı' }).fill('40');
    await expect(form.getByText('Dengede')).toBeVisible();
    await newForm(page).getByRole('button', { name: 'Kaydet' }).click();

    await expect(page.getByRole('button', { name: 'Bölünmüş (2)' })).toBeVisible();
    // 1.000 ₺ − 100 ₺, not − 200 ₺
    await expect(header(page)).toContainText('900 ₺');
    expect(await api.balance(checking.id)).toBe(90_000);

    const [parent] = await api.transactions(`?account_id=${checking.id}`);
    const parts = parent.children.map((c: { amount: number }) => c.amount);
    expect(parts.sort((a: number, b: number) => a - b)).toEqual([-6_000, -4_000]);
  });

  test('a transfer moves money between two accounts', async ({ page, api }) => {
    const { checking, savings } = await setup(api);
    await open(page, `/accounts/${checking.id}`);
    await fillNewTransaction(page, { category: 'Transfer: Rainy Day Savings', outflow: '250' });
    await newForm(page).getByRole('button', { name: 'Kaydet' }).click();

    await expect(page.getByText('Transfer: Rainy Day Savings')).toBeVisible();
    expect(await api.balance(checking.id)).toBe(75_000);
    expect(await api.balance(savings.id)).toBe(525_000);

    // Deleting one side removes it and unlinks the other
    const [out] = await api.transactions(`?account_id=${checking.id}`);
    await api.call('DELETE', `/transactions/${out.id}`);
    const [other] = await api.transactions(`?account_id=${savings.id}`);
    expect(other.transferTransactionId).toBeNull();
  });

  test('edits the category, payee, date and notes from the detail panel', async ({ page, api }) => {
    const { checking } = await setup(api);
    const tx = await api.createTransaction({
      accountId: checking.id,
      date: isoDay(),
      amount: -1_999,
      payeeName: 'Streamflix',
    });
    await open(page, `/accounts/${checking.id}`);
    // Rows open with the keyboard too
    await row(page, 'Streamflix').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('İşlem Ayrıntıları')).toBeVisible();
    const panel = page.getByRole('complementary', { name: 'İşlem ayrıntıları' });

    // Category via the searchable picker
    await panel.getByRole('button', { name: 'Kategorisiz' }).click();
    await page.getByPlaceholder('Kategori ara…').fill('stream');
    await page.getByRole('button', { name: /Dijital abonelikler/ }).click();

    await panel.getByRole('textbox', { name: 'Notlar' }).fill('family plan');
    await panel.getByRole('textbox', { name: 'Notlar' }).blur();
    await panel.getByRole('textbox', { name: 'Tarih' }).fill(otherDayThisMonth());
    await panel.getByRole('textbox', { name: 'Tarih' }).blur();

    await expect
      .poll(async () => (await api.transactions(`?account_id=${checking.id}`))[0])
      .toMatchObject({
        id: tx.id,
        notes: 'family plan',
        date: otherDayThisMonth(),
        categoryId: (await api.category('Dijital abonelikler')).id,
      });
    await page.getByRole('button', { name: 'Ayrıntıları kapat' }).click();
    await expect(page.getByText('İşlem Ayrıntıları')).toBeHidden();
  });

  test('deletes a transaction after confirming', async ({ page, api }) => {
    const { checking } = await setup(api);
    await api.createTransaction({
      accountId: checking.id,
      date: isoDay(),
      amount: -5_000,
      payeeName: 'Oops Store',
    });
    await open(page, `/accounts/${checking.id}`);
    await row(page, 'Oops Store').click();
    await page.getByRole('button', { name: 'İşlemi Sil' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sil' }).click();
    await expect(page.getByText('Henüz işlem yok')).toBeVisible();
    expect(await api.balance(checking.id)).toBe(100_000);
  });

  test('searches and filters by date range', async ({ page, api }) => {
    const { checking } = await setup(api);
    await api.createTransaction({
      accountId: checking.id,
      date: isoDay(),
      amount: -1_000,
      payeeName: 'Coffee Corner',
    });
    await api.createTransaction({
      accountId: checking.id,
      date: '2020-06-15',
      amount: -2_000,
      payeeName: 'Old Bookshop',
    });
    await open(page, `/accounts/${checking.id}`);
    // "This Month" by default: the 2020 purchase is hidden
    await expect(page.getByRole('button', { name: 'Coffee Corner', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Old Bookshop', exact: true })).toBeHidden();

    await page.getByRole('button', { name: 'Tüm zamanlar' }).click();
    await expect(page.getByText('2 işlem', { exact: true })).toBeVisible();
    await page.getByPlaceholder('Alıcı veya notlarda ara…').fill('book');
    await expect(page.getByText('1 işlem', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Old Bookshop', exact: true })).toBeVisible();
  });

  test('the all-transactions page lists every account', async ({ page, api }) => {
    const { checking, savings } = await setup(api);
    await api.createTransaction({
      accountId: checking.id,
      date: isoDay(),
      amount: -1,
      payeeName: 'A-Mart',
    });
    await api.createTransaction({
      accountId: savings.id,
      date: isoDay(),
      amount: 2,
      payeeName: 'B-Bank',
    });
    await open(page, '/transactions');
    await expect(page.getByRole('button', { name: 'A-Mart', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'B-Bank', exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Rainy Day Savings hesabına git' }),
    ).toBeVisible();
  });
});

test('the Add transaction dialog makes transfers too', async ({ page, api }) => {
  const { checking, savings } = await setup(api);
  await open(page, '/transactions?add=1');
  const dialog = page.getByRole('dialog', { name: 'İşlem ekle' });

  await dialog.getByRole('button', { name: 'Giriş', exact: true }).click();
  await typeAmount(dialog.getByLabel('Tutar', { exact: true }), '300');
  await dialog.getByRole('button', { name: /Hesap seçin/ }).click();
  await dialog.getByRole('button', { name: /Everyday Checking/ }).click();
  await dialog.getByRole('button', { name: /^Kategori:/ }).click();
  await dialog.getByRole('button', { name: 'Transfer: Rainy Day Savings' }).click();

  // A transfer is named after the other account, so it needs no merchant
  await expect(dialog.getByText('Alıcı *')).toBeHidden();
  await dialog.getByRole('button', { name: 'İşlem ekle' }).click();
  await expect(dialog).toBeHidden();

  // A credit brings the money into the chosen account
  expect(await api.balance(checking.id)).toBe(130_000);
  expect(await api.balance(savings.id)).toBe(470_000);
  const [into] = await api.transactions(`?account_id=${checking.id}`);
  expect(into.transferTransactionId).not.toBeNull();
});

test('the Add transaction dialog lists transfers before an account is chosen (#89)', async ({
  page,
  api,
}) => {
  const { checking, savings } = await setup(api);
  await open(page, '/transactions?add=1');
  const dialog = page.getByRole('dialog', { name: 'İşlem ekle' });

  await typeAmount(dialog.getByLabel('Tutar', { exact: true }), '200');
  // The category list ends with every account as "Transfer: name", as the guide says
  await dialog.getByRole('button', { name: /^Kategori:/ }).click();
  await dialog.getByRole('button', { name: 'Transfer: Rainy Day Savings' }).click();

  // A debit transfer asks where the money comes from, and can't come from the same account
  await expect(dialog.getByText('Gönderen hesap *')).toBeVisible();
  await dialog.getByRole('button', { name: /Hesap seçin/ }).click();
  await expect(dialog.getByRole('button', { name: /Rainy Day Savings/ })).toHaveCount(1);
  await dialog.getByRole('button', { name: /Everyday Checking/ }).click();
  await dialog.getByRole('button', { name: 'İşlem ekle' }).click();
  await expect(dialog).toBeHidden();

  expect(await api.balance(checking.id)).toBe(80_000);
  expect(await api.balance(savings.id)).toBe(520_000);
});

test('an inflow marked as a transfer brings the money in from the other account', async ({
  page,
  api,
}) => {
  const { checking, savings } = await setup(api);
  await open(page, `/accounts/${checking.id}`);
  await fillNewTransaction(page, { category: 'Transfer: Rainy Day Savings', inflow: '100' });
  await newForm(page).getByRole('button', { name: 'Kaydet' }).click();

  await expect(row(page, 'Transfer: Rainy Day Savings')).toBeVisible();
  expect(await api.balance(checking.id)).toBe(110_000);
  expect(await api.balance(savings.id)).toBe(490_000);
});

/** Bank rows, as a CSV import or bank sync brings them in */
async function importRows(
  api: Api,
  accountId: string,
  rows: { date: string; amount: number; payeeName: string }[],
) {
  await api.call('POST', '/transactions/import/confirm', {
    accountId,
    rows: rows.map((r, i) => ({ ...r, importedId: `${accountId}-${i}` })),
  });
}

test.describe('transfers between existing transactions (#89)', () => {
  test('an existing transaction becomes a transfer from its category, and back', async ({
    page,
    api,
  }) => {
    const { checking, savings } = await setup(api);
    await importRows(api, checking.id, [
      { date: isoDay(), amount: -25_000, payeeName: 'ONLINE TRANSFER 0042' },
    ]);
    await open(page, `/accounts/${checking.id}`);
    await row(page, 'ONLINE TRANSFER 0042').click();
    const panel = page.getByRole('complementary', { name: 'İşlem ayrıntıları' });

    await panel.getByRole('button', { name: 'Kategorisiz' }).click();
    await page.getByPlaceholder('Kategori ara…').fill('transfer');
    await page.getByRole('button', { name: 'Transfer: Rainy Day Savings' }).click();

    // Nothing matched in savings, so the other side was created there
    await expect(panel.getByRole('button', { name: 'Transfer değil' })).toBeVisible();
    await expect(row(page, 'Transfer: Rainy Day Savings')).toBeVisible();
    expect(await api.balance(checking.id)).toBe(75_000);
    expect(await api.balance(savings.id)).toBe(525_000);

    await panel.getByRole('button', { name: 'Transfer değil' }).click();
    await expect(panel.getByRole('button', { name: 'Kategorisiz' })).toBeVisible();
    const [tx] = await api.transactions(`?account_id=${checking.id}`);
    expect(tx).toMatchObject({ transferTransactionId: null, payeeName: 'ONLINE TRANSFER 0042' });
  });

  test('both sides imported from the banks are suggested and linked', async ({ page, api }) => {
    const { checking, savings } = await setup(api);
    const card = await api.createAccount('Travel Card', -30_000, 'credit');
    await importRows(api, checking.id, [
      { date: isoDay(), amount: -30_000, payeeName: 'CARD PAYMENT' },
      { date: isoDay(), amount: -4_000, payeeName: 'CORNER GROCERY' },
    ]);
    await importRows(api, card.id, [
      { date: isoDay(), amount: 30_000, payeeName: 'PAYMENT RECEIVED' },
    ]);
    // Looks like a transfer (same amount, same day, another account) but isn't one
    await importRows(api, savings.id, [{ date: isoDay(), amount: 4_000, payeeName: 'INTEREST' }]);
    const before = [await api.balance(checking.id), await api.balance(card.id)];

    await open(page, `/accounts/${checking.id}`);
    const banner = page.getByRole('region', { name: 'Olası transferler' });
    await expect(banner).toContainText('2 olası transfer');
    await banner.getByRole('button', { name: 'İncele' }).click();
    const dialog = page.getByRole('dialog', { name: 'Olası transferler' });
    // The grocery run and the interest only look alike: say so, and it's not suggested again
    await dialog
      .getByRole('button', { name: /Transfer değil: 40\s₺, Everyday Checking hesabından/ })
      .click();
    await expect(dialog.getByRole('listitem')).toHaveCount(1);
    await dialog.getByRole('button', { name: '1 transferi bağla' }).click();
    await expect(dialog).toBeHidden();
    await expect(banner).toContainText('1 transfer bağlandı.');

    await expect(row(page, 'Transfer: Travel Card')).toBeVisible();
    await expect(row(page, 'CORNER GROCERY')).toBeVisible();
    // Linking moves no money: both sides were already there
    expect([await api.balance(checking.id), await api.balance(card.id)]).toEqual(before);
    const [payment] = await api.transactions(`?account_id=${card.id}`);
    expect(payment).toMatchObject({ payeeName: 'Transfer: Everyday Checking' });
    expect(payment.transferTransactionId).not.toBeNull();
  });
});

test('sending a new transaction twice (offline retry) saves it once', async ({ api }) => {
  const checking = await api.createAccount('Everyday Checking', 100_000);
  const savings = await api.createAccount('Savings', 0, 'savings');
  const post = (path: string, data: object) => api.request.post(`/api${path}`, { data });

  const tx = {
    id: 'offline-tx-00000000001',
    accountId: checking.id,
    date: isoDay(),
    amount: -475,
    payeeName: 'Coffee Cart',
  };
  const first = await post('/transactions', tx);
  expect(first.status()).toBe(201);
  const again = await post('/transactions', { ...tx, amount: -999_999 });
  // The same saved transaction comes back; nothing new is created or changed
  expect(again.status()).toBe(200);
  expect(await again.json()).toMatchObject({ id: tx.id, amount: -475 });

  const split = {
    id: 'offline-split-000000001',
    accountId: checking.id,
    date: isoDay(),
    amount: -3_000,
    payeeName: 'Market',
    splits: [
      { categoryId: null, amount: -1_000 },
      { categoryId: null, amount: -2_000 },
    ],
  };
  expect((await post('/transactions', split)).status()).toBe(201);
  const splitAgain = await post('/transactions', split);
  expect(splitAgain.status()).toBe(200);
  expect((await splitAgain.json()).children).toHaveLength(2);

  const transfer = {
    id: 'offline-transfer-000001',
    fromAccountId: checking.id,
    toAccountId: savings.id,
    date: isoDay(),
    amount: 10_000,
  };
  expect((await post('/transactions/transfer', transfer)).status()).toBe(201);
  const transferAgain = await post('/transactions/transfer', transfer);
  expect(transferAgain.status()).toBe(200);
  expect(await transferAgain.json()).toHaveLength(2);

  // Ids from a device must look like ids
  expect((await post('/transactions', { ...tx, id: 'short' })).status()).toBe(400);
  expect((await post('/transactions', { ...tx, id: 'has spaces in it, 1234' })).status()).toBe(400);

  const rows = await api.call<{ id: string }[]>('GET', '/transactions');
  expect(rows.filter((r) => r.id === tx.id)).toHaveLength(1);
  // Balances count each one once: 1,000.00 − 4.75 − 30.00 − 100.00
  const accounts = await api.accounts();
  expect(accounts.find((a) => a.id === checking.id)!.balance).toBe(100_000 - 475 - 3_000 - 10_000);
  expect(accounts.find((a) => a.id === savings.id)!.balance).toBe(10_000);
});

/** Seeds `count` transactions of -1,00 ₺, one a day going back from today ("Shop 0" is today) */
async function seedDaily(api: Api, accountId: string, count: number) {
  const rows = Array.from({ length: count }, (_, i) => ({
    date: isoDay(-i),
    amount: -100,
    payeeName: `Shop ${i}`,
    importedId: `seed-${i}`,
  }));
  await api.call('POST', '/transactions/import/confirm', { accountId, rows });
}

test.describe('long histories', () => {
  test('the register lists every transaction, drawing them a page at a time', async ({
    page,
    api,
  }) => {
    const { checking } = await setup(api);
    await seedDaily(api, checking.id, 650);
    await open(page, `/accounts/${checking.id}`);
    await page.getByRole('button', { name: 'Tüm zamanlar' }).click();

    await expect(page.getByText('650 işlem', { exact: true })).toBeVisible();
    await expect(page.getByText('300 / 650 işlem gösteriliyor')).toBeVisible();
    await expect(page.getByTestId('transaction-row')).toHaveCount(300);
    await page.getByRole('button', { name: '300 işlem daha göster' }).click();
    await page.getByRole('button', { name: '50 işlem daha göster' }).click();
    await expect(row(page, 'Shop 649')).toBeVisible();
    await expect(page.getByTestId('transaction-row')).toHaveCount(650);
    await expect(page.getByRole('button', { name: /^\d+ işlem daha göster$/ })).toHaveCount(0);
  });

  test('search finds transactions that are not drawn yet', async ({ page, api }) => {
    const { checking } = await setup(api);
    await seedDaily(api, checking.id, 650);
    await open(page, `/accounts/${checking.id}`);
    await page.getByRole('button', { name: 'Tüm zamanlar' }).click();
    await expect(row(page, 'Shop 649')).toHaveCount(0);

    await page.getByPlaceholder('Alıcı veya notlarda ara…').fill('Shop 649');
    await expect(row(page, 'Shop 649')).toBeVisible();
    await expect(page.getByTestId('transaction-row')).toHaveCount(1);
  });

  test('reconcile counts every unreconciled transaction', async ({ page, api }) => {
    const { checking } = await setup(api);
    await seedDaily(api, checking.id, 250);
    await open(page, `/accounts/${checking.id}/reconcile`);
    // Nothing reconciled yet, so the reconciled part is just the starting balance
    await expect(page.getByText('Uygulamada seçili güncel bakiye').locator('..')).toContainText(
      '1.000 ₺',
    );
    await page.getByRole('button', { name: 'Mutabakatı Başlat' }).click();
    await expect(page.getByText('Shop 249')).toBeVisible();
  });
});
