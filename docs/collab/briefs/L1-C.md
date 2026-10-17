# Brief L1-C — Skema MVP (D1, D3–D7)

- **Pelaksana:** Gemini-1 · **Worktree:** `.worktrees/fase1` · **Branch:** `fase-1-backend`
- **Boleh diubah:** `dojang-hub-api/**`, `SCHEMA.md` (root, khusus C6), `docs/collab/reports/L1-C.md`
- **Dilarang:** `dojang-hub-web/**`, migrasi lama, dependensi baru, `migrate:fresh` pada database pgsql lokal.
- Dasar: `docs/AUDIT-2026-10.md` §1 dan §5. Patuhi `docs/PLAN-2026-10.md` Bagian A.
- Semua migrasi **baru & aditif**, wajib jalan di sqlite (test) **dan** pgsql. Untuk perubahan CHECK/enum gunakan cabang `DB::getDriverName()`; `down()` harus benar. Satu commit per butir; setiap butir punya feature test.

## C1 — Status absensi `sick` (D3)
- Izinkan `sick` di `training_attendances.status` (pgsql: ganti CHECK constraint; sqlite: `->change()` ke string).
- Validasi di `TrainingSessionController` (±152, ±156) menerima `sick`. Statistik kehadiran (`DashboardController`, `StudentController`) memperlakukan `sick` seperti `excused` (bukan hadir, bukan alpa) — sebutkan di laporan bila ada tempat lain.
- Test: simpan absensi `sick` → 200 dan terbaca kembali.

## C2 — `spp_payments.akademi_id` (D4)
- Kolom nullable + backfill dari `spp_bills.akademi_id` (query portabel) + FK + index `(akademi_id, paid_at)`.
- `SppBillController@pay` mengisi `akademi_id`. Model `SppPayment` `$fillable` diperbarui.
- Test: pembayaran baru memiliki `akademi_id` yang benar.

## C3 — `student_rank_histories` (D5)
- Tabel: `id`, `akademi_id` (FK, index), `student_id` (FK cascade), `sport_rank_id` (FK), `achieved_on` date, `source_type` string(30) default `manual` (`manual` | `promotion_event`), `rank_promotion_participant_id` nullable FK nullOnDelete, `notes` text nullable, `changed_by` FK users nullOnDelete, timestamps; index `(student_id, achieved_on)`.
- Tulis baris saat `current_rank_id` siswa berubah lewat `StudentController@update`/`store` (bila ada rank) dan saat peserta UKT lulus (`RankPromotionController` ±161).
- Endpoint baca: `GET /akademi/students/{student}/rank-histories` (urut terbaru), tenant-scoped; detail siswa (`show`) boleh menyertakan riwayat.
- Test: ubah sabuk manual → 1 baris; peserta UKT lulus → baris `promotion_event`; akademi lain → 404.

## C4 — `student_achievements` (D6)
- Tabel: `id`, `akademi_id` (FK, index), `student_id` (FK cascade), `title` string(255), `event_name` nullable, `achieved_on` date nullable, `result_label` string(100) nullable, `notes` text nullable, timestamps, softDeletes; index `(akademi_id, student_id)`.
- Endpoint: `GET|POST /akademi/students/{student}/achievements`, `PUT|DELETE /akademi/students/{student}/achievements/{achievement}`. Tulis: Ketua & Admin; baca: + Pelatih. Validasi panjang field, scope tenant, achievement harus milik student tsb.
- Test: CRUD sukses; pelatih POST → 403; tenant lain → 404; achievement siswa lain → 404.

## C5 — Index performa (D7)
- Satu migrasi: `training_attendances(student_id)`, `spp_payments(spp_bill_id)`, `students(akademi_id, status)`, `users(akademi_id, role)`, `classes(akademi_id)` — lewati yang sudah ada.

## C6 — Sinkronisasi SCHEMA.md (D1)
- Perbarui `SCHEMA.md` agar mencerminkan skema aktual untuk semua baris "Ubah dokumen" di AUDIT §1, tambahkan tabel pemetaan nama (target lama → aktual), dan tandai yang ditunda (D2). Jangan mengubah PRD.md.

## Verifikasi akhir
```
cd dojang-hub-api
php artisan test
vendor/bin/pint --dirty
```
Tulis `docs/collab/reports/L1-C.md` (A7), commit `docs: report L1-C`. Berhenti.
