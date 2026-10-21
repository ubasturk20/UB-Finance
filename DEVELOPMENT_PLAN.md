# FlyBudget TR — Geliştirme Planı

Amaç: FlyBudget'ı (v0.2.0, AGPL-3.0) baştan yazmadan, tamamen Türkçe, ₺ varsayılanlı, yalnızca kişisel finansa odaklı ve yerel öncelikli (local-first) bir uygulamaya dönüştürmek.

## 1. Mevcut durum (özet)

- **Yapı:** `client/` React 19 + Vite + Tailwind 4 + TanStack Query + Zustand + Recharts · `server/` Express 5 + SQLite (better-sqlite3) + Drizzle + Zod · `electron/` masaüstü · Docker ile kendi sunucunda çalışma · tarayıcı içi demo (sql.js).
- **Kılavuz:** `CLAUDE.md` ve `AGENTS.md` neredeyse aynı (yalnızca ilk satırlar farklı) → yalnızca `CLAUDE.md` okunur; değişiklikler ikisine birden yazılır.
- **Para:** tamsayı alt birim (kuruş), BigInt kurlar; çoklu para birimi, `TRY` listede var. Sayı biçimi tercihi (`comma` = 1.234,56) ve tarih biçimi tercihi zaten mevcut.
- **Hesaplar:** 17 tür / 6 grup (nakit, kredi, yatırım, mülk, kredi borcu, diğer); yükümlülükler negatif bakiye; net değer raporu var.
- **Eksikler:** kredi kartı (limit, kesim/son ödeme günü, asgari ödeme, taksit) ve kredi (faiz, vade, ödeme planı) için hiçbir alan yok — `accounts` tablosu yalnızca bakiye tutuyor.
- **Testler:** 56 Vitest (fast-check, özellik tabanlı) + Playwright e2e (masaüstü, telefon 390×844, demo, sunucu modu). E2E seçicileri İngilizce rol/etiket adlarına bağlı → çeviri her fazda e2e güncellemesi gerektirir.
- **Açık issue'lar:** 8 adet; yalnızca #118 (SimpleFIN) hata, o da bizi ilgilendirmiyor.

## 2. Tespit edilen hatalar / sınırlamalar

| #   | Sorun                                                                                           | Yer                                                                                     |
| --- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| H1  | Grafik eksenlerinde `$` sabit yazılmış; ₺ bütçede yanlış sembol                                 | `BudgetEditPopover.tsx`, `pages/CategoryDetail.tsx`, `dashboard/SpendingComparison.tsx` |
| H2  | Varsayılan sembol `$`                                                                           | `preferencesStore.ts:87`, `PreferencesPanel.tsx:90`, `utils/currency.ts:224`            |
| H3  | Tarihler `date-fns` yerel ayarı olmadan biçimleniyor → ay/gün adları İngilizce                  | `utils/dates.ts` ve doğrudan `format(…)` kullanan yerler                                |
| H4  | Takvimlerde hafta başı Pazartesi değil (`weekStartsOn` hiç yok)                                 | `utils/calendarLayout.ts`, takvim bileşenleri                                           |
| H5  | CSV içe aktarmada Windows-1254 (Türkçe) kodlaması yok → banka dökümlerinde ı/ş/ğ bozulur        | `utils/csv.ts:135`                                                                      |
| H6  | İngilizce çoğul ekleri koda gömülü (`transaction${n===1?'':'s'}`)                               | birçok bileşen                                                                          |
| H7  | `index.html` `lang="en"`; sayı `toLocaleString()` tarayıcı diline bağlı                         | `client/index.html`, birkaç bileşen                                                     |
| H8  | Varsayılan kategoriler (86) ve ~94 sunucu hata mesajı İngilizce                                 | `server/src/db/defaultCategories.ts`, `server/src/routes/*`                             |
| H9  | Bilinen eski yük: `recurring_transactions` tablosu kaldırılmamış (dokunulmayacak, yalnızca not) | migration `0011`                                                                        |

## 3. Temel kararlar (onaylandı)

1. **Çeviri:** tipli tek sözlük (`client/src/i18n/tr.ts` + `t()`), bağımlılık yok, sayfa sayfa taşınır.
2. **Banka senkronu:** kod silinmez, bayrakla arayüzden gizlenir.
3. **Çalışma modu:** Docker (sunucu modu, parolalı). Electron ikincil; F10'da HTTPS/ters vekil ve host ayarları ele alınır.
4. **₺ konumu:** `1.234,56 ₺`.

## 4. Fazlar

**Durum (2026-10-21): F0–F11 tamamlandı.** Ayrıntılar ve isteğe bağlı sonraki adımlar: `PROGRESS.md`.

Her faz bağımsız, küçük ve kendi testleriyle kapanır. Bir faz onaylanmadan başlanmaz.

| Faz                                        | Kapsam                                                                                                                                                                                                                                                | Çıktı / kabul ölçütü                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **F0 Hazırlık**                            | Kendi fork'unuz, dal stratejisi; yerelde `npm ci`, birim + e2e testlerinin taban sonucu; `SOURCE_CODE_URL` fork'a (AGPL §13)                                                                                                                          | Testler yeşil taban; PROGRESS.md'ye not                                       |
| **F1 Türk biçimleri + hata düzeltmeleri**  | Varsayılan TRY ve ₺; `comma` sayı biçimi, `dd.MM.yyyy`; date-fns `tr` yerel ayarı; hafta başı Pazartesi; H1–H5, H7                                                                                                                                    | Yeni kurulum ₺ ve Türkçe tarihle açılır; ilgili birim testleri                |
| **F2 Çeviri altyapısı + kabuk**            | `t()` + sözlük, Türkçe çoğul kuralı yardımcısı (H6); kenar çubuğu, menüler, ortak UI (`Modal`, `ConfirmModal`, `EmptyState`), Ayarlar                                                                                                                 | Gezinme ve Ayarlar tamamen Türkçe; e2e seçicileri güncel                      |
| **F3 Sayfa çevirileri** (3 alt parça)      | 3a Pano + Hesaplar + İşlemler · 3b Bütçe + Tekrarlayanlar + Hedefler · 3c Raporlar + Nakit akışı + Kurallar + Alıcılar + İçe aktarma                                                                                                                  | Her alt parça ayrı oturum; ekranda İngilizce kalmaz                           |
| **F4 Sunucu tarafı Türkçe**                | Kişisel finansa uygun Türkçe varsayılan kategoriler (Market, Kira, Aidat, Faturalar, Ulaşım, Eğitim…); hata mesajları; CSV dışa aktarma başlıkları; demo bütçe TRY                                                                                    | Yeni bütçe Türkçe kategorilerle başlar                                        |
| **F5 Kişisel odak + sadeleştirme**         | Banka senkronu gizleme (karar 2); iş/ileri düzey öğelerin gözden geçirilmesi; kur kaynağı: isteğe bağlı TCMB kurları (`safeFetch` ile, varsayılan kapalı)                                                                                             | Gereksiz dış bağlantı yok                                                     |
| **F6 Kredi kartı takibi**                  | Yeni ek tablo (`account_details`, ilave/nullable): limit, hesap kesim günü, son ödeme günü, asgari ödeme oranı (ayarlanabilir); dönem borcu, kullanılabilir limit; taksitli alışverişler mevcut `schedules` altyapısıyla gelecekteki taksitler olarak | Kart özeti kartı + yaklaşan son ödemeler; saf hesap modülü + özellik testleri |
| **F7 Kredi takibi**                        | İhtiyaç/konut/taşıt kredisi: anapara, aylık faiz, vade, BSMV/KKDF oranları (ayarlanabilir, sabit yazılmaz); ödeme planı (saf amortisman modülü); kalan anapara, erken kapama tahmini; taksitler `schedules` ile                                       | Ödeme planı tablosu; testler                                                  |
| **F8 Varlıklar, yükümlülükler, net değer** | Miktar bazlı varlıklar (gram/çeyrek altın, döviz, fon, hisse: adet × elle girilen birim fiyat); vadeli mevduat; net değer raporunda varlık/yükümlülük kırılımı ve isteğe bağlı USD/altın cinsinden görünüm (enflasyon etkisini görmek için)           | Net değer grup kırılımlı                                                      |
| **F9 Pano yenileme**                       | Net değer, toplam kart borcu, yaklaşan son ödeme/taksit takvimi, bu ayki nakit akışı; mevcut pano bileşenleri yeniden kullanılır                                                                                                                      | Masaüstü + telefon ekran görüntüsü kontrolü                                   |
| **F10 Güvenlik ve gizlilik**               | Parolalı (AES-256-GCM) yedek dışa aktarma; masaüstü için isteğe bağlı uygulama kilidi; DB dosya izinleri; tam veritabanı şifreleme (SQLCipher) için değerlendirme notu; CSP ve dış istek denetimi                                                     | Güvenlik kontrol listesi PROGRESS.md'de                                       |
| **F11 Son kontrol**                        | Telefon e2e projesi, erişilebilirlik, kullanıcı kılavuzunun (isteğe bağlı) Türkçe özeti                                                                                                                                                               | Tüm testler yeşil                                                             |

Önerilen sıra: F0 → F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 → F9 → F10 → F11. F6–F8 çeviriden bağımsız olduğu için istenirse öne alınabilir.

## 5. Güvenlik ilkeleri (her fazda)

- Mevcut korumalar korunur: `hostGuard`, `originGuard`, `apiTokenGuard`, sıkı CSP, Zod doğrulama, `safeFetch`, CSV formül enjeksiyonu kaçışı.
- Yeni dış kaynak yok; varsa CSP güncellenir ve isteğe bağlı/kapalı başlar.
- Şema değişiklikleri yalnızca ekleme (nullable sütun / yeni tablo); yeni tablolar `BACKUP_TABLES`'a eklenir.
- Para hesapları kuruş tamsayısıyla; faiz/amortisman saf modüllerde, `parseFloat` yok, özellik tabanlı testlerle.
- Telemetri/analitik eklenmez. Lisans AGPL-3.0 olarak kalır.

## 6. Kapsam dışı

İşletme muhasebesi, fatura/KDV, çok kullanıcılı yapı, cihazlar arası senkron, Türk bankalarıyla otomatik bağlantı (resmî açık bankacılık erişimi gerektirir).
