# Laporan Pelaksanaan Brief L1-C (Skema MVP: D1, D3–D7)

- **Pelaksana:** Gemini-1
- **Worktree:** `.worktrees/fase1`
- **Branch:** `fase-1-backend`
- **Status:** SELESAI

---

## C1 — Status Absensi `sick` (D3)

Tugas: C1 — Status absensi `sick`
Diubah:
- `dojang-hub-api/database/migrations/2026_10_17_000002_add_sick_status_to_training_attendances_table.php` — Migrasi baru: pada PostgreSQL memperbarui CHECK constraint `training_attendances_status_check` untuk mengizinkan `'sick'`; pada SQLite mengubah tipe kolom `status` menjadi `string(20)`. Method `down()` mengembalikan constraint awal.
- `dojang-hub-api/app/Http/Controllers/Akademi/TrainingSessionController.php` — Validasi status pada array `attendances.*.status` dan `extra_participants.*.status` ditambahkan nilai `'sick'` (`Rule::in(['present', 'absent', 'excused', 'sick'])`).
- Statistik kehadiran: pada `DashboardController` dan `StudentController`, statistik `attendance_present` menghitung status `'present'`, sedangkan `attendance_total` menghitung seluruh absensi. Dengan demikian, status `'sick'` secara tepat diperlakukan setara dengan `'excused'` (bukan hadir, dan bukan alpa).
- `dojang-hub-api/tests/Feature/TrainingAttendanceSickTest.php` — Test penyimpanan absensi dan peserta ekstra berstatus `'sick'`, pembacaan kembali dari API dan database, serta verifikasi ringkasan kehadiran siswa.

Test:
- `TrainingAttendanceSickTest` (1 test) — LULUS

---

## C2 — `spp_payments.akademi_id` (D4)

Tugas: C2 — `spp_payments.akademi_id`
Diubah:
- `dojang-hub-api/database/migrations/2026_10_17_000003_add_akademi_id_to_spp_payments_table.php` — Migrasi baru: penambahan kolom `akademi_id` nullable berelasi foreign key ke tabel `akademi` (`cascadeOnDelete`), indeks komposit `(akademi_id, paid_at)`, dan backfill portabel data lama via subquery correlated `UPDATE spp_payments SET akademi_id = (SELECT akademi_id FROM spp_bills WHERE spp_bills.id = spp_payments.spp_bill_id) WHERE akademi_id IS NULL`.
- `dojang-hub-api/app/Models/SppPayment.php` — Penambahan `'akademi_id'` pada `$fillable` dan penambahan relasi `akademi(): BelongsTo`.
- `dojang-hub-api/app/Http/Controllers/Akademi/SppBillController.php` — Method `pay()` otomatis mengisi `'akademi_id' => $request->user()->akademi_id` saat pembuatan pembayaran.
- `dojang-hub-api/tests/Feature/SppPaymentAkademiIdTest.php` — Test: pembayaran baru menyimpan `akademi_id` yang sesuai, dan eksekusi query backfill pada baris lama dengan `akademi_id = null`.

Test:
- `SppPaymentAkademiIdTest` (2 test) — LULUS

---

## C3 — `student_rank_histories` (D5)

Tugas: C3 — `student_rank_histories`
Diubah:
- `dojang-hub-api/database/migrations/2026_10_17_000004_create_student_rank_histories_table.php` — Migrasi tabel `student_rank_histories`: `id`, `akademi_id` (FK, index), `student_id` (FK cascade), `sport_rank_id` (FK), `achieved_on` (date), `source_type` (default `'manual'`), `rank_promotion_participant_id` (nullable FK nullOnDelete), `notes` (text nullable), `changed_by` (FK users nullOnDelete), `timestamps`, serta indeks komposit `(student_id, achieved_on)`.
- `dojang-hub-api/app/Models/StudentRankHistory.php` — Model Eloquent baru dengan relasi ke `akademi`, `student`, `sportRank`, `promotionParticipant`, dan `changedBy`.
- `dojang-hub-api/app/Models/Student.php` — Penambahan relasi `rankHistories(): HasMany`.
- `dojang-hub-api/app/Http/Controllers/Akademi/StudentController.php` — Penulisan otomatis ke riwayat sabuk saat siswa didaftarkan dengan rank (`store`) dan saat rank siswa diperbarui (`update`); penambahan endpoint `rankHistories()` serta penyertaan riwayat di response `show()`.
- `dojang-hub-api/app/Http/Controllers/Akademi/RankPromotionController.php` — Method `syncStudentRank()` otomatis mencatat riwayat sabuk bertipe `'promotion_event'` dengan relasi ke peserta UKT saat peserta dinyatakan lulus (`result = 'passed'`).
- `dojang-hub-api/routes/api.php` — Pendaftaran rute `GET /api/akademi/students/{student}/rank-histories`.
- `dojang-hub-api/tests/Feature/StudentRankHistoryTest.php` — Test: pembuatan siswa dengan sabuk awal & update sabuk manual menghasilkan riwayat, kelulusan UKT menghasilkan riwayat `promotion_event`, serta isolasi tenant (404 jika diakses akademi lain).

Test:
- `StudentRankHistoryTest` (3 test) — LULUS

---

## C4 — `student_achievements` (D6)

Tugas: C4 — `student_achievements`
Diubah:
- `dojang-hub-api/database/migrations/2026_10_17_000005_create_student_achievements_table.php` — Migrasi tabel `student_achievements`: `id`, `akademi_id` (FK, index), `student_id` (FK cascade), `title` (varchar 255), `event_name` (nullable varchar 255), `achieved_on` (nullable date), `result_label` (nullable varchar 100), `notes` (nullable text), `timestamps`, `softDeletes`, dan indeks komposit `(akademi_id, student_id)`.
- `dojang-hub-api/app/Models/StudentAchievement.php` — Model Eloquent baru dengan `SoftDeletes` dan relasi ke `akademi` serta `student`.
- `dojang-hub-api/app/Models/Student.php` — Penambahan relasi `achievements(): HasMany`.
- `dojang-hub-api/app/Http/Controllers/Akademi/StudentAchievementController.php` — Controller baru penyedia endpoint CRUD: `index`, `store`, `update`, `destroy`. Izin tulis dibatasi untuk `ketua_akademi` dan `admin_akademi`, izin baca mencakup `pelatih`. Validasi kepemilikan tenant dan kecocokan ID siswa pada URL ditegakkan secara ketat (404 bila tidak cocok).
- `dojang-hub-api/routes/api.php` — Pendaftaran rute endpoint prestasi siswa:
  - `GET /api/akademi/students/{student}/achievements`
  - `POST /api/akademi/students/{student}/achievements`
  - `PUT /api/akademi/students/{student}/achievements/{achievement}`
  - `DELETE /api/akademi/students/{student}/achievements/{achievement}`
- `dojang-hub-api/tests/Feature/StudentAchievementTest.php` — Test: siklus CRUD lengkap oleh admin, pelatih hanya bisa membaca (POST ditolak 403), isolasi antar-tenant (404), dan proteksi jika ID prestasi tidak cocok dengan siswa pada URL (404).

Test:
- `StudentAchievementTest` (4 test) — LULUS

---

## C5 — Index Performa (D7)

Tugas: C5 — Index performa
Diubah:
- `dojang-hub-api/database/migrations/2026_10_17_000006_add_performance_indexes.php` — Migrasi penambahan indeks komposit dan foreign key performa:
  - `training_attendances(student_id)`
  - `spp_payments(spp_bill_id)`
  - `students(akademi_id, status)`
  - `users(akademi_id, role)`
  - `classes(akademi_id)`
  Method `down()` menghapus indeks secara terbalik.
- `dojang-hub-api/tests/Feature/PerformanceIndexesTest.php` — Test skema memastikan kelima indeks performa tersebut terdaftar dan aktif di database.

Test:
- `PerformanceIndexesTest` (1 test) — LULUS

---

## C6 — Sinkronisasi SCHEMA.md (D1)

Tugas: C6 — Sinkronisasi SCHEMA.md
Diubah:
- `SCHEMA.md` — Pembaruan menyeluruh untuk menyelaraskan cetak biru skema dengan implementasi aktual database MVP:
  1. Menambahkan tabel pemetaan detail dari target konseptual lama ke implementasi aktual database.
  2. Mendokumentasikan tabel dan fitur yang ditunda ke pasca-MVP (D2: `class_coaches`, `session_photos`, `session_participants`, `academy_spp_settings`, `evaluation_templates`, `coach_profiles.bio`).
  3. Memperbarui rincian kolom setiap tabel aktual (`akademi.plan`, `spp_bills`, `training_schedules`, `training_attendances` dengan status `sick`, `spp_payments.akademi_id`, `student_rank_histories`, `student_achievements`).
  4. Dokumen `PRD.md` tetap utuh tanpa perubahan sesuai instruksi.

---

## Verifikasi Akhir

```
cd dojang-hub-api
php artisan test
```
Hasil:
```
Tests:    92 passed (461 assertions)
Duration: 2.87s
```

```
vendor/bin/pint --dirty
```
Hasil:
```
{"tool":"pint","result":"passed"}
```

Catatan/keputusan yang perlu pemilik project: tidak ada.
Seluruh butir Brief L1-C (C1–C6) telah selesai diimplementasikan, diverifikasi, dan lulus pengujian.

---

## Perbaikan Review (L1-BC: R1–R10)

Status review dari Lead (Claude) + Security Reviewer: **CHANGES_REQUESTED** → **RESOLVED**.

### Rincian Perbaikan per Butir

1. **R1 (HIGH — `SppBillController.php` & `SppPaymentSecurityTest.php`):**
   - Menambahkan sanitasi ketat pada `proof_url`: parsing URL via `parse_url` dan `rawurldecode(path)`.
   - Menolak input yang mengandung path traversal (`..`), `%2e%2e`, backslash (`\`), query (`?`), fragment (`#`), dan karakter kontrol.
   - Memastikan prefix path wajib `/storage/akademi/{akademi_id}/` dan memeriksa keberadaan fisik file pada server via `Storage::disk('public')->exists(...)`.
   - Commit: `14a531a` (`fix(spp): harden proof_url path traversal and storage validation (R1)`).

2. **R2 (HIGH — `SportRankController.php` & migrasi `2026_10_17_000004`):**
   - Menambahkan pengecekan `StudentRankHistory::query()->where('sport_rank_id', $sportRank->id)->exists()` pada kondisi `$isUsed` sebelum menghapus sabuk.
   - Mengubah FK `sport_rank_id` pada migrasi `student_rank_histories` dari `cascadeOnDelete()` menjadi `restrictOnDelete()`.
   - Penghapusan sabuk yang memiliki riwayat ditolak dengan status HTTP 422.
   - Commit: `2ad6640` (`fix(ranks): restrict sport rank deletion when used in rank history (R2)`).

3. **R3 (MEDIUM — `RankPromotionController.php` & `StudentRankHistoryTest.php`):**
   - Menjadikan sinkronisasi riwayat sabuk UKT idempoten dengan `updateOrCreate` berkunci `rank_promotion_participant_id`.
   - Ketika hasil UKT diubah/dikembalikan dari `passed` ke status lain (mis. `failed`), baris riwayat sabuk terkait otomatis dihapus dan `current_rank_id` siswa dikembalikan ke sabuk asal (`from_rank_id`).
   - Commit: `bff383e` (`fix(promotions): ensure idempotent UKT rank history and revert on failure (R3)`).

4. **R4 (MEDIUM — migrasi `2026_10_17_000001` & `SportRankTenantTest.php`):**
   - Menambahkan partial unique index `CREATE UNIQUE INDEX sport_ranks_global_code_unique ON sport_ranks (sport_type, code) WHERE akademi_id IS NULL` yang kompatibel dengan PostgreSQL dan SQLite.
   - Menggunakan `DROP CONSTRAINT IF EXISTS` untuk nama constraint lama pada PostgreSQL.
   - Commit: `9e02e90` (`fix(db): add partial unique index for global sport ranks (R4)`).

5. **R5 (MEDIUM — migrasi `2026_10_17_000002` & `TrainingAttendanceSickTest.php`):**
   - Pada method `down()`, mengeksekusi `UPDATE training_attendances SET status='excused' WHERE status='sick'` sebelum mengembalikan CHECK constraint lama untuk mencegah kegagalan rollback pada PostgreSQL.
   - Commit: `345cd7c` (`fix(db): convert sick attendance to excused on migration rollback (R5)`).

6. **R6 (MEDIUM — migrasi `2026_10_17_000003`, `DemoAkademiSeeder.php`, & `SppPaymentAkademiIdTest.php`):**
   - Backfill memperhitungkan tagihan yang di-soft-delete (`withTrashed` / tanpa filter `deleted_at`), menghapus data orphan bila ada, lalu menetapkan kolom `akademi_id` menjadi `NOT NULL` via `->change()`.
   - Seeder `DemoAkademiSeeder` diperbarui menyertakan `akademi_id` saat membuat pembayaran demo.
   - Commit: `97479fe` (`fix(db): enforce not null on spp_payments.akademi_id after cleanup (R6)`).

7. **R7 (MEDIUM — `ExportController.php` & `CsvExportSecurityTest.php`):**
   - Nilai angka negatif murni (`/^-?\d+(\.\d+)?$/`) tidak lagi diawali tanda kutip tunggal (`'`).
   - Tetap melindungi karakter pemicu formula Excel/CSV (`=`, `+`, `-`, `@`, tab `\t`, CR `\r`), formula dengan spasi di depan, serta varian fullwidth (`＝`, `＋`, `－`, `＠`).
   - Commit: `06111e4` (`fix(export): allow pure negative numbers in CSV and escape formula variants (R7)`).

8. **R8 (MEDIUM — `EnsureActiveUser.php`, `EnsureSuperAdmin.php`, `routes/api.php`, `bootstrap/app.php`, & `AuthApiTest.php`):**
   - Membuat middleware `EnsureActiveUser` (alias `'active'`) dan memasangnya pada semua grup rute `auth:sanctum` (`auth/me`, `auth/logout`, `super-admin`, `admin`, `akademi`).
   - Memperbarui `EnsureSuperAdmin` untuk turut memastikan `is_active = true`. Akun nonaktif kini secara konsisten menerima respons 401 Unauthorized.
   - Commit: `5e92741` (`fix(auth): enforce EnsureActiveUser middleware on all sanctum routes (R8)`).

9. **R9 (LOW — `StudentController.php` & `StudentRankHistoryTest.php`):**
   - Menghapus penggunaan `notes` siswa pada riwayat sabuk manual; field `notes` pada `student_rank_histories` kini bernilai `null` kecuali jika parameter opsional `rank_notes` disertakan dalam request.
   - Commit: `f0f7bf4` (`fix(students): decouple manual rank history notes from student profile notes (R9)`).

10. **R10 (LOW — `SuperAdmin\AkademiController.php` & `SuperAdminAkademiApiTest.php`):**
    - Mengganti pemanggilan raw query `DB::table('personal_access_tokens')` dengan model Eloquent `PersonalAccessToken::whereIn('tokenable_id', ...)->where('tokenable_type', (new User)->getMorphClass())->delete()`, memastikan kompatibilitas penuh terhadap konfigurasi morph map.
    - Commit: `09c5e3c` (`fix(super-admin): use PersonalAccessToken model and morph class for token cleanup (R10)`).

### Catatan Arsitektur (MVP)
- **Single session per user:** Mekanisme login menghapus token lama dengan nama yang sama sehingga membatasi satu sesi per user. Hal ini merupakan keputusan desain yang disengaja untuk fase MVP.

### Verifikasi Akhir Pasca Review

```
cd dojang-hub-api
php artisan test
```
Hasil:
```
Tests:    103 passed (514 assertions)
Duration: 8.79s
```

```
vendor/bin/pint --dirty
```
Hasil:
```
{"tool":"pint","result":"passed"}
```

