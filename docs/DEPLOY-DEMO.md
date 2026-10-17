# DEPLOY-DEMO — SKAIHUB di paket gratis (Vercel + Render + Neon)

Panduan klik-demi-klik untuk pemilik project. Tujuannya **demo/mockup**, bukan produksi: cold start, upload yang bisa hilang, dan batas kuota diterima. Untuk produksi komersial, ikuti [`DEPLOY.md`](./DEPLOY.md).

Fakta layanan di bawah diverifikasi 2026-10-17 dari dokumentasi resmi (tautan di §9). Syarat paket gratis bisa berubah — cek ulang sebelum mulai.

```
Browser ──▶ Vercel (Next.js, dojang-hub-web)  ──HTTPS──▶  Render free (Docker: Nginx + PHP-FPM, dojang-hub-api)
                                                                │  TLS (sslmode=require)
                                                                ▼
                                                     Neon free PostgreSQL (Singapura, host -pooler)
                                   (opsional) Cloudflare R2 ◀── upload foto / bukti SPP
```

Yang perlu disiapkan: akun GitHub (repo SKAIHUB sudah di-push, termasuk branch yang berisi `render.yaml`), akun Neon, Render, Vercel. PHP 8.3+ lokal hanya untuk membuat `APP_KEY`.

---

## 1. Neon — database

1. Buka <https://console.neon.tech> → **New Project**.
2. Isi nama (mis. `skaihub-demo`), Postgres versi terbaru, **Region: AWS Asia Pacific (Singapore)** (`aws-ap-southeast-1`) → **Create project**.
3. Di dashboard project, klik **Connect**. Pastikan toggle **Connection pooling** **aktif** → salin connection string. Bentuknya:
   ```
   postgresql://neondb_owner:<password>@ep-xxxx-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
   Host yang berakhiran **`-pooler`** = koneksi lewat PgBouncer (dipakai aplikasi). Simpan sebagai **`DB_URL`**.
4. (Disarankan) Matikan toggle pooling, salin lagi string-nya (host **tanpa** `-pooler`) → simpan sebagai **`DB_MIGRATION_URL`**. Neon menyarankan koneksi langsung untuk migrasi skema; entrypoint Docker memakainya khusus untuk `php artisan migrate` bila diisi.

Catatan:
- `sslmode=require` menolak koneksi tanpa TLS. Config Laravel default `DB_SSLMODE=prefer` (pakai TLS bila tersedia, tetapi tidak menolak plaintext); `render.yaml` menetapkan `DB_SSLMODE=require`, dan `?sslmode=` di `DB_URL` mengalahkan nilai itu. Parameter `channel_binding` diabaikan Laravel — tidak masalah.
- Pooler Neon memakai mode transaksi: `SET` per sesi tidak bertahan. Aman untuk aplikasi ini karena `search_path` yang dipakai (`public`) sama dengan default.
- Password di URL harus di-*URL-encode* bila berisi karakter khusus (password bawaan Neon aman).

## 2. Buat `APP_KEY` (lokal, sekali)

```bash
cd dojang-hub-api
composer install          # bila vendor/ belum ada
php artisan key:generate --show
```
Salin keluaran lengkap **termasuk awalan `base64:`**. Jangan pakai fitur "Generate" Render untuk variabel ini — nilainya tidak berformat `base64:` sehingga Laravel menolaknya.

## 3. Render — API (Docker)

### Cara A — Blueprint (disarankan)

1. Buka <https://dashboard.render.com> → **New** → **Blueprint**.
2. **Connect** repo GitHub SKAIHUB; pilih **branch** yang berisi `render.yaml`. Blueprint Path biarkan `render.yaml`.
3. Render menampilkan service `skaihub-api` (Docker, Free, Singapore). Isi variabel rahasia yang diminta:

   | Variabel | Nilai |
   |---|---|
   | `APP_KEY` | dari §2 |
   | `DB_URL` | string **pooled** dari §1.3 |
   | `CORS_ALLOWED_ORIGINS` | sementara `https://contoh.vercel.app` (diganti di §5) |
   | `FRONTEND_URL` | sama |

   Render hanya menanyakan nilai `sync: false` **saat Blueprint pertama kali dibuat**; perubahan berikutnya dilakukan di tab **Environment** service.
4. Klik **Deploy Blueprint**. Build image pertama ±5–10 menit.

### Cara B — manual

**New** → **Web Service** → pilih repo → **Language: Docker**, **Root Directory** `dojang-hub-api`, Dockerfile Path `dojang-hub-api/Dockerfile`, **Region Singapore**, **Instance Type Free**, **Health Check Path** `/api/health`. Lalu salin semua variabel dari `render.yaml` ke **Environment**.

### Setelah service dibuat

Di tab **Environment** service `skaihub-api`, tambahkan:

| Variabel | Nilai | Keterangan |
|---|---|---|
| `DB_MIGRATION_URL` | string langsung (tanpa `-pooler`) dari §1.4 | opsional, disarankan |
| `SEED_ON_BOOT` | `true` | **sekali saja** untuk data demo (lihat di bawah) |
| `SUPER_ADMIN_PASSWORD` | password kuat pilihan Anda | opsional; tanpa ini super admin memakai password bawaan seeder |

Simpan → **Save, rebuild, and deploy** (atau **Manual Deploy → Deploy latest commit**).

**Apa yang terjadi saat kontainer start** (`dojang-hub-api/docker/entrypoint.sh`):
1. `APP_URL` otomatis = `RENDER_EXTERNAL_URL` (`https://skaihub-api-xxxx.onrender.com`) bila tidak di-set.
2. `php artisan migrate --force` (diulang s.d. 5x bila Neon masih bangun dari *suspend*).
3. Bila `SEED_ON_BOOT=true`: `php artisan db:seed --force` — memanggil `SuperAdminSeeder`, `RankCatalogSeeder`, `DemoAkademiSeeder`.
4. `config:cache`, `route:cache`, lalu Nginx + PHP-FPM di port `$PORT` (default Render 10000).

**Seed data demo.** Paket free Render **tidak menyediakan Shell**, dan *pre-deploy command* hanya untuk paket berbayar, sehingga seed dilakukan lewat `SEED_ON_BOOT`:
1. Set `SEED_ON_BOOT=true`, deploy, tunggu tab **Logs** menampilkan `DemoAkademiSeeder ... DONE`.
2. **Hapus** variabel `SEED_ON_BOOT` lalu simpan (redeploy). Seeder demo **tidak idempoten**: bila dibiarkan, setiap start (termasuk bangun dari *spin-down*) mencoba seed ulang, gagal pada data sesi latihan yang sudah ada (tercatat di log, aplikasi tetap jalan) dan **me-reset password super admin**.

**Cek:** buka `https://<service>.onrender.com/api/health` → `{"status":"ok","db":true,...}`. Catat URL ini.

## 4. Vercel — web

1. Buka <https://vercel.com/new> → **Import** repo SKAIHUB.
2. **Root Directory** → **Edit** → pilih `dojang-hub-web`. Framework terdeteksi **Next.js** (tidak perlu `vercel.json`).
3. **Environment Variables**:

   | Variabel | Nilai |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<service>.onrender.com/api` |
   | `NEXT_PUBLIC_BASE_DOMAIN` | domain Vercel lengkap, mis. `skaihub-demo.vercel.app` (**jangan** hanya `vercel.app` — host project akan dianggap subdomain akademi) |
   | `NEXT_PUBLIC_ASSET_HOSTS` | kosong; atau URL publik R2 bila memakai §7 |

4. **Deploy**. Catat URL produksi (mis. `https://skaihub-demo.vercel.app`). Bila domainnya berbeda dari yang diisi, perbarui `NEXT_PUBLIC_BASE_DOMAIN` lalu **Redeploy**.

Variabel `NEXT_PUBLIC_*` dibakar ke bundle saat build ("frozen with the value evaluated at build time" — `dojang-hub-web/node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`). Setiap mengubahnya → **Deployments → … → Redeploy**. Host API (`/storage/**`) dan host di `NEXT_PUBLIC_ASSET_HOSTS` otomatis diizinkan untuk `next/image`.

## 5. Sambungkan CORS

Render → `skaihub-api` → **Environment**:
- `CORS_ALLOWED_ORIGINS` = `https://skaihub-demo.vercel.app` (URL Vercel persis, tanpa `/` di akhir; pisahkan dengan koma bila lebih dari satu).
- `FRONTEND_URL` = sama.

**Save, rebuild, and deploy.** Preview deployment Vercel (`...-git-...vercel.app`) tidak termasuk; tambahkan bila perlu.

## 6. Coba demo

| Peran | Email |
|---|---|
| Super admin | `superadmin@skaihub.com` |
| Ketua akademi | `ketua@garudasakti.test` |
| Admin akademi | `admin@garudasakti.test` |
| Pelatih | `dimas@garudasakti.test` |

Login di `https://<vercel>/login`. Password: lihat `dojang-hub-api/database/seeders/` (sengaja tidak ditulis di dokumen). Karena repo dan password demo diketahui, **siapa pun yang punya URL bisa login** — jangan isi data asli; ganti password setelah seed bila demo dibagikan luas.

**Subdomain akademi tidak berfungsi di `*.vercel.app`** (tidak bisa membuat `garuda-sakti.skaihub-demo.vercel.app`). Buka landing akademi lewat path: `https://<vercel>/a/garuda-sakti`. Panel super admin juga lewat path `/internal`, bukan subdomain `admin.`.

## 7. (Opsional) Upload persisten dengan Cloudflare R2

Tanpa ini, upload (foto siswa, bukti SPP, gambar compro) disimpan di disk kontainer Render dan **hilang** saat redeploy atau *spin-down* (filesystem paket free efemeral, tanpa persistent disk).

1. Cloudflare dashboard → **R2** → **Create bucket** (mis. `skaihub-demo`).
2. Bucket → **Settings** → **Public Development URL** → **Enable** → ketik `allow`. Salin URL publik `https://pub-<hash>.r2.dev`. (Cloudflare: r2.dev dibatasi laju dan hanya untuk non-produksi; produksi pakai custom domain.)
3. R2 → **Manage API Tokens** → buat token **Object Read & Write** untuk bucket tersebut → salin Access Key ID & Secret Access Key.
4. Render → **Environment**:

   | Variabel | Nilai |
   |---|---|
   | `FILESYSTEM_UPLOAD_DISK` | `s3` |
   | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | dari token |
   | `AWS_BUCKET` | `skaihub-demo` |
   | `AWS_DEFAULT_REGION` | `auto` |
   | `AWS_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
   | `AWS_URL` | `https://pub-<hash>.r2.dev` |
   | `AWS_USE_PATH_STYLE_ENDPOINT` | `true` |

5. Vercel → `NEXT_PUBLIC_ASSET_HOSTS=https://pub-<hash>.r2.dev` → Redeploy.

Validasi `proof_url` SPP mengikuti disk aktif: disk `public` menerima `/storage/akademi/<id>/...` di host API; disk `s3` hanya menerima `<AWS_URL>/akademi/<id>/...` yang berkasnya ada di bucket. URL bukti dari disk sebelumnya ditolak setelah berpindah disk.

## 8. (Opsional) Jaga API tetap "hangat"

Render free *spin-down* setelah 15 menit tanpa trafik; request berikutnya menunggu ±1 menit. Pasang monitor HTTP ke `https://<service>.onrender.com/api/health`:
- UptimeRobot (free: 50 monitor, interval 5 menit) — **New monitor → HTTP(s)** → URL di atas → interval 5 menit.
- Atau cron-job.org setiap 10 menit.

Konsekuensi: 1 service yang menyala 24 jam ≈ 744 jam/bulan, mendekati jatah **750 jam instance gratis per workspace per bulan** — jangan jalankan service free lain di workspace yang sama. Ping juga membuat compute Neon tetap aktif dan menghabiskan jatah CU-hour (lihat §9); bila jatah menipis, matikan monitor.

## 9. Batasan yang diketahui

| Hal | Dampak |
|---|---|
| Render free spin-down 15 menit, spin-up ±1 menit | Request pertama lambat; health check bisa 503 sesaat bila Neon juga sedang *suspend*. |
| Render free: tanpa Shell, tanpa persistent disk, filesystem efemeral, 750 jam/bulan, 0,1 CPU / 512 MB | Seed via `SEED_ON_BOOT`; upload lokal hilang (pakai R2); PHP-FPM dibatasi 5 worker. |
| Neon free: 1 GB storage per project, 100 CU-hour/project/bulan, scale-to-zero 5 menit (tidak bisa dimatikan) | Cukup untuk demo; query pertama setelah idle sedikit lebih lambat. (Catatan internal sebelumnya menyebut 0,5 GB; halaman Neon per 2026-10-17 menulis 1 GB.) |
| Vercel Hobby hanya untuk penggunaan **non-komersial pribadi** | Demo boleh; begitu menjual langganan → Vercel Pro (lihat `DEPLOY.md` §1.1). |
| Subdomain akademi tidak jalan di `vercel.app` | Pakai `/a/<slug>`; subdomain butuh domain sendiri + wildcard (`DEPLOY.md` §4). |
| Cache/sesi berbasis file di kontainer | Rate limit ter-reset saat kontainer restart; tidak masalah untuk demo. |
| `QUEUE_CONNECTION=sync` | Tidak ada worker; job (bila nanti ada) dijalankan langsung dalam request. |

Sumber:
- Render free: <https://render.com/docs/free> (spin-down 15 menit, ±1 menit spin-up, tanpa Shell, tanpa persistent disk, 750 jam)
- Render Blueprint: <https://render.com/docs/blueprint-spec> (`dockerfilePath`/`dockerContext` relatif ke root repo, region `singapore`, `sync: false` hanya ditanyakan saat pembuatan, free = 0,1 CPU / 512 MB)
- Render port & env: <https://render.com/docs/web-services> (`PORT` default 10000, bind `0.0.0.0`), <https://render.com/docs/environment-variables> (`RENDER_EXTERNAL_URL`)
- Render pre-deploy hanya paket berbayar: <https://feedback.render.com/features/p/release-phase-script>
- Neon pooling: <https://neon.com/docs/connect/connection-pooling> (host `-pooler`, PgBouncer mode transaksi, migrasi pakai koneksi langsung)
- Neon free plan: <https://neon.com/docs/introduction/plans>; region: <https://neon.com/docs/introduction/regions>
- Vercel monorepo/Root Directory: <https://vercel.com/docs/monorepos>; Hobby non-komersial: <https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage>
- Cloudflare R2 + AWS SDK PHP (`region auto`, endpoint): <https://developers.cloudflare.com/r2/examples/aws/aws-sdk-php/>; r2.dev publik: <https://developers.cloudflare.com/r2/buckets/public-buckets/>
- UptimeRobot free: <https://uptimerobot.com/pricing>

## 10. Daftar variabel

**Render (`skaihub-api`)** — wajib: `APP_KEY`, `DB_URL`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`. Sudah di `render.yaml`: `APP_NAME`, `APP_ENV=production`, `APP_DEBUG=false`, `APP_LOCALE=id`, `APP_FALLBACK_LOCALE=en`, `LOG_CHANNEL=stderr`, `LOG_LEVEL=warning`, `DB_CONNECTION=pgsql`, `DB_SSLMODE=require`, `TRUSTED_PROXIES=*`, `SANCTUM_EXPIRATION=10080`, `SESSION_DRIVER=file`, `SESSION_SECURE_COOKIE=true`, `CACHE_STORE=file`, `QUEUE_CONNECTION=sync`, `MAIL_MAILER=log`, `BCRYPT_ROUNDS=12`, `FILESYSTEM_UPLOAD_DISK=public`. Opsional: `APP_URL` (default `RENDER_EXTERNAL_URL`), `DB_MIGRATION_URL`, `SEED_ON_BOOT`, `SUPER_ADMIN_PASSWORD`, `AWS_*` (R2).

**Vercel (`dojang-hub-web`)** — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BASE_DOMAIN`, opsional `NEXT_PUBLIC_ASSET_HOSTS`.

`TRUSTED_PROXIES=*` wajib di belakang load balancer Render: tanpa itu Laravel menganggap request sebagai `http` dan semua pengguna terlihat ber-IP sama (rate limit login 5/menit berlaku untuk semua orang sekaligus).
