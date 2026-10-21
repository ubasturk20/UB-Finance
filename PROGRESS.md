# İlerleme Notları

Gelecek oturumlar buradan devam eder; analiz tekrar yapılmaz. Plan: `DEVELOPMENT_PLAN.md`.

## Durum

- **Aktif faz:** F3a tamamlandı, CI tamamen yeşil (PR #4, dal `tr/f3a-sayfalar`) — birleştirme onayı bekliyor. Sıradaki: F3b (Bütçe + Düzenli İşlemler + Hedefler).
- **Depo:** https://github.com/ubasturk20/UB-Finance (fork). Her faz kendi dalında (`tr/fN-…`), PR ile `main`'e.
- **Çalışma düzeni (önemli):**
  - Oturum ortamı npm'e erişemiyor → test/tsc yerelde çalışmaz; **CI tek doğrulama**. Her PR'da CI (client, server, e2e, electron, website) + `Format report` çalışır.
  - CI loglarına erişim yok; yalnızca **annotation**'lar okunur (`gh api repos/ubasturk20/UB-Finance/check-runs/<job>/annotations`). Playwright hataları ve `Format report` (Prettier'ın değiştireceği dosyalar) annotation olarak gelir.
  - Yerel Prettier 3.8 (`/opt/node-tools/node_modules/prettier/bin/prettier.cjs`), repo 3.9 kullanıyor: **mevcut dosyalara `--write` yapma** (union tiplerini farklı biçimliyor); yalnızca yeni/küçük değişiklikler, sonra `Format report`'a bak.

## F3a — Genel Bakış, Hesaplar, İşlemler, içe aktarma (2026-10-21, PR #4)

- 5 paralel alt ajan; mesaj dosyaları: `dashboard.ts` (`dash.*`, `welcome.*`), `accounts.ts` (`acc.*`, `currency.*`), `transactions.ts` (`tx.*`), `transactionDetail.ts` (`txd.*`), `importing.ts` (`import.*`). Yeni alan dosyaları önceden oluşturulup `i18n/index.ts`'e kaydedilir (ajanlar index.ts'e dokunmaz).
- Hesap türü adları Türkiye'ye uygun (`types/index.ts`: Vadesiz, KMH, BES, Konut/Taşıt/Eğitim kredisi…); type kodları değişmedi.
- Düzeltme işlemi notları artık Türkçe ("Değer güncellemesi", "Mutabakat düzeltmesi"); sunucu demo bütçesi hâlâ İngilizce (F4).
- CSV: Türk bankası başlık ipuçları (`COLUMN_HINTS`: Tarih, Açıklama, Tutar, İşlem Tutarı, Borç, Alacak; büyük İ/I yazımlarıyla).
- Genel Bakış harcama karşılaştırması etiketleri istemcide üretiliyor (sunucunun İngilizce `periodLabel`ları kullanılmıyor).
- Telefon: `NetWorthMini` başlığı `max-md:flex-wrap` (Türkçe aralık adları daha uzun). Uzun Türkçe metinler telefon taşma testini (`phone.spec.ts` "every page fits") tetikleyebilir — sonraki fazlarda dikkat.
- Kalan (F3b/F3c): `MainAmountField` İngilizce metinleri ("Value in EUR"; `txd.mainAmount.label` hazır), `RecurringFormModal` `label="Payee"`, `NotInDemo`, rapor/nakit akışı "Uncategorized".

## F2 — Çeviri altyapısı, kabuk, Ayarlar (2026-10-21, PR #3)

- `client/src/i18n/index.ts`: tipli `t(key, vars)` (`{ad}` yer tutucuları; sayılar `1.234`), `formatCount`, `formatPercent` (`%12,5`). Mesajlar alan bazlı: `messages/common.ts` (Kaydet, İptal…), `shell.ts` (`shell.*`, `ui.*`), `settings.ts` (`settings.*`). Yeni alan = yeni dosya + `index.ts`'e ekle.
- `i18n/glossary.md`: terim sözlüğü — çeviride önce buna bak, yeni terimi ekle.
- Çevrilenler: `components/layout|ui|auth|connection/*`, `pages/Settings.tsx`, `components/settings/*`. Görünen ad **UB-Finance** (`BrandName`: "UB-" + "Finance", `<title>`); cookie/env/Docker adları değişmedi.
- `RowMenu` varsayılan erişilebilir adı "Diğer işlemler".
- Yöntem: iki alt ajan paralel (dosya sahipliği ayrık, e2e yalnızca Edit ile), ortak brif `scratchpad/agent_brief.md` (oturuma özel; gerekirse yeniden yaz). F3'te aynı yöntem kullanılabilir.
- F3'e kalanlar: sayfa başlıkları (`navigation.spec.ts` içindeki `heading` adları hâlâ İngilizce), Welcome ("Welcome to UB-Finance" e2e'de), `CurrencySelect` varsayılan adı 'Currency', `NotInDemo`, `WaitingTransactions`, `DiscoverSchedulesModal` gün adları, kur gösterimi (`1 GBP = 1.25 EUR` → `1,25`), sunucu hata iletileri (F4).

## F1 — Türk biçimleri (2026-10-21, PR #2)

- `client/src/utils/locale.ts`: `APP_LOCALE='tr-TR'` (tarayıcı dili ne olursa olsun), `DEFAULT_CURRENCY`, `WEEK_STARTS_ON=1`, Türkçe kısa gün adları, `applyDateLocale()` (date-fns `tr` + Pazartesi, `main.tsx`'te çağrılır).
- `utils/currency.ts`: cihaz dili yerine `APP_LOCALE`; `FIXED_CONVENTIONS.TRY` → `1.234,56 ₺` (NBSP ile); para birimi seçilmemiş bütçede sembolün kendi para biriminin kuralı; `REGION_CURRENCIES.TR`.
- Varsayılanlar: sembol ₺, tarih `dd.MM.yyyy` (Tercihler sıfırlama da). Eski kurulum geçişi (`migratePreferences`) değişmedi.
- Takvimler Pazartesi'den başlar (`calendarLayout.ts`, `recurring/Calendar.tsx`, `TransactionCalendar.tsx`); ay seçici ay adları yerel ayardan; `shortDayPattern` gg.aa.yyyy için `5 Oca`.
- H1 düzeltildi: `$` sabit grafik etiketleri → `formatCentsAxis` (`BudgetEditPopover`, `CategoryDetail`, `SpendingComparison`).
- H5 düzeltildi: CSV `windows-1254` (seçenek + otomatik algılamada varsayılan); sunucu `importSettings.ts` izin listesine eklendi.
- H7: `<html lang="tr">`.
- Testler: birim testleri + E2E Türk biçimine güncellendi (tutar `1.234,56 ₺`, Türkçe ay adları, CSV `;` ve `12,50`). Alman cihaz testi artık "her cihazda Türk biçimi"ni doğruluyor.
- Kalan (F2/F3'e): `DiscoverSchedulesModal` İngilizce gün adları, yüzde biçimi (`0.0%` → `%0,0`), tüm arayüz metinleri.

- **Kararlar (2026-10-21):**
  1. Çeviri: tek tipli sözlük (`client/src/i18n/tr.ts` + `t()`), yeni bağımlılık yok.
  2. Banka senkronu (Plaid/SimpleFIN/Enable Banking): kod kalır, bayrakla arayüzden gizlenir.
  3. Çalışma modu: **Docker (sunucu modu)** — parola girişi, `FLYBUDGET_DATA_KEY` zorunlu; Electron'a öncelik verilmez. Güvenlik fazında HTTPS/ters vekil, `FLYBUDGET_ALLOWED_HOSTS`, `FLYBUDGET_TRUST_PROXY` ve çevrimdışı kopya (IndexedDB) ele alınır. E2E'de `server-mode` projesi de çalıştırılır.
  4. ₺ konumu: **`1.234,56 ₺`** (sonda, boşluklu; `comma` sayı biçimi).

## 2026-10-21 — Analiz oturumu

- Kaynak: `dtymoszenko/flybudget`, son commit `2fec002` (v0.2.0).
- Okunan: `CLAUDE.md` (AGENTS.md ile özdeş), `PLANNING.md`, `package.json`'lar, `db/schema.ts` (accounts), `utils/dates.ts`, `utils/csv.ts` (kodlama listesi), açık issue listesi.
- Bulgular: i18n altyapısı yok (~150 .tsx, tahminen 1.500–2.500 metin); hatalar H1–H8 planda dosya/satırlarıyla.
- Taban test sonucu alınamadı: bu ortam npm kayıt deposuna erişemedi. **F0'da yerel makinede `npm ci` + `npm test` (client, server) + e2e çalıştırılmalı.**
- Kod değişikliği yapılmadı.

## F0 — Hazırlık (2026-10-21, PR #1, birleştirildi)

- Kaynak kod/sorun bağlantıları fork'a; `docker-compose.ub.yml` (yalnızca 127.0.0.1) + `CALISTIRMA.md`.
- Test tabanı: orijinal kodda kırık test yok (CI tamamen yeşil).

## Önemli dosyalar (hızlı başvuru)

- Para biçimi: `client/src/utils/currency.ts`, `store/preferencesStore.ts` (`PREFERENCES_VERSION` + `migratePreferences`)
- Tarih: `client/src/utils/dates.ts`, `utils/calendarLayout.ts`
- Hesap türleri: `server/src/utils/accountTypes.ts` ↔ `client/src/types/index.ts` (senkron tutulmalı)
- Net değer/bakiyeler: `server/src/services/balances.ts`
- Tekrarlayanlar (taksitler için yeniden kullanılacak): `server/src/utils/recurrence.ts`, `routes/schedules.ts`
- Pano: `client/src/components/dashboard/`
- Yedek tabloları: `server/src/services/backupService.ts` (`BACKUP_TABLES`)
