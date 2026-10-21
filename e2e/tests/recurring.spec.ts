import type { Page } from '@playwright/test';
import { test, expect, open, isoDay, typeAmount, type Api } from './fixtures';

// Recurring bills and income: create one, see it in the month, mark it paid, pause it,
// and let "Find recurring" discover one from history.

/** The row for a schedule in the "All recurring" table */
const scheduleRow = (page: Page, name: string) =>
  page
    .getByRole('main')
    .locator('div')
    .filter({ hasText: name })
    .filter({
      has: page.getByRole('button', { name: 'diğer işlemler' }),
    });

/** Opens the ⋮ menu on a schedule's row */
const openRowMenu = (page: Page, name: string) =>
  scheduleRow(page, name).first().getByRole('button', { name: 'diğer işlemler' }).click();

async function openAll(page: Page) {
  await open(page, '/recurring');
  await page.getByRole('button', { name: 'Tüm düzenli işlemler' }).click();
}

async function createRent(api: Api, accountId: string, extra: object = {}) {
  return api.call('POST', '/schedules', {
    name: 'Rent',
    amount: -150_000,
    recurrenceType: 'monthly',
    startDate: isoDay(2),
    accountId,
    ...extra,
  });
}

test.describe('recurring', () => {
  test('adds a monthly bill through the form', async ({ page, api }) => {
    await api.createAccount('Checking', 500_000);
    await open(page, '/recurring');
    await page
      .getByRole('main')
      .getByRole('button', { name: 'Düzenli işlem ekle' })
      .first()
      .click();

    const dialog = page.getByRole('dialog', { name: 'Düzenli işlem ekle' });
    await dialog.getByRole('textbox', { name: 'Ad', exact: true }).fill('Streaming Plus');
    await typeAmount(dialog.getByRole('textbox', { name: 'Tutar' }), '15.99');
    await expect(dialog.getByRole('button', { name: 'Gider' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await dialog.getByRole('combobox', { name: 'Sıklık' }).selectOption('monthly');
    await dialog.getByRole('combobox', { name: 'Hesap' }).selectOption({ label: 'Checking' });
    await dialog.getByRole('textbox', { name: 'Başlangıç tarihi' }).fill(isoDay(1));
    await dialog.getByRole('button', { name: 'Düzenli işlem ekle' }).click();
    await expect(dialog).toBeHidden();

    const [schedule] = await api.call<any[]>('GET', '/schedules');
    expect(schedule).toMatchObject({
      name: 'Streaming Plus',
      amount: -1_599,
      recurrenceType: 'monthly',
      status: 'active',
      startDate: isoDay(1),
    });

    await page.getByRole('button', { name: 'Tüm düzenli işlemler' }).click();
    await expect(scheduleRow(page, 'Streaming Plus').first()).toContainText('15,99 ₺');
  });

  test('picking or creating a payee or category keeps what was already filled in', async ({
    page,
    api,
  }) => {
    await api.createAccount('Checking', 500_000);
    await api.createAccount('Savings', 100_000, 'savings');
    await open(page, '/recurring');
    await page
      .getByRole('main')
      .getByRole('button', { name: 'Düzenli işlem ekle' })
      .first()
      .click();
    const dialog = page.getByRole('dialog', { name: 'Düzenli işlem ekle' });
    const name = dialog.getByRole('textbox', { name: 'Ad', exact: true });
    const account = dialog.getByRole('combobox', { name: 'Hesap' });

    await name.fill('Gym membership');
    await typeAmount(dialog.getByRole('textbox', { name: 'Tutar' }), '45');
    await account.selectOption({ label: 'Savings' });

    // A brand-new payee (creating it refreshes the payee list)
    await dialog.getByRole('textbox', { name: 'Alıcı' }).fill('Iron Temple Gym');
    await dialog.getByRole('button', { name: /Yeni alıcı oluştur/ }).click();
    await expect(dialog.getByRole('textbox', { name: 'Alıcı' })).toHaveValue('Iron Temple Gym');
    await expect(name).toHaveValue('Gym membership');
    await expect(account).toHaveValue(/.+/);
    await expect(account.locator('option:checked')).toHaveText('Savings');

    // A brand-new category: none of its buttons may submit the form
    await dialog.getByRole('button', { name: /^Kategori:/ }).click();
    await dialog.getByRole('button', { name: 'Yeni kategori oluştur' }).click();
    await dialog.getByRole('textbox', { name: 'Yeni kategori adı' }).fill('Fitness');
    await dialog.getByRole('button', { name: 'Oluştur', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Kategori: Fitness' })).toBeVisible();
    await expect(dialog).toBeVisible();
    await expect(name).toHaveValue('Gym membership');
    await expect(account.locator('option:checked')).toHaveText('Savings');
    await expect(dialog.getByRole('textbox', { name: 'Alıcı' })).toHaveValue('Iron Temple Gym');

    await dialog.getByRole('button', { name: 'Düzenli işlem ekle' }).click();
    await expect(dialog).toBeHidden();
    const [schedule] = await api.call<any[]>('GET', '/schedules');
    expect(schedule).toMatchObject({ name: 'Gym membership', amount: -4_500 });
  });

  test('marking a bill paid records the transaction', async ({ page, api }) => {
    const checking = await api.createAccount('Checking', 500_000);
    await createRent(api, checking.id);
    await openAll(page);
    await openRowMenu(page, 'Rent');
    await page.getByRole('menuitem', { name: 'Sıradakini ödendi olarak işaretle' }).click();

    await expect.poll(() => api.balance(checking.id)).toBe(350_000);
    const [paid] = await api.transactions(`?account_id=${checking.id}&from=2000-01-01`);
    expect(paid).toMatchObject({ amount: -150_000, payeeName: 'Rent', date: isoDay(2) });
  });

  test('pausing keeps the schedule settings', async ({ page, api }) => {
    const checking = await api.createAccount('Checking', 0);
    await createRent(api, checking.id, {
      amountType: 'approximate',
      weekendAdjust: 'before',
      dateFlexibility: 6,
      autoCreate: 1,
    });
    await openAll(page);
    await openRowMenu(page, 'Rent');
    await page.getByRole('menuitem', { name: 'Duraklat' }).click();

    await expect
      .poll(async () => (await api.call<any[]>('GET', '/schedules'))[0])
      .toMatchObject({
        status: 'paused',
        amountType: 'approximate',
        weekendAdjust: 'before',
        dateFlexibility: 6,
        autoCreate: 1,
      });
    await openRowMenu(page, 'Rent');
    await expect(page.getByRole('menuitem', { name: 'Sürdür' })).toBeVisible();
  });

  test('cancelling hides a schedule behind "Show canceled"', async ({ page, api }) => {
    const checking = await api.createAccount('Checking', 0);
    await createRent(api, checking.id);
    await openAll(page);
    await openRowMenu(page, 'Rent');
    await page.getByRole('menuitem', { name: 'Düzenli işlemi iptal et' }).click();
    await page
      .getByRole('dialog', { name: 'Düzenli işlem iptal edilsin mi?' })
      .getByRole('button', { name: 'İptal et', exact: true })
      .click();
    await expect
      .poll(async () => (await api.call<any[]>('GET', '/schedules'))[0].status)
      .toBe('canceled');
    await expect(page.getByText(/İptal edilen düzenli işlemleri göster/)).toBeVisible();
  });

  test('"Find recurring" discovers a subscription from past transactions', async ({
    page,
    api,
  }) => {
    const checking = await api.createAccount('Checking', 500_000);
    // Four monthly charges on the 5th
    const now = new Date();
    for (let i = 4; i >= 1; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 5);
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-05`;
      await api.createTransaction({
        accountId: checking.id,
        date,
        amount: -1_299,
        payeeName: 'MusicBox',
      });
    }
    await open(page, '/recurring');
    await page
      .getByRole('main')
      .getByRole('button', { name: 'Düzenli işlemleri bul' })
      .first()
      .click();
    const dialog = page.getByRole('dialog', { name: 'Düzenli işlemleri ara' });
    await expect(dialog).toContainText('Her ayın 5. günü');
    await dialog.getByRole('checkbox', { name: 'Takip et: MusicBox' }).press('Space');
    await expect(dialog.getByRole('checkbox', { name: 'Takip et: MusicBox' })).toBeChecked();
    await dialog.getByRole('button', { name: '1 düzenli işlem oluştur' }).click();

    await expect
      .poll(async () => (await api.call<any[]>('GET', '/schedules')).map((s) => s.name))
      .toEqual(['MusicBox']);
    const [schedule] = await api.call<any[]>('GET', '/schedules');
    expect(schedule).toMatchObject({
      recurrenceType: 'monthly',
      amount: -1_299,
      source: 'detected',
    });
  });
});
