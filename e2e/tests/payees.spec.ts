import { test, expect, open, isoDay, type Api } from './fixtures';

async function seed(api: Api) {
  const checking = await api.createAccount('Checking', 100_000);
  await api.createTransaction({
    accountId: checking.id,
    date: isoDay(),
    amount: -500,
    payeeName: 'AMZN Mktp',
  });
  await api.createTransaction({
    accountId: checking.id,
    date: isoDay(),
    amount: -700,
    payeeName: 'Amazon',
  });
  await api.createTransaction({
    accountId: checking.id,
    date: isoDay(),
    amount: -900,
    payeeName: 'Amazon',
  });
  return checking;
}

const row = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('row').filter({ has: page.getByRole('checkbox', { name: `Seç: ${name}` }) });

test.describe('payees', () => {
  test('lists payees with their transaction counts; a split counts once', async ({ page, api }) => {
    const checking = await seed(api);
    await api.createTransaction({
      accountId: checking.id,
      date: isoDay(),
      amount: -1_000,
      payeeName: 'Costco',
      splits: [
        { categoryId: null, amount: -600 },
        { categoryId: null, amount: -400 },
      ],
    });
    await open(page, '/payees');
    await expect(row(page, 'Amazon').getByRole('cell').nth(3)).toHaveText('2');
    await expect(row(page, 'Costco').getByRole('cell').nth(3)).toHaveText('1');
    await page.getByPlaceholder('Alıcı ara…').fill('amz');
    await expect(row(page, 'AMZN Mktp')).toBeVisible();
    await expect(row(page, 'Amazon')).toBeHidden();
  });

  test('merges payees and moves their transactions', async ({ page, api }) => {
    await seed(api);
    await open(page, '/payees');
    await page.getByRole('checkbox', { name: 'Seç: AMZN Mktp' }).check();
    await page.getByRole('checkbox', { name: 'Seç: Amazon' }).check();
    await page.getByRole('button', { name: '2 alıcıyı birleştir' }).click();

    const dialog = page.getByRole('dialog', { name: 'Alıcıları birleştir' });
    await dialog.getByRole('radio', { name: /Amazon/ }).check();
    await dialog.getByRole('button', { name: 'Birleştir' }).click();

    await expect(row(page, 'AMZN Mktp')).toBeHidden();
    await expect(row(page, 'Amazon').getByRole('cell').nth(3)).toHaveText('3');
    const names = new Set((await api.transactions()).map((t) => t.payeeName));
    expect([...names]).toEqual(['Amazon']);
  });

  test('a default category applies to new transactions from that payee', async ({ page, api }) => {
    const checking = await seed(api);
    const shopping = await api.category('Groceries');
    await open(page, '/payees');
    await page
      .getByRole('combobox', { name: 'Amazon için varsayılan kategori' })
      .selectOption(shopping.id);
    await expect
      .poll(async () => (await api.call<any[]>('GET', '/payees')).find((p) => p.name === 'Amazon'))
      .toMatchObject({ defaultCategoryId: shopping.id });

    const tx = await api.createTransaction({
      accountId: checking.id,
      date: isoDay(),
      amount: -1_234,
      payeeName: 'Amazon',
    });
    expect(tx.categoryId).toBe(shopping.id);
  });

  test('renames a payee in place', async ({ page, api }) => {
    await seed(api);
    await open(page, '/payees');
    await page
      .getByTitle('Yeniden adlandırmak için çift tıklayın')
      .filter({ hasText: 'AMZN Mktp' })
      .dblclick();
    const input = page.getByRole('textbox', { name: 'Yeniden adlandır: AMZN Mktp' });
    await input.fill('Amazon Marketplace');
    await input.press('Enter');
    await expect(row(page, 'Amazon Marketplace')).toBeVisible();
    await expect
      .poll(async () => (await api.call<any[]>('GET', '/payees')).map((p) => p.name).sort())
      .toEqual(['Amazon', 'Amazon Marketplace']);
  });

  test('deletes a payee, keeping its transactions', async ({ page, api }) => {
    await seed(api);
    await open(page, '/payees');
    await page.getByRole('button', { name: 'Sil: AMZN Mktp' }).click();
    await page
      .getByRole('dialog', { name: 'Alıcıyı sil' })
      .getByRole('button', { name: 'Sil' })
      .click();
    await expect(row(page, 'AMZN Mktp')).toBeHidden();
    expect(await api.transactions()).toHaveLength(3);
  });
});
