# UB-Finance — Çalıştırma ve Test

## 1. Gerekenler

- Docker Desktop: https://www.docker.com/products/docker-desktop/
- Git: https://git-scm.com/downloads

## 2. Kodu indirme

```bash
git clone https://github.com/ubasturk20/UB-Finance.git
cd UB-Finance
git checkout tr/f0-hazirlik   # ya da üzerinde çalışılan dal
```

## 3. Şifreleme anahtarı (bir kez)

Sunucu modu bu anahtar olmadan açılmaz. Dosya `.gitignore`'da; **GitHub'a gönderilmez. Veritabanından ayrı bir yere yedekleyin.**

Windows (PowerShell):

```powershell
$b = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
[Convert]::ToBase64String($b) | Out-File -NoNewline -Encoding ascii flybudget_data_key.txt
```

macOS / Linux:

```bash
openssl rand -base64 32 > flybudget_data_key.txt
sudo chown 1000:1000 flybudget_data_key.txt && sudo chmod 400 flybudget_data_key.txt
```

## 4. Uygulamayı başlatma

```bash
docker compose -f docker-compose.ub.yml up -d --build
docker logs ub-finance          # ilk açılışta "setup code" burada yazar
```

Tarayıcıda http://localhost:3001 → parola belirleyin → günlükteki kurulum kodunu girin.

Durdurma: `docker compose -f docker-compose.ub.yml down` (veriler `ub-finance-data` biriminde kalır).

### Banka senkronu (varsayılan: kapalı)

Plaid, SimpleFIN ve Enable Banking Türk bankalarını kapsamadığı için kapalıdır: menülerde
görünmez, sunucu bu API'leri hiç açmaz ve açılışta senkron yapmaz. CSV/CAMT içe aktarma ve elle
ekleme her zaman çalışır. Yine de açmak isterseniz **ikisi birden** gerekir:

- istemci derlemesi: `VITE_BANK_SYNC=true` (Docker'da build argümanı:
  `docker-compose.ub.yml` içindeki `args: VITE_BANK_SYNC: 'true'` satırlarını açın),
- sunucu: `FLYBUDGET_BANK_SYNC=true` ortam değişkeni (aynı dosyadaki `environment` satırı).

Ardından `docker compose -f docker-compose.ub.yml up -d --build`.

## 5. Testler (Node kurmadan, Docker ile)

```bash
docker run --rm -v "${PWD}:/app" -w /app/server node:22 sh -c "npm ci && npm test"
docker run --rm -v "${PWD}:/app" -w /app/client node:22 sh -c "npm ci && npm test && npx tsc --noEmit"
```

Sonuçları (son satırlardaki geçti/kaldı sayıları) PROGRESS.md'ye ya da sohbete yazın.

## 6. Telefondan / ağdan erişim (isteğe bağlı)

`docker-compose.ub.yml` içinde portu `'3001:3001'` yapın ve şunu ekleyin:
`- FLYBUDGET_ALLOWED_HOSTS=192.168.1.20:3001` (bilgisayarınızın yerel IP'si).
Düz HTTP ile parola ağda şifresiz gider; ev dışı erişim için HTTPS'li ters vekil gerekir (bkz. 7).

## 7. HTTPS ve ev dışından erişim

> **Uyarı:** Düz `http://` üzerinden bağlanırken parolanız ve tüm bütçe verileriniz ağda
> **şifresiz** gider. Aynı Wi-Fi'daki herkes (ya da aradaki herhangi bir ağ) bunları okuyabilir.
> Ev dışından erişim için yalnızca HTTPS kullanın; UB-Finance'i asla düz HTTP ile internete açmayın.

En kolay yol, otomatik Let's Encrypt sertifikası alan [Caddy](https://caddyserver.com) ters
vekilidir. Gerekenler: bir alan adı (ör. `ub-finance.example.com`) bilgisayarınızın genel IP'sine
yönlendirilmiş olmalı ve modeminizde 80 ile 443 portları bu bilgisayara açılmalı.

1. Proje klasörüne `Caddyfile` adında bir dosya oluşturun:

   ```caddyfile
   ub-finance.example.com {
       reverse_proxy ub-finance:3001
   }
   ```

2. `docker-compose.ub.yml` içindeki yorum satırı hâlindeki `caddy` servisini ve `caddy-data` /
   `caddy-config` birimlerini açın.
3. `ub-finance` servisinin `environment` bölümüne ekleyin:

   ```yaml
   # Önünde tek bir vekil var (Caddy): HTTPS ve istemci IP'si doğru görülür
   - FLYBUDGET_TRUST_PROXY=1
   # Yalnızca bu adla gelen isteklere yanıt ver
   - FLYBUDGET_ALLOWED_HOSTS=ub-finance.example.com
   ```

4. `ub-finance` servisinin portu **`'127.0.0.1:3001:3001'` olarak kalsın**: dışarıya yalnızca
   Caddy (80/443) açılır; Caddy, UB-Finance'e Docker'ın iç ağı üzerinden (`ub-finance:3001`) ulaşır.
   Portu `'3001:3001'` yaparsanız uygulama vekili atlayarak düz HTTP ile de erişilebilir olur.
5. `docker compose -f docker-compose.ub.yml up -d --build` ve ardından
   `https://ub-finance.example.com` adresini açın.

`FLYBUDGET_TRUST_PROXY` ayarlanmazsa UB-Finance HTTPS'i fark etmez (oturum çerezi `Secure`
olmaz) ve bütün istemciler tek IP'den geliyor görünür (giriş deneme sınırı herkese birlikte
uygulanır); vekil olmadan doğrudan bağlanırken ayarlanırsa istemciler IP adreslerini taklit
edebilir. Ayarlar → Sunucu'daki güvenlik denetimi ikisini de kontrol eder.

Alan adınız ya da açık portunuz yoksa alternatifler: Tailscale gibi bir VPN ile yalnızca kendi
cihazlarınızdan erişmek (portu `127.0.0.1`'de tutup `tailscale serve` ile HTTPS vermek) ya da
Cloudflare Tunnel. Hangisini seçerseniz seçin, vekil sayısına göre `FLYBUDGET_TRUST_PROXY` ve
kullandığınız adla `FLYBUDGET_ALLOWED_HOSTS` ayarlayın.

## 8. Güvenlik kontrol listesi

- **Şifreleme anahtarını ayrı yedekleyin.** `flybudget_data_key.txt` olmadan sunucu açılmaz ve
  şifrelenmiş kimlik bilgileri okunamaz. Veritabanı yedeğiyle aynı yerde değil, ayrı (ör. parola
  yöneticinizde) saklayın.
- **Parolalı yedek kullanın.** Ayarlar → Veriler → "Parolalı yedek indir…" yedeği tarayıcıda,
  sunucuya göndermeden parolanızla şifreler (PBKDF2-SHA256 + AES-256-GCM, `.ubfbackup`). Buluta,
  USB belleğe ya da e-postaya koyacağınız yedekler için bunu seçin. Parolayı unutursanız yedek
  açılamaz. Şifreleme araçları tarayıcıda yalnızca HTTPS ya da `localhost` üzerinde çalışır.
- **Ayarlar → Sunucu'daki güvenlik denetimine bakın.** HTTPS, vekil ayarı, izinli sunucu adları,
  şifreleme anahtarı ve parola için yeşil olmayan her madde neyi ayarlamanız gerektiğini söyler.
- **Giriş yapılmış cihazları gözden geçirin.** Aynı sayfadan tanımadığınız oturumları kapatın
  ya da "Diğer tüm cihazlardan çıkış yap"ı kullanın. Parolayı değiştirmek diğer bütün
  oturumları kapatır.
- **İmajı güncel tutun.** Güvenlik düzeltmeleri için düzenli olarak `git pull` ve
  `docker compose -f docker-compose.ub.yml up -d --build` çalıştırın (taban imaj da yenilenir).
- **Dosya izinleri.** Sunucu, veritabanı dosyasını ve geri yüklemeden önce aldığı
  `budget-before-restore-*.db` kopyalarını yalnızca kendi kullanıcısının okuyabileceği şekilde
  (`0600`), veri klasörünü `0700` yapar. Docker birimi dışında bir klasör bağlarsanız bu klasörün
  sahibi `1000:1000` (imajdaki `node` kullanıcısı) olmalı.
- **Portu gereğinden fazla açmayın.** Yalnızca bu bilgisayardan kullanıyorsanız port
  `127.0.0.1:3001:3001` kalsın.
