# İlerleme Notları

Gelecek oturumlar buradan devam eder; analiz tekrar yapılmaz. Plan: `DEVELOPMENT_PLAN.md`.

## Durum

- **Aktif faz:** F0 Hazırlık (devam ediyor).
- **Depo:** https://github.com/ubasturk20/UB-Finance (fork). Çalışma dalı: `tr/f0-hazirlik`.
- **F0 yapılanlar:** `SOURCE_CODE_URL` ve `ISSUES_URL` fork'a çevrildi (`client/src/utils/project.ts`). Kalan: push, yerel/Docker test tabanı.
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

## Önemli dosyalar (hızlı başvuru)

- Para biçimi: `client/src/utils/currency.ts`, `store/preferencesStore.ts` (`PREFERENCES_VERSION` + `migratePreferences`)
- Tarih: `client/src/utils/dates.ts`, `utils/calendarLayout.ts`
- Hesap türleri: `server/src/utils/accountTypes.ts` ↔ `client/src/types/index.ts` (senkron tutulmalı)
- Net değer/bakiyeler: `server/src/services/balances.ts`
- Tekrarlayanlar (taksitler için yeniden kullanılacak): `server/src/utils/recurrence.ts`, `routes/schedules.ts`
- Pano: `client/src/components/dashboard/`
- Yedek tabloları: `server/src/services/backupService.ts` (`BACKUP_TABLES`)
