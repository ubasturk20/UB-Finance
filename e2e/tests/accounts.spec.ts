import { test, expect, open, isoDay, typeAmount } from './fixtures';

test.describe('accounts', () => {
  test('a new user adds their first account from the welcome screen', async ({ page, api }) => {
    await open(page, '/dashboard');
    await page.getByRole('button', { name: /Hesapları elle ekle/ }).click();

    const dialog = page.getByRole('dialog', { name: 'Hesap Ekle' });
    await dialog.getByRole('textbox', { name: 'Hesap adı' }).fill('Chase Checking');
    await dialog.getByRole('combobox', { name: 'Hesap türü' }).selectOption('checking');
    await dialog.getByRole('textbox', { name: 'Güncel Bakiye' }).fill('1234.56');
    await dialog.getByRole('button', { name: 'Hesap Ekle' }).click();

    await expect
      .poll(async () => (await api.accounts()).map((a) => a.name))
      .toEqual(['Chase Checking']);
    const [account] = await api.accounts();
    expect(account.balance).toBe(123_456);
    // Checking accounts are on budget by default
    expect(account).toMatchObject({ isOffBudget: 0 });
  });

  test('"Skip for now" opens the app, and it stays open after a reload', async ({ page }) => {
    await open(page, '/welcome');
    await page.getByRole('button', { name: 'Şimdilik geç ve etrafa göz at' }).click();
    await expect(page).toHaveURL(/#\/dashboard$/);
    await expect(
      page.getByRole('complementary').getByRole('link', { name: 'Bütçe' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: "UB-Finance'ı kullanmaya başlayın" }),
    ).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/#\/dashboard$/);
    await expect(
      page.getByRole('heading', { name: "UB-Finance'ı kullanmaya başlayın" }),
    ).toBeVisible();
  });

  test('the assets and liabilities summary lists only the kinds of accounts you have', async ({
    page,
    api,
  }) => {
    await api.createAccount('Checking', 120_000);
    await open(page, '/accounts');
    const main = page.getByRole('main');
    await expect(main.getByText('Varlıklar', { exact: true })).toBeVisible();
    // No "0 ₺" rows for kinds of accounts that were never added
    await expect(main.getByText('Yatırımlar', { exact: true })).toHaveCount(0);
    await expect(main.getByText('Kredi', { exact: true })).toHaveCount(0);
    await expect(main.getByText('Henüz kredi kartı ya da kredi yok.')).toBeVisible();

    await main.getByRole('link', { name: 'Hesap ekle' }).click();
    await expect(page.getByRole('dialog', { name: 'Hesap Ekle' })).toBeVisible();
  });

  test('investments, property and loans default to off budget', async ({ page, api }) => {
    await api.createAccount('Checking', 0);
    await open(page, '/accounts');
    await page.getByRole('main').getByRole('button', { name: 'Hesap Ekle' }).click();
    const dialog = page.getByRole('dialog', { name: 'Hesap Ekle' });
    await dialog.getByRole('textbox', { name: 'Hesap adı' }).fill('Home');
    await dialog.getByRole('combobox', { name: 'Hesap türü' }).selectOption('real_estate');
    await expect(dialog.getByRole('checkbox', { name: /Bütçe dışı/ })).toBeChecked();
    await dialog.getByRole('textbox', { name: 'Güncel Değer' }).fill('350000');
    await dialog.getByRole('button', { name: 'Hesap Ekle' }).click();
    await expect(dialog).toBeHidden();

    await expect
      .poll(async () => (await api.accounts()).find((a) => a.name === 'Home'))
      .toMatchObject({ isOffBudget: 1, balance: 35_000_000 });
  });

  test("a starting balance that isn't an amount can't be created as 0", async ({ page, api }) => {
    await api.createAccount('Checking', 0);
    await open(page, '/accounts');
    await page.getByRole('main').getByRole('button', { name: 'Hesap Ekle' }).click();
    const dialog = page.getByRole('dialog', { name: 'Hesap Ekle' });
    await dialog.getByRole('textbox', { name: 'Hesap adı' }).fill('Girokonto');
    const balance = dialog.getByRole('textbox', { name: 'Güncel Bakiye' });
    await balance.fill('1.234.5');
    // Refused as soon as it's typed, before the field is left
    await expect(dialog.getByRole('button', { name: 'Hesap Ekle' })).toBeDisabled();
    await balance.press('Enter');
    await expect(dialog).toBeVisible();

    await balance.fill('1.234,50');
    await dialog.getByRole('button', { name: 'Hesap Ekle' }).click();
    await expect(dialog).toBeHidden();
    await expect
      .poll(async () => (await api.accounts()).find((a) => a.name === 'Girokonto')?.balance)
      .toBe(123_450);
  });

  test('renaming an account keeps its balance', async ({ page, api }) => {
    const account = await api.createAccount('Checking', 250_000);
    await api.createTransaction({
      accountId: account.id,
      date: isoDay(),
      amount: -12_345,
      payeeName: 'Rent',
    });
    await open(page, `/accounts/${account.id}`);
    await page.getByRole('button', { name: 'Düzenle' }).click();
    const dialog = page.getByRole('dialog', { name: 'Hesabı Düzenle' });
    await dialog.getByRole('textbox', { name: 'Hesap adı' }).fill('Joint Checking');
    await dialog.getByRole('button', { name: 'Kaydet' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Joint Checking' })).toBeVisible();
    await expect(page.getByRole('main')).toContainText('2.376,55 ₺');
    expect(await api.balance(account.id)).toBe(237_655);
  });

  test('changing the starting balance moves the balance', async ({ page, api }) => {
    const account = await api.createAccount('Checking', 10_000);
    await open(page, `/accounts/${account.id}`);
    await page.getByRole('button', { name: 'Düzenle' }).click();
    const dialog = page.getByRole('dialog', { name: 'Hesabı Düzenle' });
    await typeAmount(dialog.getByRole('textbox', { name: 'Açılış bakiyesi' }), '500');
    await dialog.getByRole('button', { name: 'Kaydet' }).click();
    await expect.poll(() => api.balance(account.id)).toBe(50_000);
  });

  test("text that isn't an amount is marked and keeps the balance it had", async ({
    page,
    api,
  }) => {
    const account = await api.createAccount('Checking', 10_000);
    await open(page, `/accounts/${account.id}`);
    await page.getByRole('button', { name: 'Düzenle' }).click();
    const dialog = page.getByRole('dialog', { name: 'Hesabı Düzenle' });
    const field = dialog.getByRole('textbox', { name: 'Açılış bakiyesi' });
    await typeAmount(field, '12.5.0');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveValue('12.5.0');
    await expect(dialog.getByRole('alert')).toHaveText(
      'Bu bir tutar değil. 12,50 ya da 12.50 gibi yazın.',
    );
    await dialog.getByRole('button', { name: 'Kaydet' }).click();
    await expect.poll(() => api.balance(account.id)).toBe(10_000);
  });

  test('closing an account hides it', async ({ page, api }) => {
    await api.createAccount('Keep Me', 100);
    const account = await api.createAccount('Old Card', -500, 'credit');
    await open(page, `/accounts/${account.id}`);
    await page.getByRole('button', { name: 'Düzenle' }).click();
    await page
      .getByRole('dialog', { name: 'Hesabı Düzenle' })
      .getByRole('button', { name: 'Hesabı Kapat' })
      .click();
    await page
      .getByRole('dialog', { name: 'Hesabı Kapat' })
      .getByRole('button', { name: 'Hesabı Kapat' })
      .click();

    await expect.poll(async () => (await api.accounts()).map((a) => a.name)).toEqual(['Keep Me']);
    await open(page, '/accounts');
    await expect(page.getByRole('heading', { level: 1, name: 'Hesaplar' })).toBeVisible();
    await expect(page.getByText('Old Card')).toBeHidden();
  });

  test('updating an investment value records the change', async ({ page, api }) => {
    await api.createAccount('Checking', 0);
    const brokerage = await api.createAccount('Brokerage', 1_000_000, 'investment');
    await open(page, `/accounts/${brokerage.id}`);
    await page.getByRole('button', { name: 'Değeri güncelle' }).click();
    const dialog = page.getByRole('dialog', { name: 'Değeri Güncelle' });
    await typeAmount(dialog.getByRole('textbox', { name: 'Bugünkü değer' }), '10500');
    await dialog.getByRole('button', { name: 'Kaydet' }).click();

    await expect.poll(() => api.balance(brokerage.id)).toBe(1_050_000);
    const [adjustment] = await api.transactions(`?account_id=${brokerage.id}`);
    expect(adjustment).toMatchObject({
      amount: 50_000,
      notes: 'Değer güncellemesi',
      isAdjustment: 1,
    });

    // A change in value isn't money earned or spent: reports leave it out
    await open(page, '/reports');
    const main = page.getByRole('main');
    await expect(main).toContainText(/0\s₺\s*Toplam Gelir/);
    await expect(main).toContainText(/0\s₺\s*Toplam Gider/);
  });

  test('the accounts page totals assets and liabilities', async ({ page, api }) => {
    await api.createAccount('Checking', 300_000);
    await api.createAccount('Visa', -45_000, 'credit');
    await api.createAccount('Car Loan', -1_200_000, 'auto_loan');
    await open(page, '/accounts');
    const main = page.getByRole('main');
    await expect(main).toContainText(/Net Değer\s*-9\.450\s₺/);
    await expect(main).toContainText(/Varlıklar\s*3\.000\s₺/);
    await expect(main).toContainText(/Borçlar\s*-12\.450\s₺/);
    await expect(main).toContainText(/Krediler\s*-12\.000\s₺/);
  });
});
