import type { Page } from '@playwright/test';
import { test, expect, open, isoDay, type Api } from './fixtures';

// Rules: build one in the editor, preview and apply it to existing transactions, and
// check it runs on new ones.

async function seedCoffee(api: Api) {
  const checking = await api.createAccount('Checking', 100_000);
  for (const [day, amount] of [
    [-1, -450],
    [-2, -525],
    [-3, -610],
  ]) {
    await api.createTransaction({
      accountId: checking.id,
      date: isoDay(day),
      amount,
      payeeName: `Blue Bottle Coffee #${-day}`,
    });
  }
  await api.createTransaction({
    accountId: checking.id,
    date: isoDay(-1),
    amount: -9_900,
    payeeName: 'Hardware Store',
  });
  return checking;
}

async function buildCoffeeRule(page: Page, expectedMatches: number) {
  await page.getByRole('main').getByRole('button', { name: 'Kural ekle' }).click();
  const dialog = page.getByRole('dialog', { name: 'Yeni kural' });
  await dialog.getByRole('combobox', { name: 'Alan' }).selectOption({ label: 'Alıcı adı' });
  await dialog.getByRole('combobox', { name: 'Operatör' }).selectOption({ label: 'içerir' });
  await dialog.getByRole('textbox', { name: 'Metin…' }).fill('coffee');
  // Live preview of what the conditions match
  await expect(dialog).toContainText(
    expectedMatches ? `${expectedMatches} işlemle eşleşiyor` : 'Henüz eşleşen işlem yok',
  );
  await dialog.getByRole('button', { name: 'Kategori seçin…' }).click();
  await page.getByPlaceholder('Kategori ara…').fill('coffee');
  await page.getByRole('button', { name: /Coffee Shops/ }).click();
  return dialog;
}

test.describe('rules', () => {
  test('a new rule can be applied to existing transactions', async ({ page, api }) => {
    await seedCoffee(api);
    await open(page, '/rules');
    const dialog = await buildCoffeeRule(page, 3);
    await dialog
      .getByRole('checkbox', { name: 'Kaydettikten sonra mevcut işlemlere uygula' })
      .check();
    await dialog.getByRole('button', { name: 'Kuralı kaydet' }).click();

    const apply = page.getByRole('dialog', { name: 'Kuralı mevcut işlemlere uygula' });
    await expect(apply.getByRole('checkbox', { name: 'Bu işlemi dahil et' })).toHaveCount(3);
    // Leave one out
    await apply.getByRole('checkbox', { name: 'Bu işlemi dahil et' }).first().uncheck();
    await apply.getByRole('button', { name: '2 işleme uygula' }).click();
    await expect(apply).toContainText('2 işlem güncellendi');
    await apply.getByRole('button', { name: 'Bitti' }).click();

    const coffee = (await api.category('Coffee Shops')).id;
    const txs = await api.transactions();
    const categorized = txs.filter((t) => t.categoryId === coffee).map((t) => t.payeeName);
    expect(categorized).toHaveLength(2);
    expect(categorized.every((n: string) => n.includes('Coffee'))).toBe(true);
    expect(txs.find((t) => t.payeeName === 'Hardware Store').categoryId).toBeNull();
  });

  test('rules run on transactions entered by hand', async ({ page, api }) => {
    const checking = await api.createAccount('Checking', 100_000);
    await open(page, '/rules');
    const dialog = await buildCoffeeRule(page, 0);
    await dialog.getByRole('button', { name: 'Kuralı kaydet' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('main')).toContainText('Coffee Shops');

    await open(page, `/accounts/${checking.id}`);
    await page.getByRole('button', { name: 'İşlem ekle' }).click();
    const form = page.getByRole('form', { name: 'Yeni işlem' });
    await form.getByRole('textbox', { name: 'Alıcı' }).fill('Corner Coffee Co');
    await form.getByRole('textbox', { name: 'Çıkış' }).fill('3.75');
    await form.getByRole('button', { name: 'Kaydet' }).click();
    await expect(
      page.getByTestId('transaction-row').filter({ hasText: 'Corner Coffee Co' }),
    ).toContainText('Coffee Shops');
  });

  test('turning a rule off keeps its settings and position', async ({ page, api }) => {
    await api.createAccount('Checking');
    const common = { actions: [{ type: 'set_notes', value: 'x' }] };
    await api.call('POST', '/rules', {
      ...common,
      conditions: [{ field: 'payee_name', op: 'contains', value: 'first' }],
      sortOrder: 0,
    });
    const second = await api.call('POST', '/rules', {
      ...common,
      conditionsOp: 'or',
      conditions: [
        { field: 'payee_name', op: 'contains', value: 'a' },
        { field: 'notes', op: 'contains', value: 'b' },
      ],
      sortOrder: 1,
    });

    await open(page, '/rules');
    await page.getByRole('switch', { name: 'Kuralı kapat' }).nth(1).click();
    await expect(page.getByRole('switch', { name: 'Kuralı aç' })).not.toBeChecked();

    const rules = await api.call<any[]>('GET', '/rules');
    expect(rules.map((r) => r.id)).toEqual([expect.any(String), second.id]);
    expect(rules[1]).toMatchObject({ enabled: false, conditionsOp: 'or', sortOrder: 1 });
  });

  test('deletes a rule', async ({ page, api }) => {
    await api.createAccount('Checking');
    await api.call('POST', '/rules', {
      conditions: [{ field: 'payee_name', op: 'is', value: 'Gym' }],
      actions: [{ type: 'set_notes', value: 'fitness' }],
    });
    await open(page, '/rules');
    await page.getByRole('button', { name: 'Sil', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'Kuralı sil' })
      .getByRole('button', { name: 'Sil' })
      .click();
    await expect(page.getByRole('button', { name: 'İlk kuralı ekle' })).toBeVisible();
    expect(await api.call('GET', '/rules')).toEqual([]);
  });
});
