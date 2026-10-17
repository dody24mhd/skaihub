# Laporan Pelaksanaan Brief L1-B (Backend Keamanan: D8, D10, D11, D12)

- **Pelaksana:** Gemini-1
- **Worktree:** `.worktrees/fase1`
- **Branch:** `fase-1-backend`
- **Status:** SELESAI

---

## B1 — Token & User Nonaktif (F2, F3)

Tugas: B1 — Token & user nonaktif
Diubah:
- `dojang-hub-api/app/Http/Middleware/EnsureAkademiUser.php` — Tolak 401 jika `! $user->is_active` dengan pesan Bahasa Indonesia.
- `dojang-hub-api/app/Http/Middleware/EnsurePlatformAdmin.php` — Tolak 401 jika `! $user->is_active` dengan pesan Bahasa Indonesia.
- `dojang-hub-api/config/sanctum.php` — Konfigurasi `expiration` mengambil `SANCTUM_EXPIRATION` (default `10080` / 7 hari).
- `dojang-hub-api/.env.example` — Ditambahkan `SANCTUM_EXPIRATION=10080`.
- `dojang-hub-api/app/Http/Controllers/Auth/AuthController.php` — Hapus token lama dengan nama yang sama saat login sebelum membuat token baru.
- `dojang-hub-api/app/Http/Controllers/Akademi/UserController.php` — Cabut semua token saat user dinonaktifkan atau password diubah admin.
- `dojang-hub-api/app/Http/Controllers/Akademi/CoachController.php` — Cabut token user saat profil pelatih dinonaktifkan.
- `dojang-hub-api/app/Http/Controllers/SuperAdmin/AkademiController.php` — Cabut semua token seluruh user akademi saat akademi dinonaktifkan super admin.
- `dojang-hub-api/tests/Feature/TokenLifecycleTest.php` — Test: user nonaktif 401, token kedaluwarsa 401, token deduplikasi saat login ganda, ganti password mencabut token lama.

Test:
- `TokenLifecycleTest` (5 test) — LULUS

---

## B2 — Eskalasi Role (F4, F5)

Tugas: B2 — Eskalasi role
Diubah:
- `dojang-hub-api/app/Http/Controllers/Akademi/CoachController.php` — Aksi tulis/baca detail pelatih dibatasi hanya untuk user ber-role `pelatih` (target non-pelatih merespons 404). Admin akademi tidak bisa memodifikasi kredensial Ketua melalui endpoint pelatih.
- `dojang-hub-api/app/Http/Controllers/Akademi/UserController.php` — Penyesuaian `manageableRoles`: `ketua_akademi` mengelola `['admin_akademi', 'pelatih']`, sedangkan `admin_akademi` hanya boleh mengelola `['pelatih']`. Admin boleh memperbarui profil sendiri tanpa mengubah `role` atau `is_active` miliknya.
- `dojang-hub-api/tests/Feature/AkademiManagementApiTest.php` — Penyesuaian test lama: `test_ketua_and_admin_can_manage_pengurus_and_coach_accounts` diselaraskan dengan PRD bahwa admin tidak boleh mengedit akun admin lain (hanya ketua yang berhak).
- `dojang-hub-api/tests/Feature/RoleEscalationTest.php` — Test pencegahan eskalasi role dan akses pelatih.

Test:
- `RoleEscalationTest` (4 test) — LULUS

---

## B3 — `sport_ranks` Per-tenant (F1)

Tugas: B3 — `sport_ranks` per-tenant
Diubah:
- `dojang-hub-api/database/migrations/2026_10_17_070000_add_akademi_id_to_sport_ranks_table.php` — Migrasi baru: kolom `akademi_id` nullable foreign key dengan onDelete cascade + index, serta index unique per `(akademi_id, sport_type, code)`.
- `dojang-hub-api/app/Models/SportRank.php` — Tambah `akademi_id` ke `$fillable` dan relasi `akademi()`.
- `dojang-hub-api/app/Http/Controllers/Akademi/SportRankController.php` — `index` menampilkan rank global (`akademi_id NULL`) + milik akademi aktif; `store` mengisi `akademi_id`; `update`/`destroy` memproteksi baris global (403 "Tingkatan bawaan tidak bisa diubah.") dan hanya mengizinkan milik akademi sendiri.
- `dojang-hub-api/app/Http/Controllers/Akademi/StudentController.php` — Validasi rank mengizinkan tingkatan global atau milik akademi yang bersangkutan.
- `dojang-hub-api/tests/Feature/SportRankTenantTest.php` — Test: isolasi antar-tenant, proteksi baris global dari modifikasi/penghapusan.

Test:
- `SportRankTenantTest` (4 test) — LULUS

---

## B4 — Entitlement Landing Page (D11)

Tugas: B4 — Entitlement landing page
Diubah:
- `dojang-hub-api/app/Models/Akademi.php` — Method `hasPublicWebsite()` memeriksa entitlement langganan aktif via `SubscriptionService` (`has_public_website`).
- `dojang-hub-api/app/Http/Middleware/EnsureFeature.php` — Middleware baru pengecekan feature entitlement langganan akademi (403 Bahasa Indonesia jika tidak tercakup dalam paket).
- `dojang-hub-api/bootstrap/app.php` — Registrasi alias middleware `feature`.
- `dojang-hub-api/routes/api.php` — Pemasangan middleware `feature:public_website` pada grup rute `public-profile*`.
- `dojang-hub-api/tests/Feature/PublicProfileEntitlementTest.php` — Test: Starter ditolak 403, Pro aktif diizinkan 200, Pro kedaluwarsa 404 pada endpoint publik.

Test:
- `PublicProfileEntitlementTest` (3 test) — LULUS

---

## B5 — Sesi Pelatih (F6) & per_page (F14)

Tugas: B5 — Sesi pelatih & per_page
Diubah:
- `dojang-hub-api/app/Http/Controllers/Akademi/TrainingSessionController.php` — Pelatih hanya dapat mengupdate sesi dan absensi sesi yang ditugaskan kepadanya (`coach_id` atau relasi pivot `training_session_coaches`). Pelatih dilarang menghapus sesi (`destroy` 403) dan dilarang mengubah `class_id` atau `training_schedule_id` (403). `index` membatasi `per_page` maksimal 100.
- `dojang-hub-api/tests/Feature/AkademiManagementApiTest.php` — Penyesuaian test lama `test_active_coach_can_record_today_session_and_is_attached_as_session_coach`: aturan lama membolehkan pelatih mana pun merekam absensi sesi hari ini (`isTodayCoach`) meskipun tidak ditugaskan, yang melanggar batasan hak akses pelatih (F6). Test disesuaikan agar pelatih yang tidak ditugaskan ditolak 403, sedangkan pelatih yang ditugaskan dapat mengisi absensi.
- `dojang-hub-api/tests/Feature/TrainingSessionSecurityTest.php` — Test: pelatih lain 403, pelatih ditugaskan bisa rekam absensi, pelatih destroy sesi 403, pelatih ganti kelas 403, pembatasan max per_page 100.

Test:
- `TrainingSessionSecurityTest` (5 test) — LULUS

---

## B6 — SPP Pembayaran (F10)

Tugas: B6 — SPP pembayaran
Diubah:
- `dojang-hub-api/app/Http/Controllers/Akademi/SppBillController.php` — Method `pay`: berjalan dalam transaksi dengan `lockForUpdate` pada baris tagihan `SppBill`; tolak 422 bila status tagihan `paid` atau `waived`; tolak 422 bila `amount` melebihi sisa tagihan; validasi `proof_url` jika diisi wajib berasal dari storage akademi terkait (`Storage::disk('public')->url('akademi/{id}/')`).
- `dojang-hub-api/tests/Feature/SppPaymentSecurityTest.php` — Test: pembayaran pada tagihan lunas (422), tagihan waived (422), pembayaran overpay (422), proof URL eksternal atau akademi lain (422), pembayaran parsial lalu lunas (update status benar).

Test:
- `SppPaymentSecurityTest` (5 test) — LULUS

---

## B7 — CSV Injection (F8)

Tugas: B7 — CSV injection
Diubah:
- `dojang-hub-api/app/Http/Controllers/Akademi/ExportController.php` — Penambahan helper `sanitizeCell` dan `sanitizeRow` yang mengawali sel string dengan karakter `'` jika diawali salah satu karakter formula injection: `=`, `+`, `-`, `@`, `\t`, atau `\r`. Diterapkan otomatis pada semua header dan baris data seluruh fungsi export CSV (`students`, `spp`, `evaluation`).
- `dojang-hub-api/tests/Feature/CsvExportSecurityTest.php` — Test ekspor CSV memverifikasi formula injection disanitasi dengan awalan `'`.

Test:
- `CsvExportSecurityTest` (1 test) — LULUS

---

## Verifikasi Akhir

```
cd dojang-hub-api
php artisan test
```
Hasil:
```
Tests:    81 passed (412 assertions)
Duration: 2.45s
```

```
vendor/bin/pint --dirty
```
Hasil:
```
{"tool":"pint","result":"passed"}
```

Catatan/keputusan yang perlu pemilik project: tidak ada.
Semua tugas Brief L1-B (B1–B7) telah selesai diimplementasikan, diverifikasi, dan lulus pengujian.
