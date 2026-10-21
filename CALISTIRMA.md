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
Düz HTTP ile parola ağda şifresiz gider; ev dışı erişim için HTTPS'li ters vekil gerekir (F10 güvenlik fazında ele alınacak).
