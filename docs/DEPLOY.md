# DEPLOY — Panduan Rilis Produksi SKAIHUB

Untuk tim kecil (1–3 orang) yang menjalankan SKAIHUB sebagai SaaS komersial di Indonesia. Menutup keputusan audit **D16** (checklist deploy untuk F11/F12). Diverifikasi terhadap kode per 2026-10-17 (branch `fase-5-ops`). Bila kode berubah, perbarui dokumen ini.

Contoh domain di bawah: `skaihub.com`. Ganti dengan domain asli.

---

## 1. Arsitektur yang direkomendasikan

```
                 ┌──────────────── Vercel (Pro) ────────────────┐
 Pengunjung ───▶ │ skaihub.com          → compro + /academy      │
                 │ admin.skaihub.com    → panel super admin      │
                 │ *.skaihub.com        → landing akademi (/a/…) │
                 └──────────────┬────────────────────────────────┘
                                │ HTTPS (fetch dari browser & server)
                                ▼
                 ┌──── VPS (Nginx + PHP-FPM 8.3) ───┐      ┌── PostgreSQL terkelola ──┐
                 │ api.skaihub.com  → Laravel API    │ ───▶ │ backup harian + PITR     │
                 │ /storage → disk lokal (persisten) │      └──────────────────────────┘
                 └───────────────────────────────────┘
```

| Komponen | Rekomendasi | Alasan |
|---|---|---|
| Web (Next.js 16) | **Vercel Pro** | Paket Hobby hanya untuk penggunaan **non-komersial pribadi**. SKAIHUB menjual langganan → wajib Pro/Enterprise (lihat §1.1). |
| API (Laravel 13) | **VPS** (mis. region Jakarta/Singapura, 2 vCPU / 2–4 GB RAM) dengan Nginx + PHP-FPM 8.3; alternatif: Laravel Cloud atau Railway | Upload default **ditulis ke disk `public` lokal** (`FILESYSTEM_UPLOAD_DISK=public`; bisa diganti `s3`/R2 lewat variabel `AWS_*` di `dojang-hub-api/.env.example`). Platform dengan filesystem efemeral (Railway tanpa volume, kontainer tanpa disk) akan **menghapus foto siswa & bukti SPP** saat redeploy. VPS dengan disk persisten adalah pilihan paling sederhana. Di Railway/Laravel Cloud wajib pasang volume persisten di `storage/app/public`. |
| Database | **PostgreSQL terkelola** (versi ≥ 15) dengan backup harian otomatis + point-in-time recovery | Data anak & keuangan; jangan self-host DB di VPS yang sama tanpa backup terotomasi. |
| File upload | Disk lokal VPS `storage/app/public`, di-backup harian ke object storage (S3-kompatibel) | Lihat catatan di baris API. Alternatif: `FILESYSTEM_UPLOAD_DISK=s3` + `AWS_*` (S3/R2) tanpa ubah kode. |
| DNS | Nameserver di Vercel **atau** delegasi `_acme-challenge` (lihat §4) | Wildcard SSL `*.skaihub.com` butuh DNS challenge. |

### 1.1 Catatan paket Vercel (diverifikasi 2026-10-17)

- "**Hobby teams** are restricted to non-commercial personal use only. All commercial usage of the platform requires either a Pro or Enterprise plan." Termasuk: memproses pembayaran, mengiklankan penjualan produk/jasa, atau dibayar untuk membuat/menghosting situs. — <https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage> (last_updated 2026-09-14)
- Hobby plan: "the Hobby plan restricts users to non-commercial, personal use only." Pro: kursi developer **$20/user/bulan** (belum termasuk pajak), kursi Viewer gratis. — <https://vercel.com/docs/plans/hobby> (last_updated 2026-09-14)
- Wildcard domain: "Vercel needs access to DNS challenges to issue and renew wildcard certificates. Use the nameservers method, or delegate certificate validation." — <https://vercel.com/docs/domains/working-with-domains/add-a-domain>

Cek ulang halaman di atas sebelum berlangganan; syarat & harga bisa berubah.

---

## 2. Variabel lingkungan produksi

Jangan pernah commit nilai asli. Simpan di panel hosting / secret manager. Referensi lengkap: `dojang-hub-api/.env.example` dan `dojang-hub-web/.env.example`.

### 2.1 API (`dojang-hub-api/.env`)

| Variabel | Nilai produksi | Catatan |
|---|---|---|
| `APP_ENV` | `production` | |
| `APP_DEBUG` | `false` | **Wajib.** `true` membocorkan stack trace/SQL (audit F11). |
| `APP_KEY` | hasil `php artisan key:generate --show` | Sekali saja; simpan di secret manager. Mengganti key = token/enkripsi lama tidak valid. |
| `APP_URL` | `https://api.skaihub.com` | Dipakai untuk URL file `/storage/...`. |
| `LOG_CHANNEL` / `LOG_STACK` | `stack` / `daily` | Rotasi log harian (`LOG_DAILY_DAYS=14`). |
| `LOG_LEVEL` | `warning` | |
| `DB_CONNECTION` | `pgsql` | |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | dari penyedia DB | Atau satu `DB_URL`. |
| `DB_SSLMODE` | `require` | Koneksi ke DB terkelola lewat internet wajib TLS. |
| `SANCTUM_EXPIRATION` | `10080` (menit = 7 hari) | Token kedaluwarsa (audit F3). Default kode juga 10080 bila kosong. |
| `CORS_ALLOWED_ORIGINS` | `https://skaihub.com,https://admin.skaihub.com` | **Wajib diisi** (audit F12). Daftar dipisah koma, tanpa spasi/garis miring akhir. Wildcard `https://*.skaihub.com` didukung (`fruitcake/php-cors`), tetapi hanya tambahkan bila halaman subdomain akademi benar-benar memanggil API dari browser. Saat ini landing akademi mengambil data **di server** (`tenant-data.ts`, `cache: "no-store"`) sehingga tidak butuh CORS. |
| `FRONTEND_URL` | `https://skaihub.com` | Cadangan CORS bila `CORS_ALLOWED_ORIGINS` kosong — jangan diandalkan. |
| `SANCTUM_STATEFUL_DOMAINS` | kosongkan atau `skaihub.com,admin.skaihub.com` | API memakai token Bearer, bukan cookie. |
| `SESSION_DRIVER` | `database` | |
| `SESSION_SECURE_COOKIE` | `true` | |
| `CACHE_STORE` | `database` (atau `redis` bila tersedia) | Rate limiter memakai cache. |
| `QUEUE_CONNECTION` | `database` | Saat ini tidak ada job antrean; worker belum diperlukan. |
| `FILESYSTEM_DISK` | `local` | Disk default framework (bukan upload). |
| `FILESYSTEM_UPLOAD_DISK` | `public` (atau `s3`) | Disk upload; `s3` butuh `AWS_*` + `AWS_URL` publik. |
| `TRUSTED_PROXIES` | `*` bila di belakang load balancer/proxy TLS | Agar skema https & IP klien (rate limit) benar. Kosongkan bila Nginx langsung menerima trafik. |
| `MAIL_*` | kredensial SMTP/penyedia email | Belum ada fitur email wajib (notifikasi ditunda); boleh `log` sementara. |
| `ADMIN_API_TOKEN` | string acak ≥ 40 karakter **atau** kosong | Nilai contoh `change-me-local-admin-token` **dilarang** di produksi (audit F11). |
| `BCRYPT_ROUNDS` | `12` | |
| `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_NAME`, `SUPER_ADMIN_PASSWORD` | hanya saat membuat super admin pertama (§3) | Dibaca `SuperAdminSeeder`; jangan disimpan permanen di `.env` produksi. |

Variabel konfigurasi Fase 4 (paket/kuota/langganan) disimpan di `config/skaihub.php` (bukan `.env`) sesuai keputusan pemilik — setelah Fase 4 di-merge, periksa ulang file itu dan tambahkan ke `.env.example` bila ternyata membaca `env()`.

### 2.2 Web (Vercel → Project Settings → Environment Variables)

| Variabel | Nilai produksi | Catatan |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.skaihub.com/api` | Dibakar ke bundle saat build → **redeploy** setelah mengubah. |
| `NEXT_PUBLIC_BASE_DOMAIN` | `skaihub.com` | Dipakai `src/proxy.ts` untuk memetakan `admin.` dan `<slug>.` (tanpa port di produksi). |

---

## 3. Server API (VPS)

Satu kali saat menyiapkan server:

```bash
# PHP 8.3 + ekstensi: pdo_pgsql, mbstring, xml, curl, zip, bcmath, intl, gd/imagick
git clone <repo> /var/www/skaihub && cd /var/www/skaihub/dojang-hub-api
composer install --no-dev --optimize-autoloader --no-interaction
cp .env.example .env            # lalu isi sesuai §2.1
php artisan key:generate
php artisan storage:link        # /public/storage → storage/app/public
chown -R www-data:www-data storage bootstrap/cache
php artisan migrate --force

# Akun super admin pertama — JANGAN jalankan `db:seed` penuh (DatabaseSeeder ikut membuat akademi demo berpassword "password")
SUPER_ADMIN_EMAIL=owner@skaihub.com SUPER_ADMIN_NAME="Pemilik" SUPER_ADMIN_PASSWORD='<password-kuat>' \
  php artisan db:seed --class=SuperAdminSeeder --force
```

- `SuperAdminSeeder` memakai `updateOrCreate` → menjalankannya lagi **me-reset password** super admin. Jalankan sekali saja; tanpa `SUPER_ADMIN_PASSWORD` password-nya menjadi `password`.
- Setelah Fase 4 (L4-C) di-merge: katalog sabuk global dari `RankCatalogSeeder` (idempoten) juga wajib ada di produksi → `php artisan db:seed --class=RankCatalogSeeder --force` pada rilis tersebut.

- Nginx: `root /var/www/skaihub/dojang-hub-api/public;`, `client_max_body_size 10M;`, HTTPS via Let's Encrypt (certbot) untuk `api.skaihub.com`.
- Firewall: buka 80/443 (dan SSH hanya dari IP tim/kunci SSH). DB terkelola: izinkan hanya IP VPS.
- `php artisan schedule:run` tidak dibutuhkan saat ini (belum ada jadwal terdaftar). Bila nanti ditambahkan, pasang cron `* * * * * php artisan schedule:run`.

---

## 4. DNS & SSL

| Record | Tujuan |
|---|---|
| `skaihub.com` (A) | Vercel — nilai dari dashboard |
| `www.skaihub.com` (CNAME) | Vercel; set **redirect ke apex** di Vercel → Domains |
| `admin.skaihub.com` (CNAME) | Vercel |
| `*.skaihub.com` (wildcard) | Vercel; butuh nameserver Vercel atau delegasi `NS _acme-challenge → ns1/ns2.vercel-dns.com` (lihat §1.1) |
| `api.skaihub.com` (A) | IP VPS — record eksplisit menang atas wildcard |

**Penting — subdomain yang bukan akademi.** `src/lib/routing/resolve-rewrite.ts` saat ini memperlakukan **semua** subdomain selain `admin` sebagai slug akademi. Akibatnya:
- `www.skaihub.com/...` akan di-rewrite ke `/a/www/...` bila redirect `www → apex` tidak dipasang di Vercel. Pasang redirect itu.
- UI super admin menyebut akademi login lewat `app.skaihub.com`, tetapi host itu akan di-rewrite ke `/a/app/...`. Sampai routing diperbaiki, dashboard akademi diakses di `https://skaihub.com/login` → `/academy`. **Blokir rilis**: perbaiki `resolve-rewrite.ts` (daftar subdomain cadangan `www`, `app`, `api`) atau ubah teks UI — dan cegah slug akademi `admin`/`www`/`app`/`api` di API.

---

## 5. Urutan rilis

Rilis **API dulu, lalu web** (migrasi bersifat aditif, sehingga web lama tetap jalan dengan skema baru).

1. Pastikan CI hijau: `php artisan test`, `vendor/bin/pint --test`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
2. Buat backup manual DB (snapshot penyedia) sebelum migrasi; catat ID snapshot.
3. Di VPS:
   ```bash
   cd /var/www/skaihub && git fetch --tags && git checkout <tag-rilis>
   cd dojang-hub-api
   php artisan down --retry=30          # opsional untuk migrasi berat
   composer install --no-dev --optimize-autoloader --no-interaction
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   php artisan up
   sudo systemctl reload php8.3-fpm
   ```
   `config:cache` membuat `env()` di luar `config/` mengembalikan `null` — semua nilai harus dibaca lewat `config()`.
4. Cek `curl -fsS https://api.skaihub.com/api/health` → `{"status":"ok","db":true,...}`.
5. Deploy web: promosikan deployment Vercel dari tag/commit yang sama (atau merge ke branch produksi).
6. Smoke test manual (5 menit): login Ketua di HP, buka Siswa, Kelas Hari Ini, SPP; login super admin di `admin.`; buka satu landing akademi Pro.

## 6. Rollback

- **Web**: Vercel → Deployments → pilih deployment sebelumnya → *Promote to Production* (instan).
- **API (kode)**: `git checkout <tag-sebelumnya>`, ulangi langkah 3 tanpa `migrate`. Karena migrasi aditif, kode lama tetap kompatibel dengan skema baru.
- **Migrasi**: hindari `migrate:rollback` di produksi bila tabel baru sudah berisi data. Bila migrasi merusak data → restore snapshot dari langkah 2 (terima kehilangan data sejak snapshot; umumkan ke pelanggan).
- Simpan minimal 3 tag rilis terakhir agar rollback cepat.

## 7. Backup & uji restore

- DB: backup harian otomatis penyedia, retensi ≥ 14 hari, + PITR bila tersedia.
- File: `rsync`/`rclone` harian `storage/app/public` ke object storage di region berbeda.
- **Uji restore tiap bulan**: pulihkan snapshot ke DB sementara, jalankan `php artisan migrate:status` dan cek jumlah baris tabel inti (`akademi`, `students`, `spp_bills`). Catat tanggal & hasilnya. Backup yang belum pernah diuji dianggap tidak ada.

## 8. Monitoring

- **Uptime**: monitor HTTP (mis. UptimeRobot/Better Stack) ke `GET https://api.skaihub.com/api/health` tiap 1–5 menit. Endpoint tanpa auth, tanpa rate limit ketat, `Cache-Control: no-store`, menjalankan `select 1`:
  - `200 {"status":"ok","db":true,"time":"…"}` — sehat.
  - `503 {"status":"error","db":false,"time":"…"}` — API hidup tetapi DB tidak terjangkau; detail error hanya di log server.
  - Alarm juga untuk `https://skaihub.com` (web) dan masa berlaku SSL.
- **Log**: `storage/logs/laravel-*.log` (level `warning`). Periksa harian, atau kirim ke layanan log.
- **Vercel**: aktifkan notifikasi deployment gagal.

## 9. Checklist keamanan pra-rilis

- [ ] `APP_ENV=production`, `APP_DEBUG=false`, `LOG_LEVEL=warning` (F11).
- [ ] `APP_KEY` unik produksi, tidak sama dengan lokal/staging.
- [ ] `ADMIN_API_TOKEN` bukan nilai contoh (F11).
- [ ] `CORS_ALLOWED_ORIGINS` berisi hanya origin produksi HTTPS (F12).
- [ ] `SANCTUM_EXPIRATION` terisi (F3).
- [ ] `DB_SSLMODE=require`; DB hanya bisa diakses dari IP VPS.
- [ ] Password akun seed/demo diganti atau akun demo dihapus; jangan jalankan `db:seed` demo di produksi.
- [ ] HTTPS untuk semua host (apex, `www`, `admin`, wildcard, `api`).
- [ ] Redirect `www → apex` aktif; masalah subdomain `app` (§4) sudah diputuskan.
- [ ] `next.config.ts` → `images.remotePatterns` hanya berisi `localhost:8000`/`127.0.0.1:8000`. Tambahkan host `api.skaihub.com` (`/storage/**`) bila gambar dirender lewat `next/image`, kalau tidak gambar upload gagal tampil.
- [ ] Rate limit aktif (login 5/menit, inquiry 3/menit, view 30/menit).
- [ ] `/api/health` hijau dan monitor uptime terpasang.
- [ ] Backup DB otomatis aktif dan satu uji restore sudah dilakukan.
- [ ] Risiko yang diterima tercatat: upload di disk publik dengan nama acak (D15); token di localStorage (D9).
- [ ] Data pribadi anak: tempatkan DB & file di penyedia dengan perjanjian pemrosesan data yang jelas, sesuai UU No. 27/2022 tentang Pelindungan Data Pribadi.
