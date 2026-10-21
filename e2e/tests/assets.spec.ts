import { test, expect, open, typeAmount } from './fixtures';

test.describe('assets', () => {
  test('a gold account is valued as quantity × unit price, also in the net worth', async ({
    page,
    api,
  }) => {
    const gold = await api.createAccount('Altın Birikimi', 0, 'valuables');
    await open(page, `/accounts/${gold.id}`);

    const summary = page.getByRole('region', { name: 'Varlık özeti' });
    await expect(summary.getByText('Miktar girilmedi')).toBeVisible();
    await summary.getByRole('button', { name: 'Miktarı gir' }).click();

    const dialog = page.getByRole('dialog', { name: 'Hesabı Düzenle' });
    await dialog.getByRole('textbox', { name: 'Miktar', exact: true }).fill('10');
    await dialog.getByLabel('Birim', { exact: true }).fill('gram altın');
    await dialog.getByRole('button', { name: 'Kaydet' }).click();
    await expect(dialog).toBeHidden();
    await expect
      .poll(() => api.call('GET', `/accounts/${gold.id}/details`))
      .toMatchObject({ assetQuantity: '10', assetUnit: 'gram altın', assetUnitPrice: null });
    await expect(summary).toContainText('birim fiyatı girilmedi');

    // A new unit price: the preview shows the value, and saving corrects the balance
    await summary.getByRole('button', { name: 'Birim fiyatını güncelle' }).click();
    const price = page.getByRole('dialog', { name: 'Birim fiyatını güncelle' });
    await typeAmount(price.getByRole('textbox', { name: 'Birim fiyatı (gram altın)' }), '3000');
    await expect(price).toContainText(/Yeni değer\s*30\.000\s₺/);
    await price.getByRole('button', { name: 'Güncelle', exact: true }).click();
    await expect(price).toBeHidden();

    await expect.poll(() => api.balance(gold.id)).toBe(3_000_000);
    await expect(summary).toContainText(/10 gram altın × 3\.000\s₺ = 30\.000\s₺/);
    await expect(summary).toContainText('Fiyat tarihi');

    // The net worth in grams of gold, at that price
    await open(page, '/accounts');
    const equivalents = page.getByRole('list', { name: 'Net değerin karşılıkları' });
    await expect(equivalents).toContainText('≈ 10 gram altın');
  });

  test('quantities can be typed with a decimal comma', async ({ page, api }) => {
    const fund = await api.createAccount('Para Piyasası Fonu', 0, 'investment');
    await open(page, `/accounts/${fund.id}`);
    await page.getByRole('button', { name: 'Düzenle', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Hesabı Düzenle' });
    const quantity = dialog.getByRole('textbox', { name: 'Miktar', exact: true });
    await quantity.fill('12,5x');
    await expect(quantity).toHaveAttribute('aria-invalid', 'true');
    await expect(dialog.getByRole('button', { name: 'Kaydet' })).toBeDisabled();
    await quantity.fill('1.234,5');
    await dialog.getByLabel('Birim', { exact: true }).fill('pay');
    await dialog.getByRole('button', { name: 'Kaydet' }).click();
    await expect(dialog).toBeHidden();
    await expect
      .poll(() => api.call('GET', `/accounts/${fund.id}/details`))
      .toMatchObject({ assetQuantity: '1234.5', assetUnit: 'pay' });
    await expect(page.getByRole('region', { name: 'Varlık özeti' })).toContainText('1.234,5 pay');
  });
});
