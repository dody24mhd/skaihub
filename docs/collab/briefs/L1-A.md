# Brief L1-A — Backend: 1.0, 1.6, 1.7

- **Pelaksana:** Gemini-1
- **Worktree:** `.worktrees/fase1` · **Branch:** `fase-1-backend`
- **Boleh diubah:** `dojang-hub-api/**`, `docs/collab/reports/L1-A.md`
- **Dilarang:** `dojang-hub-web/**`, file lain di `docs/`, migrasi lama, dependensi baru.
- Wajib patuhi `docs/PLAN-2026-10.md` Bagian A (A1–A9).

Kerjakan **berurutan**, **satu commit per tugas** (Conventional Commits).

## 1.0 — Hijaukan baseline test
`php artisan test` di `main`: 43 test, 5 gagal di `tests/Feature/AkademiManagementApiTest.php`:
1. `test_admin_akademi_can_create_and_deactivate_coach` — pesan kini "Profil pelatih berhasil dinonaktifkan.".
2. `test_ketua_and_admin_can_manage_pengurus_and_coach_accounts` — jumlah akun 4, test mengharapkan 3.
3. `test_admin_can_configure_evaluation_and_coach_can_score_students` — 422 `evaluation_period_id` wajib.
4. `test_student_detail_includes_attendance_spp_and_evaluation_history` dan
5. `test_admin_can_export_students_spp_and_evaluation_csv` — insert `evaluation_aspects` tanpa `evaluation_period_id`.

Untuk tiap kasus: baca controller/migrasi terkait, putuskan apakah **kode** sudah benar (aspek evaluasi memang milik periode → test yang usang) atau **kode** yang salah. Jelaskan alasannya per test di laporan. Jangan melemahkan assertion (mis. menghapus cek) — perbarui ke nilai yang benar.
Commit: `test: align feature tests with current evaluation and user behavior` (atau `fix:` bila kode yang diperbaiki).
**Selesai jika:** `php artisan test` → semua lulus.

## 1.6 — Rate limiting
- Definisikan limiter bernama di `app/Providers/AppServiceProvider.php` (`RateLimiter::for`):
  - `login`: 5/menit per kombinasi IP + email (lowercase).
  - `inquiries`: 3/menit per IP.
  - `public-views`: 30/menit per IP.
- Pasang `->middleware('throttle:login')` di `POST auth/login` (`routes/api.php` ±baris 51), `throttle:inquiries` di `POST compro/inquiries` (±81), `throttle:public-views` di dua route `.../view` (±77, ±80).
- Test baru `tests/Feature/RateLimitTest.php`: percobaan login ke-6 → 429; inquiry ke-4 → 429; limiter login tidak saling memengaruhi antar email berbeda.
Commit: `feat: rate limit login, inquiries, and public view counters`.

## 1.7 — Penegakan kuota siswa aktif
- Konteks: `app/Services/SubscriptionService.php` sudah punya `activeForAkademi()`, `entitlements()` (mengembalikan `student_limit`, 0 bila tak ada langganan aktif) dan `Subscription::totalStudentLimit()`. `Akademi/StudentController` **tidak** memakainya.
- Tambah `SubscriptionService::assertCanAddActiveStudent(Akademi $akademi, ?int $ignoreStudentId = null): void` yang menghitung siswa `status = active` milik akademi (tanpa soft-deleted, tanpa `$ignoreStudentId`) dan melempar `ValidationException` pada field `status` dengan pesan Indonesia, mis. "Kuota siswa aktif paket Anda (50) sudah penuh. Hubungi SKAIHUB untuk menambah kuota.", bila jumlah ≥ limit.
- Panggil saat `store` bila status hasil = `active`, dan saat `update` bila status berubah dari non-active → `active`.
- Alumni/inactive tidak dihitung. Tanpa langganan aktif → limit 0 → tidak bisa menambah siswa aktif (perilaku disengaja; sebutkan di laporan).
- Pastikan test lain yang membuat siswa via API tetap lulus (buat langganan aktif di `setUp` bila perlu, pakai `SubscriptionService::createInitial`/`createForAkademi`). Seeder demo juga harus tetap jalan (uji hanya di sqlite test, **jangan** `migrate:fresh` pada database pgsql lokal).
- Test baru `tests/Feature/StudentQuotaTest.php`: di bawah batas → 201; penuh → 422; `extra_student_blocks` menaikkan batas; alumni tidak dihitung; reaktivasi inactive→active saat penuh → 422; tanpa langganan aktif → 422; akademi lain tidak terpengaruh.
Commit: `feat: enforce active student quota per subscription`.

## Verifikasi akhir (wajib, tempel output ringkas di laporan)
```
cd dojang-hub-api
php artisan test
vendor/bin/pint --dirty
```
Lalu tulis `docs/collab/reports/L1-A.md` (format A7) dan commit `docs: report L1-A`. Berhenti.
