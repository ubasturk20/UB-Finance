import { test, expect, open, isoDay } from './fixtures';

// The dashboard's "Yaklaşan Ödemeler" card: credit cards' due dates and loans' next
// installments, only when there are card or loan accounts.

/** The day of the month of a day `offset` days from today */
const dayOfMonth = (offset: number) => Number(isoDay(offset).slice(8, 10));

test.describe('upcoming payments', () => {
  test('lists cards and loans with their dates and totals', async ({ page, api }) => {
    // The statement was cut yesterday and is due in five days, with a purchase on it
    const card = await api.createAccount('Bonus Kart', -150_000, 'credit');
    await api.call('PUT', `/accounts/${card.id}/details`, {
      creditLimit: 5_000_000,
      statementDay: dayOfMonth(-1),
      dueDay: dayOfMonth(5),
      minPaymentRate: 2_000,
    });
    await api.createTransaction({
      accountId: card.id,
      date: isoDay(-1),
      amount: -50_000,
      payeeName: 'Market',
    });
    const loan = await api.createAccount('İhtiyaç Kredisi', -10_000_000, 'loan');
    await api.call('PUT', `/accounts/${loan.id}/details`, {
      loanPrincipal: 10_000_000,
      loanRate: 300,
      loanTerm: 12,
      loanFirstPayment: isoDay(10),
    });

    await open(page, '/dashboard');
    const payments = page.getByRole('region', { name: 'Yaklaşan Ödemeler' });
    await expect(payments).toBeVisible();

    const cardRow = payments.getByRole('link', { name: /Bonus Kart/ });
    await expect(cardRow).toContainText(/gün kaldı/);
    await expect(cardRow).toContainText(/500\s₺/);
    await expect(cardRow).toContainText(/Asgari 100\s₺/);

    const loanRow = payments.getByRole('link', { name: /İhtiyaç Kredisi/ });
    await expect(loanRow).toContainText(/10 gün kaldı/);
    await expect(loanRow).toContainText('0/12 taksit ödendi');

    await expect(payments).toContainText(/Toplam kart borcu\s*2\.000\s₺/);
    await expect(payments).toContainText(/Kalan kredi anaparası\s*100\.000\s₺/);

    // The net worth shows what's owned and owed
    await expect(page.getByLabel('Varlıklar ve borçlar')).toContainText(
      /Varlıklar 0\s₺\s*·\s*Borçlar 102\.000\s₺/,
    );

    // Each row opens its account
    await loanRow.click();
    await expect(page).toHaveURL(new RegExp(`#/accounts/${loan.id}$`));
  });

  test('says where to enter details for a card without them', async ({ page, api }) => {
    await api.createAccount('Axess', -10_000, 'credit');
    await open(page, '/dashboard');
    const payments = page.getByRole('region', { name: 'Yaklaşan Ödemeler' });
    await expect(payments.getByText('Kart ve kredi bilgileri girilmedi')).toBeVisible();
    await payments.getByRole('link', { name: 'Hesaplara git' }).click();
    await expect(page).toHaveURL(/#\/accounts$/);
  });

  test('is hidden without card or loan accounts', async ({ page, api }) => {
    await api.createAccount('Vadesiz', 100_000);
    await open(page, '/dashboard');
    await expect(page.getByText('Net Değer', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Yaklaşan Ödemeler' })).toHaveCount(0);
    await expect(page.getByText('Yaklaşan Ödemeler')).toHaveCount(0);
  });
});
