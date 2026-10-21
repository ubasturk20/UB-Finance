# İlerleme Notları

Gelecek oturumlar buradan devam eder; analiz tekrar yapılmaz. Plan: `DEVELOPMENT_PLAN.md`.

## Durum

- **Aktif faz:** F1 tamamlandı, CI tamamen yeşil (PR #2, dal `tr/f1-turk-bicimleri`) — birleştirme onayı bekliyor. Sıradaki: F2 çeviri altyapısı + kabuk.
- **Depo:** https://github.com/ubasturk20/UB-Finance (fork). Her faz kendi dalında (`tr/fN-…`), PR ile `main`'e.
- **Çalışma düzeni (önemli):**
  - Oturum ortamı npm'e erişemiyor → test/tsc yerelde çalışmaz; **CI tek doğrulama**. Her PR'da CI (client, server, e2e, electron, website) + `Format report` çalışır.
  - CI loglarına erişim yok; yalnızca **annotation**'lar okunur (`gh api repos/ubasturk20/UB-Finance/check-runs/<job>/annotations`). Playwright hataları ve `Format report` (Prettier'ın değiştireceği dosyalar) annotation olarak gelir.
  - Yerel Prettier 3.8 (`/opt/node-tools/node_modules/prettier/bin/prettier.cjs`), repo 3.9 kullanıyor: **mevcut dosyalara `--write` yapma** (union tiplerini farklı biçimliyor); yalnızca yeni/küçük değişiklikler, sonra `Format report`'a bak.

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
