import { test, expect, open, typeAmount } from './fixtures';

/** The 15th of next month, as yyyy-MM-dd */
function fifteenthOfNextMonth() {
  const d = new Date();
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 15);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-15`;
}

test.describe('loans', () => {
  test('loan details entered in the account dialog give a summary and a payment plan', async ({
    page,
    api,
  }) => {
    // 95.000 ₺ owed on the books, while the plan will say 100.000 ₺
    const loan = await api.createAccount('İhtiyaç Kredisi', -9_500_000, 'loan');
    const firstPayment = fifteenthOfNextMonth();
    await open(page, `/accounts/${loan.id}`);

    const summary = page.getByRole('region', { name: 'Kredi özeti' });
    await expect(summary.getByText('Kredi bilgileri girilmedi')).toBeVisible();
    await summary.getByRole('button', { name: 'Kredi bilgilerini gir' }).click();

    const dialog = page.getByRole('dialog', { name: 'Hesabı Düzenle' });
    // An ihtiyaç kredisi suggests %15 BSMV and KKDF
    await expect(dialog.getByRole('textbox', { name: 'BSMV (%)' })).toHaveAttribute(
      'placeholder',
      /15/,
    );
    await typeAmount(dialog.getByRole('textbox', { name: 'Çekilen tutar' }), '100000');
    await dialog.getByRole('textbox', { name: 'Aylık faiz oranı (%)' }).fill('3');
    await dialog.getByRole('textbox', { name: 'Vade (ay)' }).fill('12');
    await dialog.getByLabel('İlk taksit tarihi').fill(firstPayment);
    await dialog.getByRole('button', { name: 'Kaydet' }).click();
    await expect(dialog).toBeHidden();

    await expect
      .poll(() => api.call('GET', `/accounts/${loan.id}/details`))
      .toMatchObject({
        loanPrincipal: 10_000_000,
        loanRate: 300,
        loanTerm: 12,
        loanFirstPayment: firstPayment,
        loanBsmvRate: null,
        loanKkdfRate: null,
      });

    // Nothing paid yet: the whole principal is left; r' = %3 × 1,30 = %3,9
    await expect(summary).toContainText(/Kalan anapara\s*100\.000\s₺/);
    await expect(summary).toContainText(/Ödenen \/ Kalan taksit\s*0\/12/);
    await expect(summary).toContainText(/Aylık taksit\s*10\.593,48\s₺/);
    await expect(summary).toContainText(/gün kaldı/);

    // The payment plan: 12 installments, the first one on the day entered
    await summary.getByRole('button', { name: 'Ödeme planını göster' }).click();
    const plan = summary.getByRole('table', { name: 'Ödeme planı' });
    await expect(plan.getByRole('row')).toHaveCount(13);
    await expect(plan.getByRole('columnheader', { name: 'KKDF' })).toBeVisible();
    await expect(plan.getByRole('row').nth(1)).toContainText(/3\.000\s₺/);

    // The balance follows the plan's remaining principal, through a correction
    await summary.getByRole('button', { name: 'Bakiyeyi kalan anaparaya eşitle' }).click();
    await page
      .getByRole('dialog', { name: 'Bakiyeyi eşitle' })
      .getByRole('button', { name: 'Eşitle' })
      .click();
    await expect.poll(() => api.balance(loan.id)).toBe(-10_000_000);
    await expect(summary.getByText('Bakiye kalan anaparayla aynı')).toBeVisible();

    // Opening the dialog again shows what was saved
    await page.getByRole('button', { name: 'Düzenle' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Vade (ay)' })).toHaveValue('12');
    await expect(dialog.getByRole('textbox', { name: 'Aylık faiz oranı (%)' })).toHaveValue('3');
    await expect(dialog.getByLabel('İlk taksit tarihi')).toHaveValue(firstPayment);
  });

  test('a konut kredisi suggests no BSMV or KKDF', async ({ page, api }) => {
    const home = await api.createAccount('Konut Kredisi', -200_000_000, 'mortgage');
    await open(page, `/accounts/${home.id}`);
    await page.getByRole('button', { name: 'Düzenle' }).click();
    const dialog = page.getByRole('dialog', { name: 'Hesabı Düzenle' });
    await expect(dialog.getByRole('textbox', { name: 'KKDF (%)' })).toHaveAttribute(
      'placeholder',
      /0/,
    );
    await expect(page.getByRole('region', { name: 'Kart özeti' })).toHaveCount(0);
  });
});
