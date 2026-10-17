# Laporan L4-A — Sesi otomatis, "Kelas Hari Ini", pindah/batal/ganti pelatih (4.1)

- **Pelaksana:** Claude agent · **Worktree:** `.worktrees/fase4-a` · **Branch:** `fase-4-sessions` · **Tanggal:** 2026-10-17

Tugas: L4-A — Sesi otomatis, "Kelas Hari Ini", pindah/batal/ganti pelatih

Diubah:
- `dojang-hub-api/database/migrations/2026_10_17_100001_add_reschedule_fields_to_training_sessions_table.php` — status `rescheduled` (pgsql CHECK / sqlite string), kolom `reschedule_reason`, `cancel_reason`, `rescheduled_to_id`, `rescheduled_from_id`
- `dojang-hub-api/database/migrations/2026_10_17_100002_add_schedule_date_unique_to_training_sessions_table.php` — partial unique index `(training_schedule_id, source_schedule_date)` (abaikan NULL & soft-deleted), pgsql + sqlite
- `dojang-hub-api/config/training.php` — `coach_backfill_days` = 7 (env `TRAINING_COACH_BACKFILL_DAYS`)
- `dojang-hub-api/app/Services/TrainingSessionService.php` — roster sync, cek pelatih jadwal/sesi, jendela isi mundur pelatih, relasi
- `dojang-hub-api/app/Http/Controllers/Akademi/TrainingSessionActionController.php` — `from-schedule` (idempoten, 201 baru / 200 sudah ada), `reschedule`, `cancel`
- `dojang-hub-api/app/Http/Controllers/Akademi/TodaySessionController.php` — `GET /akademi/sessions/today?date=`
- `dojang-hub-api/app/Http/Controllers/Akademi/TrainingSessionController.php` — jendela 7 hari pelatih (store/update/attendance), absensi sesi `rescheduled` ditolak, store menolak duplikat jadwal+tanggal (422), pelatih tidak boleh ganti pelatih, roster sync saat show/simpan draft
- `dojang-hub-api/app/Http/Controllers/Akademi/DashboardController.php` — statistik tanpa sesi rescheduled/cancelled; pelatih dihitung via pivot juga
- `dojang-hub-api/app/Http/Controllers/Akademi/StudentController.php` — ringkasan kehadiran siswa tanpa sesi rescheduled/cancelled
- `dojang-hub-api/app/Models/TrainingSession.php` — fillable, `UNCOUNTED_STATUSES`, relasi `rescheduledTo/From`
- `dojang-hub-api/routes/api.php` — blok `// L4-A`
- `dojang-hub-web/src/app/(admin)/_lib/admin-api.ts` — status `rescheduled` + field baru di `TrainingSession`; blok `// L4-A` (today, from-schedule, reschedule, cancel, ganti pelatih)
- `dojang-hub-web/src/app/(admin)/_components/sessions/*` — `today-classes.tsx` (Kelas Hari Ini), `today-slot-card.tsx`, `session-action-sheets.tsx` (menu ⋯: Pindah Jadwal/Batalkan/Ganti Pelatih di SheetModal), `today-classes-card.tsx` (kartu dashboard), `use-today-slots.ts`, `today-utils.ts`
- `dojang-hub-web/src/app/(admin)/_components/attendance/attendance-tabs.tsx` + `academy/attendance/page.tsx` — tab "Kelas Hari Ini" (default) | "Kalender & Riwayat"
- `academy-attendance-manager.tsx`, `attendance/attendance-session-create.tsx`, `academy-attendance-overview-manager.tsx` — form manual = "Sesi Tambahan" (default tipe `extra`, hanya Ketua/Admin; pelatih diarahkan ke Kelas Hari Ini), label "Dipindah"
- `academy-dashboard-manager.tsx` — kartu Kelas Hari Ini
- `dojang-hub-web/e2e/fixtures/mock-api.ts`, `e2e/responsive.spec.ts` — blok `// L4-A`

Test:
- `TrainingSessionFromScheduleTest` (7) — idempoten, unique DB (soft-deleted/NULL diabaikan), hari jadwal, jadwal nonaktif, pelatih hanya jadwal miliknya (pivot), tenant lain, store duplikat — LULUS
- `TodaySessionsTest` (4) — gabung jadwal+sesi+ekstra, dipindah/pengganti, pelatih hanya slot miliknya, validasi tanggal — LULUS
- `TrainingSessionBackfillTest` (5) — batas 7 hari & larangan masa depan untuk pelatih (from-schedule, store, update, attendance, today), admin bebas — LULUS
- `TrainingSessionRescheduleTest` (8) — alur reschedule/cancel, validasi, hanya draft, pelatih 403, tenant lain 404, absensi sesi dipindah ditolak, ganti pelatih hanya Ketua/Admin — LULUS
- `SessionStatisticsTest` (3) — dashboard & ringkasan siswa abaikan rescheduled/cancelled; dashboard pelatih via pivot — LULUS
- `TrainingSessionRosterSyncTest` (3) — siswa aktif baru masuk roster draft tanpa mengubah baris lama; sesi selesai tidak diubah — LULUS
- Vitest: `sessions/__tests__/today-utils.test.ts` (4), `today-classes.test.tsx` (5), tambahan di `academy-dashboard-manager.test.tsx` (+1) & `academy-attendance-manager.test.tsx` (+1) — LULUS
- E2E `[mobile] Kelas Hari Ini (L4-A)` — buka Kelas Hari Ini → tap slot (from-schedule) → tandai Sakit → simpan draft, payload `sick` — LULUS

Verifikasi:
- `php artisan test` → 133 passed (639 assertions); baseline sebelum L4-A: 103
- `vendor/bin/pint --dirty` → passed (dengan `php -d opcache.enable_cli=0`, lihat catatan)
- `npm run lint` → 0 error, 6 warning `<img>` lama di luar wilayah L4-A
- `npm run typecheck` → 0 error
- `npm test` → 38 files, 145 tests passed (`--pool=threads --maxWorkers=2`, lihat catatan)
- `npm run build` → sukses
- Playwright `--workers=1`, port 3810 → 48 passed (8.0m)

Keputusan (diambil pelaksana, bisa direvisi pemilik):
1. **Pindah/Batal/Ganti Pelatih hanya Ketua/Admin** ("pelatih bila diizinkan" ditafsirkan: belum diizinkan). Pelatih yang mengirim `coach_ids`/`coach_id` ke update sesi → 403.
2. Hanya sesi **draft** yang bisa dipindah/dibatalkan (422 pada `status`). Slot "Belum dibuka" dibuat dulu lewat from-schedule sebelum dipindah/dibatalkan.
3. Sesi pengganti: `training_schedule_id = NULL` (tautan lewat `rescheduled_from_id`) agar tidak bentrok dengan unique jadwal+tanggal; pelatih disalin dari sesi asal, roster dari siswa aktif kelas.
4. Jendela pelatih (hari ini s/d 7 hari ke belakang, tidak ke depan) juga berlaku untuk `GET sessions/today`, update sesi, dan simpan absensi; pesan 403 berbahasa Indonesia. Ketua/Admin tanpa batas.
5. `from-schedule` → 201 saat membuat, 200 bila sudah ada; jadwal nonaktif hanya ditolak saat harus membuat baru. Balapan ditangani dengan menangkap `UniqueConstraintViolationException` lalu mengembalikan sesi yang ada.
6. Absensi pada sesi `rescheduled` ditolak (422) — isi di sesi pengganti. Sesi `cancelled` mengikuti perilaku lama.
7. Statistik: `month_count`, `completed_count`, `attendance_*` dashboard dan ringkasan siswa tidak menghitung rescheduled/cancelled; daftar "sesi terbaru" tetap menampilkannya.
8. Tab "Kelas Hari Ini" default di semua ukuran layar (paling sederhana; syarat HP terpenuhi). Kartu dashboard menampilkan maks. 3 slot hari ini.
9. Form manual lama berjudul "Sesi Tambahan", default tipe `extra`, hanya untuk Ketua/Admin di UI (API tetap mengizinkan pelatih dalam jendela 7 hari).
10. Test lama `test_assigned_coach_can_update_own_training_session_attendance` ditambah `travelTo('2026-05-26')` karena aturan 7 hari membuat tanggal 2026-05-25 di luar jendela; assertion tidak diubah. Test unit absensi lama mengganti teks "Buka Absensi" → "Sesi Tambahan" sesuai brief; test dashboard menambah mock `next/navigation` & `getAkademiTodaySessions` untuk kartu baru.

Catatan untuk pemilik/lead:
- **Migrasi unique di pgsql akan gagal** bila data sudah punya sesi ganda untuk (jadwal, tanggal sumber). Tidak ada data yang dihapus otomatis; cek dulu:
  `SELECT training_schedule_id, source_schedule_date, count(*) FROM training_sessions WHERE deleted_at IS NULL AND training_schedule_id IS NOT NULL GROUP BY 1,2 HAVING count(*) > 1;`
- Lingkungan: `vendor/bin/pint` gagal diam-diam (exit 255) karena opcache CLI berbagi alias phar dengan worktree lain → pakai `php -d opcache.enable_cli=0 vendor/bin/pint --dirty`. Vitest default (forks) timeout saat mesin sibuk oleh jalur lain → dijalankan `--pool=threads`. webServer Playwright (`npm run build && start`) melebihi timeout 120 s saat mesin sibuk → dijalankan dengan salinan konfigurasi di scratchpad (isi sama, timeout 900 s); `playwright.config.ts` tidak diubah.
- Checklist/log Bagian B/D dan file brief tidak disentuh (A9).
