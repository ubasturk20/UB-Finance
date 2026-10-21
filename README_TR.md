# UB-Finance

Tamamen Türkçe, yerel öncelikli (verileriniz kendi bilgisayarınızda/sunucunuzda) kişisel finans
uygulaması. Açık kaynak [FlyBudget](https://github.com/dtymoszenko/flybudget) üzerine kuruludur
ve aynı lisansla (AGPL-3.0) dağıtılır.

## Neler var

- **Türk biçimleri:** ₺ varsayılan, `1.234,56 ₺`, `gg.aa.yyyy`, Türkçe ay/gün adları, Pazartesi
  ile başlayan haftalar; Türkçe karakterli banka CSV dosyaları (Windows-1254) doğru okunur.
- **Hesaplar ve işlemler:** vadesiz, birikim, nakit, kredi kartı, KMH, yatırım, BES, kripto,
  gayrimenkul, araç ve krediler; CSV/CAMT içe aktarma, kurallarla otomatik sınıflandırma
  (Türkçe duyarlı: "migros" = "MİGROS" = "MIGROS"), bölünmüş işlemler, transferler.
- **Bütçe:** sıfır tabanlı zarf bütçesi, devreden tutarlar, birikim hedefleri, düzenli işlemler.
- **Kredi kartı:** limit, kullanılabilir limit, ekstre borcu, asgari ödeme, son ödeme tarihi,
  taksitli alışverişler.
- **Krediler:** BSMV/KKDF dahil ödeme planı, kalan anapara, sonraki taksit.
- **Varlıklar:** gram altın, döviz, fon, hisse gibi miktar bazlı varlıklar; birim fiyatı
  güncellenince değer kendiliğinden hesaplanır.
- **Net değer ve raporlar:** varlık/borç dağılımı, USD/EUR ve gram altın karşılığı, nakit akışı,
  özel raporlar, Genel Bakış'ta yaklaşan kart ve kredi ödemeleri.
- **Gizlilik ve güvenlik:** veriler yalnızca sizde; parolalı giriş (sunucu modu), parolalı
  (AES-256) yedekler, kısıtlı dosya izinleri, banka senkronu varsayılan olarak kapalı.

## Kurulum

Docker ile çalıştırma, testler, HTTPS ve güvenlik kontrol listesi: [CALISTIRMA.md](CALISTIRMA.md).

## Geliştirme

Plan: [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) · İlerleme notları: [PROGRESS.md](PROGRESS.md) ·
Terim sözlüğü: [client/src/i18n/glossary.md](client/src/i18n/glossary.md)
