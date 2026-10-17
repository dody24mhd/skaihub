# Laporan L5-B — Akun platform & ganti password (5.2, 5.3) + subdomain cadangan

- **Pelaksana:** Claude agent (Opus 5.5)
- **Worktree:** `.worktrees/fase5-b` · **Branch:** `fase-5-accounts`
- **Tanggal:** 2026-10-17

---

Tugas: L5-B — `/super-admin/platform-users`, `PUT /auth/password`, halaman `/internal/users`, `/academy/account`, `/internal/account`; ditambah butir EXTRA (blocker rilis) subdomain cadangan.

Diubah:
- `dojang-hub-web/src/lib/routing/resolve-rewrite.ts` — konstanta `RESERVED_SUBDOMAINS` (`www, app, api, admin, mail, static, cdn, status`); selain `admin`, subdomain cadangan tidak di-rewrite (`www`/`app` = domain utama). Sebelumnya `app.<base>` dll. di-rewrite ke `/a/app`.
- `dojang-hub-web/src/lib/routing/__tests__/resolve-rewrite.test.ts` — 4 test baru (www/app, api/mail/static/cdn/status, huruf besar, isi daftar).
- `dojang-hub-api/config/skaihub.php` (baru) — satu-satunya key `reserved_subdomains`.
- `dojang-hub-api/app/Http/Controllers/SuperAdmin/AkademiController.php` — `Rule::notIn(reserved)` pada slug di store/update, pesan "Slug \":input\" dicadangkan untuk sistem. Gunakan slug lain."; slug otomatis yang bentrok dengan daftar cadangan diberi akhiran acak huruf kecil.
- `dojang-hub-api/tests/Feature/ReservedAkademiSlugTest.php` (baru) — 4 test.
- `dojang-hub-api/app/Http/Controllers/SuperAdmin/PlatformUserController.php` (baru) — index/store/update/destroy staf platform.
- `dojang-hub-api/app/Http/Controllers/Auth/AuthController.php` — `changePassword()`.
- `dojang-hub-api/routes/api.php` — dua blok `// L5-B`: `PUT auth/password` (`throttle:6,1`) dan `apiResource('platform-users')` di grup `super-admin`.
- `dojang-hub-api/tests/Feature/PlatformUserApiTest.php` (9 test), `ChangePasswordTest.php` (6 test) — baru.
- `dojang-hub-web/src/app/(admin)/_lib/admin-api.ts` — blok `// L5-B` di akhir: tipe `PlatformUser`, `PlatformUserPayload`, `ChangePasswordPayload`; fungsi `getPlatformUsers`, `createPlatformUser`, `updatePlatformUser`, `deactivatePlatformUser`, `changeOwnPassword`.
- `dojang-hub-web/src/app/(admin)/_components/platform-users/platform-users-manager.tsx` + `platform-user-form-modal.tsx` (baru) — `ResponsiveList` + `SheetModal`, state loading/kosong/error+coba lagi/sukses.
- `dojang-hub-web/src/app/(admin)/_components/account/change-password-form.tsx` (baru) — form 3 field, validasi UX (min 8, konfirmasi, harus beda), pesan API ditampilkan.
- `dojang-hub-web/src/app/(admin)/internal/users/page.tsx` — placeholder diganti manager staf platform.
- `dojang-hub-web/src/app/(admin)/academy/account/page.tsx`, `internal/account/page.tsx` (baru).
- `dojang-hub-web/src/app/(admin)/_components/ui/academy-nav.ts` — seksi "Akun" › "Ganti Password" untuk ketiga role akademi (otomatis muncul di sidebar dan sheet "Lainnya").
- `dojang-hub-web/src/app/(admin)/_components/admin-shell.tsx` — item "Admin Akademi" → "Staf Platform" dan hanya tampil untuk `super_admin`; tautan "Ganti Password" di footer sidebar dan drawer HP.
- Test web: `account/__tests__/change-password-form.test.tsx` (5), `platform-users/__tests__/platform-users-manager.test.tsx` (5), `admin-shell.test.tsx` (+2), `academy-nav.test.ts` (+1).
- `dojang-hub-web/e2e/responsive.spec.ts` — `/academy/account` ditambahkan ke daftar rute responsif; blok `// L5-B`: pelatih ganti password via "Lainnya" di HP (422 lalu sukses), super admin tambah staf platform (mobile/tablet/desktop, tanpa scroll horizontal).

Commit:
- `cd69817` fix(web): stop rewriting reserved subdomains to academy pages
- `5c57e9d` fix(api): reject reserved subdomains as akademi slug
- `bc2830a` feat(api): platform staff management and self password change
- `9ded7f0` feat(web): platform staff manager and change password pages
- (commit laporan ini)

Test (backend, semua LULUS):
- `ReservedAkademiSlugTest`: config satu tempat; create slug `www` → 422 pesan Indonesia; update slug `api` → 422; nama "App" → slug `app-xxxx`.
- `PlatformUserApiTest`: list hanya user platform; create memaksa `role=admin`, `akademi_id=null`; validasi 422; staf `admin` & ketua akademi → 403 untuk semua aksi; update + reset password mencabut token; nonaktif (DELETE / `is_active=false`) mencabut token; diri sendiri → 422; super admin lain / user akademi → 404.
- `ChangePasswordTest`: 5 role bisa ganti password; token lain dicabut, token saat ini tetap & `/auth/me` tetap 200; password lama salah → 422 `current_password` "Password saat ini salah." tanpa mencabut token; min 8 / konfirmasi / harus beda → 422; tanpa token → 401; percobaan ke-7 → 429.
- TDD: test reserved slug, platform users, change password, dan resolve-rewrite dijalankan GAGAL dulu (404/201/200 dan 4 failed) sebelum implementasi.

Verifikasi:
- `php artisan test` → 125 passed (663 assertions)
- `vendor/bin/pint --dirty` → passed
- `npm run lint` → 0 errors, 6 warnings lama (`(tenant)/a/[slug]`)
- `npm run typecheck` → 0 error
- `npm test` → 50 file, 196 test passed
- `npm run build` → sukses; rute baru `/academy/account`, `/internal/account`, `/internal/users` (static)
- `PLAYWRIGHT_PORT=3920 npx playwright test --workers=1` → 68 passed, 10 skipped (alur khusus HP di project tablet/desktop), 5.7m. Run pertama gagal 1 test L5-B di mobile karena locator memilih sel tabel desktop yang tersembunyi; locator diperbaiki ke `filter({ visible: true })`, bukan implementasinya. Port 3920 sudah bebas.

## Keputusan
1. **Daftar subdomain cadangan ada di dua tempat** (`config/skaihub.php` untuk API, `RESERVED_SUBDOMAINS` di `resolve-rewrite.ts` untuk web) karena beda stack; keduanya diberi komentar "keep in sync". Subdomain cadangan selain `admin` tidak di-rewrite sama sekali (DNS produksi sebaiknya tidak mengarahkan `api/mail/static/cdn/status` ke web).
2. **Slug otomatis** yang jatuh ke nama cadangan (mis. akademi bernama "App") tidak ditolak, melainkan diberi akhiran acak seperti slug duplikat; slug yang diketik manual ditolak 422.
3. **`GET platform-users`** menampilkan super admin + staf `admin` (tanpa `akademi_id`) agar "Akun saya" terlihat; hanya staf `admin` yang bisa diubah. Diri sendiri → 422 (pola `Akademi/UserController`), super admin lain/akun akademi → 404 "Staf platform tidak ditemukan."
4. **DELETE = nonaktifkan** (`is_active=false` + cabut token), bukan soft delete — konsisten dengan `/akademi/users`; aktifkan lagi lewat `PUT is_active=true`.
5. **Password staf** saat dibuat super admin: `min:8` tanpa konfirmasi (pola user akademi). **Ganti password sendiri**: `bail|min:8|confirmed|different:current_password|Password::defaults()`; pesan validasi kustom Bahasa Indonesia (locale app masih `en`).
6. **Revokasi token**: hanya token selain token saat ini yang dihapus; jika request tidak memakai personal access token (mis. `actingAs`), semua token dihapus.
7. **Menu**: "Ganti Password" akademi sebagai seksi "Akun" di nav (sidebar + "Lainnya"); internal di footer sidebar & drawer. Item nav internal "Admin Akademi" diganti nama "Staf Platform" dan disembunyikan untuk role `admin` karena API-nya khusus super admin.

## Catatan / belum dikerjakan
- `admin-coming-soon.tsx` kini tidak dipakai di mana pun; tidak dihapus (A8.2 — perlu persetujuan).
- Item nav internal "Akademi" dan "Subscription" masih tampil untuk staf `admin` padahal API-nya super-admin-only (403) — di luar lingkup L5-B, usul jalur berikut menyembunyikannya dengan flag yang sama (`superAdminOnly`).
- Pesan 429 dari throttle Laravel masih bahasa Inggris ("Too Many Attempts.") dan ditampilkan apa adanya di form.
- Lint: 6 warning lama `@next/next/no-img-element` di `src/app/(tenant)/a/[slug]/*` (bukan dari jalur ini).
