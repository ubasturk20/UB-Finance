import { test, expect, open, typeAmount } from './fixtures';

test.describe('credit cards', () => {
  test('card details entered in the account dialog show in the card summary', async ({
    page,
    api,
  }) => {
    // 1.500 ₺ owed on the card
    const card = await api.createAccount('Bonus Kart', -150_000, 'credit');
    await open(page, `/accounts/${card.id}`);

    const summary = page.getByRole('region', { name: 'Kart özeti' });
    await expect(summary.getByText('Kart bilgileri girilmedi')).toBeVisible();
    await summary.getByRole('button', { name: 'Kart bilgilerini gir' }).click();

    const dialog = page.getByRole('dialog', { name: 'Hesabı Düzenle' });
    await typeAmount(dialog.getByRole('textbox', { name: 'Limit' }), '10000');
    await dialog.getByRole('textbox', { name: 'Hesap kesim günü' }).fill('15');
    await dialog.getByRole('textbox', { name: 'Son ödeme günü' }).fill('25');
    await dialog.getByRole('textbox', { name: 'Asgari ödeme oranı (%)' }).fill('%20');
    await dialog.getByRole('textbox', { name: 'Aylık faiz oranı (%)' }).fill('4,25');
    await dialog.getByRole('button', { name: 'Kaydet' }).click();
    await expect(dialog).toBeHidden();

    await expect
      .poll(() => api.call('GET', `/accounts/${card.id}/details`))
      .toMatchObject({
        creditLimit: 1_000_000,
        statementDay: 15,
        dueDay: 25,
        minPaymentRate: 2_000,
        interestRate: 425,
      });
    await expect(summary).toContainText(/Limit\s*10\.000\s₺/);
    await expect(summary).toContainText(/Kullanılan\s*1\.500\s₺/);
    await expect(summary).toContainText(/Kullanılabilir limit\s*8\.500\s₺/);
    await expect(summary.getByText('Son ödeme tarihi')).toBeVisible();

    // Opening the dialog again shows what was saved
    await page.getByRole('button', { name: 'Düzenle' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Asgari ödeme oranı (%)' })).toHaveValue('20');
    await expect(dialog.getByRole('textbox', { name: 'Aylık faiz oranı (%)' })).toHaveValue('4,25');
  });

  test('an installment purchase is recorded on the card and listed', async ({ page, api }) => {
    const card = await api.createAccount('Bonus Kart', 0, 'credit');
    await open(page, `/accounts/${card.id}`);

    const summary = page.getByRole('region', { name: 'Kart özeti' });
    await expect(summary.getByText('Taksitli alışveriş yok.')).toBeVisible();
    await summary.getByRole('button', { name: 'Taksitli alışveriş ekle' }).click();

    const dialog = page.getByRole('dialog', { name: 'Taksitli alışveriş ekle' });
    await dialog.getByRole('textbox', { name: 'Açıklama' }).fill('Buzdolabı');
    await typeAmount(dialog.getByRole('textbox', { name: 'Toplam tutar' }), '900');
    await dialog.getByRole('combobox', { name: 'Taksit sayısı' }).selectOption('3');
    await expect(dialog.getByRole('checkbox', { name: /Harcamayı da karta işle/ })).toBeChecked();
    await dialog.getByRole('button', { name: 'Ekle', exact: true }).click();
    await expect(dialog).toBeHidden();

    const item = summary.getByRole('listitem').filter({ hasText: 'Buzdolabı' });
    await expect(item).toContainText('1/3 taksit');
    await expect(item).toContainText(/Aylık 300\s₺/);
    await expect.poll(() => api.balance(card.id)).toBe(-90_000);

    // The whole purchase is on the card as one transaction
    await expect
      .poll(async () => (await api.transactions(`?account_id=${card.id}`)).map((t) => t.amount))
      .toEqual([-90_000]);

    // Deleting the plan keeps the purchase
    await item.getByRole('button', { name: 'Buzdolabı taksitini sil' }).click();
    await page
      .getByRole('dialog', { name: 'Taksiti sil' })
      .getByRole('button', { name: 'Sil' })
      .click();
    await expect(summary.getByText('Taksitli alışveriş yok.')).toBeVisible();
    expect(await api.transactions(`?account_id=${card.id}`)).toHaveLength(1);
  });

  test('other accounts have no card summary', async ({ page, api }) => {
    const checking = await api.createAccount('Vadesiz', 10_000);
    await open(page, `/accounts/${checking.id}`);
    await expect(page.getByRole('heading', { name: 'Vadesiz' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Kart özeti' })).toHaveCount(0);
  });
});
