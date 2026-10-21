import { test, expect, open, isoDay, thisMonth } from './fixtures';
import { startDesktopServer, stopDesktopServer } from './serverControl';

// Losing the connection to FlyBudget's server never locks you out: on startup the app
// shows a reconnect screen that keeps retrying (or opens with the offline copy, see
// server-mode/auth.spec.ts), and mid-session it keeps what's on screen, pauses saving
// except for new transactions (they wait on the device), and picks up again by itself.

test('the reconnect screen retries on its own and the app loads without a reload', async ({
  page,
  api,
}) => {
  await api.createAccount('Everyday Checking', 150_000);
  // The API doesn't answer yet (e.g. the server is still starting)
  await page.route('**/api/**', (route) => route.abort('connectionrefused'));
  await open(page, '/dashboard');

  await expect(
    page.getByRole('heading', { name: 'UB-Finance yeniden başlatılıyor' }),
  ).toBeVisible();
  await expect(page.getByText(/\d+ sn sonra tekrar denenecek|Kontrol ediliyor…/)).toBeVisible();
  await expect(
    page.getByRole('progressbar', { name: 'Bir sonraki denemeye kalan süre' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Şimdi dene' })).toBeVisible();
  await expect(page.getByText('Verileriniz bu bilgisayarda güvende.')).toBeVisible();

  // The server answers again: no clicks, no reload
  await page.unroute('**/api/**');
  await expect(page.getByRole('link', { name: 'Tüm hesaplar 1.500 ₺' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole('heading', { name: 'UB-Finance yeniden başlatılıyor' })).toBeHidden();
});

test('"Try now" reconnects straight away', async ({ page, api }) => {
  await api.createAccount('Everyday Checking', 150_000);
  await page.route('**/api/**', (route) => route.abort('connectionrefused'));
  await open(page, '/dashboard');
  await expect(page.getByRole('button', { name: 'Şimdi dene' })).toBeVisible();
  await page.unroute('**/api/**');
  await page.getByRole('button', { name: 'Şimdi dene' }).click();
  await expect(page.getByRole('link', { name: 'Tüm hesaplar 1.500 ₺' })).toBeVisible();
});

test('mid-session the app keeps what it loaded, keeps new transactions, and recovers', async ({
  page,
  api,
}) => {
  const account = await api.createAccount('Everyday Checking', 150_000);
  await api.createTransaction({
    accountId: account.id,
    date: isoDay(),
    amount: -4_250,
    payeeName: 'Corner Grocery',
  });
  const groceries = await api.category('Groceries');
  await api.call('PUT', `/budget/${thisMonth()}/${groceries.id}`, { budgeted: 50_000 });
  await open(page, '/budget');
  const planned = page.getByRole('button', { name: /^Groceries için planlanan:/ });
  await expect(planned).toBeEnabled();
  await open(page, `/accounts/${account.id}`);
  await expect(page.getByText('Corner Grocery')).toBeVisible();
  await expect(page.getByRole('button', { name: 'İşlem ekle' })).toBeEnabled();

  await stopDesktopServer();
  try {
    // The next request finds the server gone (a page that hasn't loaded its data yet)
    const nav = page.getByRole('complementary');
    await nav.getByRole('link', { name: 'İşlemler', exact: true }).click();
    const banner = page.getByRole('status', { name: 'Bağlantı' });
    await expect(banner).toContainText("UB-Finance'a ulaşılamıyor. Verileriniz");
    await expect(banner).toContainText(
      'Yeni işlemler bu cihaza kaydedilir; diğer değişiklikler bağlantı geri gelene kadar bekler.',
    );
    await expect(banner).toContainText(/\d+ sn sonra tekrar denenecek|Kontrol ediliyor…/);
    // What was loaded stays on screen, but can't be changed
    await nav.getByRole('link', { name: 'Bütçe', exact: true }).click();
    await expect(planned).toBeVisible();
    await expect(planned).toBeDisabled();
    await expect(
      page.getByRole('button', { name: /^Sunucu durumu: Yeniden bağlanıyor/ }),
    ).toBeVisible();

    // In-app navigation (no reload) back to the account
    await page.evaluate((id) => (window.location.hash = `#/accounts/${id}`), account.id);
    await expect(page.getByText('Corner Grocery')).toBeVisible();
    // A new transaction is kept on this device until the server is back
    await page.getByRole('button', { name: 'İşlem ekle' }).click();
    const form = page.getByRole('form', { name: 'Yeni işlem' });
    await form.getByRole('textbox', { name: 'Alıcı' }).fill('Coffee Cart');
    await form.getByRole('textbox', { name: 'Çıkış' }).fill('4.75');
    await form.getByRole('button', { name: 'Kaydet' }).click();
    await expect(form).toBeHidden();
    await expect(
      page.getByRole('region', { name: 'Bu cihaza kaydedildi' }).getByTestId('waiting-transaction'),
    ).toContainText('Coffee Cart');
    await expect(banner).toContainText('1 işlem gönderilmeyi bekliyor');
  } finally {
    await startDesktopServer();
  }

  // Back: "Retry now" checks straight away (unless an automatic retry got there first)
  await page
    .getByRole('status', { name: 'Bağlantı' })
    .getByRole('button', { name: 'Şimdi tekrar dene' })
    .click({ timeout: 2_000 })
    .catch(() => {});
  await expect(page.getByRole('status', { name: 'Bağlantı' })).toContainText(
    'Yeniden bağlanıldı. Her şey güncel.',
  );
  await expect(page.getByRole('button', { name: /^Sunucu durumu: Çevrimiçi/ })).toBeVisible();
  // The waiting transaction was sent, once
  await expect(page.getByRole('region', { name: 'Bu cihaza kaydedildi' })).toBeHidden();
  await expect(
    page.getByTestId('transaction-row').filter({ hasText: 'Coffee Cart' }),
  ).toBeVisible();
  const saved = await api.call<{ payeeName: string }[]>(
    'GET',
    `/transactions?accountId=${account.id}`,
  );
  expect(saved.filter((t) => t.payeeName === 'Coffee Cart')).toHaveLength(1);
});

test('the sidebar shows where the data lives and links to Settings → Server', async ({
  page,
  api,
}) => {
  await api.createAccount('Everyday Checking');
  await open(page, '/dashboard');
  const status = page.getByRole('button', { name: 'Sunucu durumu: Çevrimiçi, Bu bilgisayarda' });
  await expect(status).toHaveAttribute('aria-expanded', 'false');
  await status.click();
  const menu = page.getByRole('menu', { name: 'Sunucu' });
  await expect(menu).toContainText('Sunucu çevrimiçi');
  await expect(menu).toContainText('Bu bilgisayarda kalır');
  await expect(menu).toContainText(/Sürüm\s*\d+\.\d+\.\d+/);
  // No login in the desktop app, so nothing to sign out of
  await expect(menu.getByRole('menuitem', { name: 'Çıkış yap' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(status).toBeFocused();

  await status.click();
  await page.getByRole('menuitem', { name: 'Sunucu ayarları' }).click();
  await expect(page.getByRole('heading', { name: 'Verileriniz nerede' })).toBeVisible();
  await expect(page.getByRole('main').getByText('Bu bilgisayarda', { exact: true })).toBeVisible();
  const guide = page.getByRole('link', { name: 'Sunucu kurulum kılavuzunu oku' });
  await expect(guide).toHaveAttribute('href', 'https://flybudget.org/community/self-hosting');
  await expect(guide).toHaveAttribute('target', '_blank');
  await expect(guide).toHaveAttribute('rel', 'noopener noreferrer');
  await page.getByRole('button', { name: 'Önce yedek al' }).click();
  await expect(page.getByRole('button', { name: 'Yedeği indir' })).toBeVisible();
});

test('server details are only for the app itself', async ({ playwright, baseURL, api }) => {
  const info = await api.call('GET', '/server/info');
  expect(info).toEqual({ mode: 'desktop', version: expect.stringMatching(/^\d+\.\d+\.\d+/) });
  // Without the per-launch token: refused, while health says only that it's up
  const stranger = await playwright.request.newContext({ baseURL });
  expect((await stranger.get('/api/server/info')).status()).toBe(401);
  expect(await (await stranger.get('/api/health')).json()).toEqual({ status: 'ok' });
  await stranger.dispose();
});
