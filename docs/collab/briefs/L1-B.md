# Brief L1-B — Backend keamanan (D8, D10, D11, D12)

- **Pelaksana:** Gemini-1 · **Worktree:** `.worktrees/fase1` · **Branch:** `fase-1-backend`
- **Boleh diubah:** `dojang-hub-api/**`, `docs/collab/reports/L1-B.md`
- **Dilarang:** `dojang-hub-web/**`, file `docs/` lain, migrasi lama (buat migrasi **baru** bila perlu), dependensi baru.
- Dasar: `docs/AUDIT-2026-10.md` §2 dan §5. Patuhi `docs/PLAN-2026-10.md` Bagian A.
- Setiap perbaikan **wajib** punya feature test yang gagal sebelum perbaikan dan lulus sesudahnya. Satu commit per butir.

## B1 — Token & user nonaktif (F2, F3)
- `EnsureAkademiUser` dan `EnsurePlatformAdmin`: tolak 401 bila `! $user->is_active` (pesan Indonesia).
- `config/sanctum.php`: `expiration` dari env `SANCTUM_EXPIRATION`, default `10080` (7 hari). Tambahkan ke `.env.example`.
- `AuthController@login`: hapus token lama user dengan nama token yang sama sebelum membuat token baru (tidak menumpuk).
- Cabut semua token (`$user->tokens()->delete()`) saat: user dinonaktifkan (`UserController::destroy`, update `is_active=false`, deaktivasi lewat `CoachController` bila menyentuh user), password diubah oleh admin, atau akademi dinonaktifkan oleh super admin (cek `SuperAdmin/AkademiController`).
- Test: token user nonaktif → 401; token kedaluwarsa (`travel`) → 401; login dua kali → hanya 1 token aktif; ganti password → token lama 401.

## B2 — Eskalasi role (F4, F5)
- `CoachController`: semua aksi tulis/baca detail hanya berlaku untuk user ber-role `pelatih` (target non-pelatih → 404). Admin akademi tidak bisa mengubah email/password Ketua lewat jalur ini.
- `UserController::manageableRoles`: `ketua_akademi` → `['admin_akademi','pelatih']`; `admin_akademi` → `['pelatih']` (sesuai PRD). Admin tetap boleh mengubah profilnya sendiri **tanpa** mengubah role/is_active-nya sendiri.
- Perbarui test lama yang mengandalkan perilaku lama hanya jika PRD mendukung perilaku baru; jelaskan di laporan.
- Test: admin → PUT coach milik ketua → 404; admin → update admin lain → 403/422; ketua → kelola admin → OK.

## B3 — `sport_ranks` per-tenant (F1)
- Migrasi baru: `sport_ranks.akademi_id` nullable FK (cascade) + index; ubah unique `(sport_type, code)` menjadi unik per `(akademi_id, sport_type, code)` dengan cara aman di sqlite & pgsql (baris global `NULL` tetap ada).
- `SportRankController`: `index` = baris global (`akademi_id NULL`) + milik akademi saat ini; `store` mengisi `akademi_id`; `update`/`destroy` hanya baris milik akademi saat ini (global → 403 "Tingkatan bawaan tidak bisa diubah."). Validasi `current_rank_id`/rank lain di controller lain harus menerima global + milik sendiri saja.
- Test: akademi A tidak bisa ubah/hapus global maupun milik B; A tidak melihat baris B.

## B4 — Entitlement landing page (D11)
- `Akademi::hasPublicWebsite()` memakai `SubscriptionService::entitlements(activeForAkademi())['has_public_website']` (bukan snapshot `plan`).
- Middleware baru `EnsureFeature` (alias `feature:public_website`) atau guard setara, dipasang di grup rute `public-profile*` (`routes/api.php` ±148–162) → 403 pesan Indonesia bila paket tidak mencakup.
- Test: Starter → PUT public-profile 403; Pro aktif → 200; Pro kedaluwarsa → endpoint publik 404.

## B5 — Sesi pelatih (F6) & per_page (F14)
- Pelatih hanya boleh `update` sesi dan absensi untuk sesi yang ia tugaskan (`coach_id` atau pivot `training_session_coaches`), dan **tidak** boleh `destroy` atau mengubah `class_id`/jadwal. Ketua/Admin tidak berubah.
- `TrainingSessionController@index`: `per_page` dibatasi maks 100.
- Test: pelatih lain → 403; pelatih yang ditugaskan → bisa isi absensi; pelatih → destroy 403.

## B6 — SPP pembayaran (F10)
- `SppBillController@pay`: dalam transaksi + `lockForUpdate` pada tagihan; tolak (422) bila status `paid` atau `waived`; tolak bila `amount` > sisa; `proof_url` (bila ada) wajib berasal dari storage sendiri (URL diawali `Storage::disk('public')->url('akademi/{id}/')` milik akademi itu).
- Test: bayar tagihan lunas → 422; overpay → 422; proof URL eksternal → 422; parsial lalu lunas → status benar.

## B7 — CSV injection (F8)
- Helper di `ExportController` yang mengawali sel string dengan `'` bila diawali `=`, `+`, `-`, `@`, tab, atau CR. Terapkan ke semua export.
- Test: siswa bernama `=HYPERLINK(...)` → sel export diawali `'`.

## Verifikasi akhir
```
cd dojang-hub-api
php artisan test
vendor/bin/pint --dirty
```
Tulis `docs/collab/reports/L1-B.md` (A7, sebutkan setiap test lama yang diubah + alasannya), commit `docs: report L1-B`. Berhenti.
