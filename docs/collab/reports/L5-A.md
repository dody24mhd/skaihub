# Laporan L5-A — E2E integrasi dengan backend asli (5.1)

- **Pelaksana:** Claude agent · **Worktree:** `.worktrees/fase5-a` · **Branch:** `fase-5-integration` · **Tanggal:** 2026-10-17

## Yang dibuat

- `dojang-hub-web/playwright.integration.config.ts` — project `mobile` (375x812) dan `desktop` (1280x800), `workers: 1`, `webServer` ganda:
  1. API: `node e2e-integration/start-api.mjs` (port 8010)
  2. Web: `npm run build && npm run start -p 3910` dengan `NEXT_PUBLIC_API_URL=http://127.0.0.1:8010/api` (timeout 900 dtk, `reuseExistingServer: false`)
  - `INTEGRATION_NO_SERVER=1` hanya untuk iterasi lokal (memakai server yang sudah hidup).
- `dojang-hub-web/e2e-integration/start-api.mjs` — membuat file kosong `dojang-hub-api/storage/testing/integration.sqlite` (dihapus & dibuat ulang tiap run), meng-override env `DB_CONNECTION=sqlite`, `DB_DATABASE=<path absolut>`, `DB_URL=`, `APP_ENV=testing`, `CORS_ALLOWED_ORIGINS=http://localhost:3910,http://127.0.0.1:3910`, `CACHE_STORE=array`, `SESSION_DRIVER=array`, `BCRYPT_ROUNDS=4`, lalu `php artisan migrate:fresh --seed --force` (hanya pada file sqlite itu) dan `php artisan serve --host=127.0.0.1 --port=8010`. Database pgsql `skaihub` tidak pernah disentuh (semua env DB di-override sebelum artisan jalan).
- `dojang-hub-web/e2e-integration/*.spec.ts` + `helpers.ts`; script `npm run test:integration`.
- `.gitignore`: `dojang-hub-api/storage/testing/` dan `dojang-hub-web/test-results-integration/`; `eslint.config.mjs` mengabaikan `test-results*/**` dan `playwright-report/**` (lint sebelumnya crash membaca artefak trace).
- Seeder `DemoAkademiSeeder` sudah memberi Garuda Sakti langganan `active` plan `pro`, jadi tidak perlu setup tambahan.

Catatan desain: `CACHE_STORE=array` membuat rate limit login (5/menit) tidak menumpuk di server E2E; throttle sendiri sudah diuji di feature test API. Backend hanya mengizinkan satu token aktif per user (login baru mencabut token lama), jadi helper `apiLogin` memvalidasi token cache lewat `/auth/me` dan login ulang bila sudah dicabut (mis. oleh login lewat form UI).

## Skenario & hasil (dua project: mobile + desktop)

| Spec | Skenario |
|---|---|
| `auth-menus.spec.ts` | Login lewat form untuk ketua, admin, pelatih (-> `/academy`) dan superadmin (-> `/internal`); menu sesuai role (SPP/Keuangan/Akun/Sabuk/Halaman Publik hanya untuk role berhak, `/internal` tidak muncul di akademi); password salah ditolak; pelatih membuka `/academy/spp` ditolak ("Akses ditolak", tanpa tombol Buat Tagihan/Bayar) |
| `students.spec.ts` | Ketua menambah siswa: submit tanpa wali (siswa < 17 th) diblokir, lalu isi wali -> tersimpan dan muncul di daftar |
| `attendance.spec.ts` | Pelatih: Absensi > Kelas Hari Ini > buka slot > tandai Sakit (+Hadir) > Selesaikan; status `completed` dicek via API dan Sakit tetap ada setelah reload |
| `spp.spec.ts` | Admin: generate SPP periode uji > bayar parsial 50.000 (Sebagian) > lunasi 100.000 (Lunas, tombol Bayar hilang) > buka kwitansi (nama, nominal, sisa) |
| `ukt.spec.ts` | Ketua: buat event UKT > tambah peserta > Lulus > sabuk siswa jadi Geup 9, riwayat sabuk "Kenaikan tingkat: <event>" (API + UI detail siswa) > halaman sertifikat terbuka |
| `report.spec.ts` | Pelatih: detail siswa > pilih periode > Cetak Rapor > rapor + tabel nilai per aspek tampil |
| `public-and-account.spec.ts` | Landing publik `/a/garuda-sakti` (akademi Pro) tampil, slug tidak ada -> 404; ganti password user sekali pakai lewat UI (konfirmasi tidak cocok, password lama salah, sukses), password lama tidak berlaku, token perangkat lain dicabut |

Hasil run akhir: lihat "Angka test" di bawah.

## Bug yang ditemukan

Diperbaiki (satu commit `fix(...)` masing-masing, dengan test):

1. **Seeder demo: slot "Kelas Hari Ini" ganda** — `DemoAkademiSeeder::session()` membuat sesi terjadwal tanpa `source_schedule_date`, padahal `TodaySessionController` mencocokkan sesi ke slot jadwal lewat kolom itu. Akibatnya jadwal yang sama muncul dua kali (Belum Dibuka + Draft) dan "Buka Absensi" dapat membuat sesi ganda. Perbaikan: isi `source_schedule_date` di seeder (sesi pengganti tetap null karena unique index jadwal+tanggal sumber). Test: `tests/Feature/DemoSeederTodaySlotsTest.php` (terbukti gagal tanpa perbaikan). Hanya data demo, bukan logika produksi.
2. **Dashboard pelatih: "Siswa Aktif 0" menyesatkan** — API sengaja mengirim `students: null` untuk pelatih, UI memakai `|| 0`. Perbaikan di `academy-dashboard-manager.tsx`: tampil "-" dengan keterangan. Test komponen ditambahkan.

Terbuka / catatan (tidak diubah):

- **Jadwal publik tidak tampil di landing page**: `public_schedule` dipetakan di `tenant-data.ts` tetapi tidak dirender di `(tenant)/a/[slug]/page.tsx`, sehingga isian "Jadwal publik" dari editor Halaman Publik tidak pernah terlihat pengunjung. Butuh keputusan desain.
- **Pelatih membuka `/academy/spp`**: tidak di-redirect; halaman tampil dengan pesan error API ("Akses ditolak ..."). Aman (403 dari API, tidak ada data) tetapi UX bisa lebih baik dengan redirect ke `/academy`.
- Form tambah siswa: pesan kustom "Periksa kembali kontak dan data wali..." tidak tampil untuk wali kosong karena atribut `required` browser memblokir submit lebih dulu (perilaku tetap benar).
- Kelas Hari Ini bergantung hari: seed hanya punya jadwal Selasa dan Sabtu. Test mencari slot terbuka hingga 7 hari ke belakang (jendela isi mundur pelatih) dan, bila habis, admin membuat sesi tambahan hari ini lewat API.

## Screenshot

`dojang-hub-web/test-results-integration/screens/{mobile,desktop}-*.png` (gitignored, dibuat tiap run): `menu-*`, `student-validation`, `student-created`, `kelas-hari-ini`, `absensi-sakit`, `absensi-selesai`, `spp-generate-result`, `spp-partial`, `spp-receipt`, `ukt-passed`, `student-rank-history`, `ukt-certificate`, `student-report`, `landing-garuda-sakti`, `password-changed`, `pelatih-spp-denied`.

## Cara menjalankan

```
cd dojang-hub-api && composer install
cd ../dojang-hub-web && npm ci && npx playwright install chromium
npm run test:integration
```

Butuh `php` (ext sqlite) di PATH; port 3910 dan 8010 harus kosong.

## Angka test

- `npm run test:integration` (build produksi + API sqlite sementara): **26 lulus / 0 gagal** (13 skenario x 2 project: mobile & desktop), 3,6 menit.
- `php -d opcache.enable_cli=0 artisan test`: **278 lulus** (1275 assertion).
- `npx vitest run --pool=threads`: **330 lulus** (73 file).
- `npx tsc --noEmit`: bersih. `npm run lint`: 0 error (6 warning `<img>` lama).
