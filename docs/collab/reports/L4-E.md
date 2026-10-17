# Laporan Tugas L4-E — Data siswa & penilaian (4.5, 4.6)

- **Pelaksana:** Claude
- **Worktree:** `.worktrees/fase4-e` · **Branch:** `fase-4-students` (basis `29eb244`)
- **Tanggal:** 2026-10-17

---

Tugas: L4-E — Validasi kontak/wali siswa, fisik opsional, nomor anggota per akademi, salin variabel penilaian

Diubah (API — `dojang-hub-api`):
- `app/Http/Controllers/Akademi/StudentController.php`: aturan kontak dijalankan lewat `Validator::after`. Wajib minimal satu dari `student_phone`/`guardian_phone`. Bila usia < 17 (`GUARDIAN_REQUIRED_UNDER_AGE`), `guardian_name` dan `guardian_phone` wajib. Pada update, aturan dicek terhadap record gabungan, dan hanya bila request menyentuh `birth_date`, telepon, atau wali. `height_cm`/`weight_kg` sekarang opsional.
- `StudentController` (nomor anggota): `nextMemberNumber(Akademi)` = sufiks numerik tertinggi untuk prefix milik akademi itu sendiri (termasuk siswa soft-deleted) + 1. `createWithMemberNumber` membuat siswa beserta riwayat sabuk dalam `DB::transaction` dan mencoba ulang hingga 5× bila terjadi `UniqueConstraintViolationException`. Nomor manual yang bentrok → 422 `member_number`. Nomor lama tidak diubah.
- `database/migrations/2026_10_18_000001_make_student_physical_fields_nullable.php` (baru, aditif): `height_cm`, `weight_kg` → nullable (`->change()`, berjalan di sqlite & pgsql). `down()` sengaja no-op (lihat Keputusan).
- `app/Http/Controllers/Akademi/EvaluationController.php`: `copyAspects` → `POST /akademi/evaluations/periods/{period}/aspects/copy-from/{source}` (Ketua/Admin). Kedua periode wajib milik akademi user (404 bila bukan). Sumber = target → 422. Nama yang sudah ada di target dilewati (tanpa beda huruf besar/kecil). Urutan ditambahkan setelah `sort_order` tertinggi di target. Respons 201 `{ data: aspek target, copied_count }`.
- `routes/api.php`: 1 route dalam blok `// L4-E`.
- Fixture test diperbarui ke data valid (aturan tidak dilonggarkan): payload siswa di `StudentQuotaTest`, `SportRankTenantTest`, `StudentRankHistoryTest` kini berisi nama + nomor wali. `DemoAkademiSeeder` sudah valid (semua siswa demo < 17 tahun dan punya wali + nomor wali), tidak diubah; ada test yang memverifikasinya.

Diubah (Web — `dojang-hub-web`):
- `_lib/admin-api.ts`: `height_cm`/`weight_kg` di tipe `Student` dan payload create/update kini `| null`. Fungsi `copyAkademiEvaluationAspects` ditambahkan di blok `// L4-E` di akhir file.
- `students/student-form-model.ts`: `GUARDIAN_REQUIRED_UNDER_AGE` (=17, sama dengan API), `ageOnDate`, `isGuardianRequired`, `validateStudentForm`. Payload mengirim fisik kosong sebagai `null`.
- `students/student-form-sections.tsx`: tinggi/berat diberi hint "Opsional" (tidak `required`). Nomor siswa/wali diberi hint "Minimal satu…". Nama & nomor wali otomatis ditandai wajib (`*` + `required`) saat tanggal lahir < 17 tahun. Error tampil inline (`aria-invalid`).
- `academy-student-form-manager.tsx`: validasi sebelum kirim, dengan banner "Periksa kembali…" + error per field. `loadError` dipisah dari error simpan, karena sebelumnya error simpan bisa mengganti seluruh form bila daftar kelas kosong.
- `students/format.ts` (`physicalSummary`), `student-columns.tsx`, `student-profile-card.tsx`: data fisik kosong tampil "-".
- `evaluation/evaluation-copy-aspects-modal.tsx` (baru, 99 baris): `SheetModal` untuk memilih periode sumber. Default = periode terbaru yang mulai sebelum periode target dan punya variabel; hanya periode yang punya variabel yang ditawarkan.
- `evaluation/evaluation-aspect-columns.tsx` (baru): kolom variabel diekstrak agar `evaluation-settings-view.tsx` turun dari 398 → 377 baris setelah tombol "Salin dari periode sebelumnya" ditambahkan.
- `evaluation/evaluation-handlers.ts` (`submitCopyAspects`), `use-evaluation-data.ts` (`handleCopyAspects`), `academy-evaluations-manager.tsx` (prop baru).
- `e2e/fixtures/mock-api-l4e.ts` (baru) + `e2e/students-evaluation-l4e.spec.ts` (baru). File terpisah agar tidak bentrok dengan `responsive.spec.ts`/`mock-api.ts`. Pola guard Vitest ditiru dari `responsive.spec.ts`.

Commit:
- `f330a56` feat(api): require student contact and guardian for minors
- `b11813d` fix(api): per-akademi collision-safe student member numbers
- `f900f0e` feat(api): copy evaluation aspects from another period
- `efe38bf` feat(web): copy evaluation aspects from a previous period
- `c6d6236` feat(web): student form follows contact and guardian rules
- `e82fb65` fix(api): keep physical fields nullable on rollback
- `42139d5` test(e2e): mobile student form rules and copying evaluation aspects

Test (semua LULUS; test baru API terbukti GAGAL dulu terhadap controller lama: 15 dari 18 gagal):
- `tests/Feature/StudentContactValidationTest.php` — 12: kontak minimal satu, dewasa hanya nomor siswa/wali, wali wajib < 17, batas tepat 17 tahun, fisik opsional + tetap divalidasi bila diisi, update hapus wali ditolak, update tanggal lahir jadi anak, update parsial tanpa field kontak tidak memblokir siswa lama, update menyentuh kontak divalidasi atas record gabungan, siswa seeder demo valid
- `tests/Feature/StudentMemberNumberTest.php` — 6: per akademi dengan slug mirip (`garuda-sakti` & `garuda-jaya` → keduanya `GARUDA-0001`), soft-deleted tidak dipakai ulang, mengikuti sufiks tertinggi, nomor lama tidak berubah, retry saat bentrok insert bersamaan (disimulasikan lewat event `creating`), nomor manual unik per akademi
- `tests/Feature/EvaluationAspectCopyTest.php` — 7: salin sukses, lewati duplikat + urutan, abaikan aspek terhapus, sumber = target 422, pelatih 403, sumber akademi lain 404, target akademi lain 404
- Vitest: `evaluation-copy-aspects-modal.test.tsx` (6), `student-form-model.test.ts` (+7), `academy-student-form-manager.test.tsx` (+2, 1 diperbarui ke data wali valid), `format.test.ts` (2)
- Playwright [mobile]: form siswa (pesan kontak → tanggal lahir anak → wali wajib → payload fisik `null` → kembali ke daftar), tanpa scroll horizontal 375px, salin variabel dari periode sebelumnya

Verifikasi:
- `php artisan test` → 128 passed (622 assertions)
- `vendor/bin/pint --dirty` → passed. Catatan: `pint --test` penuh menandai 5 file lama yang tidak disentuh jalur ini.
- `npm run lint` → 0 error, 6 warning (lama, `no-img-element`)
- `npm run typecheck` → 0 error
- `npm test` → 51 file, 190 test lulus
- `npm run build` → sukses
- `PLAYWRIGHT_PORT=3850 npx playwright test --workers=1` → run penuh: 63 passed, 14 skipped, 1 failed. Yang gagal adalah test L4-E sendiri: ekspektasi hint "Wajib untuk siswa…", padahal setelah submit pertama hint memang diganti pesan error inline. Asersi diperbaiki, lalu `students-evaluation-l4e.spec.ts --project=mobile` diulang → 3 passed. Suite penuh tidak diulang setelah perbaikan itu karena satu run memakan ±15 menit.
- Review kode (agent code-reviewer): tidak ada CRITICAL/HIGH. MEDIUM `down()` migrasi diperbaiki (`e82fb65`).

Keputusan (tidak tercakup brief; dipilih yang paling sederhana):
1. **Update parsial:** aturan kontak/wali hanya dicek bila request menyentuh `birth_date`/`student_phone`/`guardian_name`/`guardian_phone`, dan dicek terhadap record gabungan. Dengan begitu siswa lama tanpa telepon tetap bisa diubah status/sabuknya. Form web selalu mengirim semua field, jadi setiap edit lewat form tetap ditegakkan.
2. **Pesan kontak** dipasang di key `student_phone`.
3. **Usia** dihitung terhadap tanggal hari ini (server). Tepat 17 tahun = dewasa.
4. **Nomor anggota:** prefix tetap 6 huruf pertama slug (format lama `GARUDA-0001`), tetapi dihitung per akademi dari sufiks tertinggi, bukan `count()`. Ini menghindari bentrok dengan nomor manual berpola sama. Maksimal 5 percobaan, setelah itu 422 "Nomor anggota sudah dipakai. Silakan coba simpan lagi."
5. **Salin variabel:** variabel bernama sama di target dilewati (tidak ditimpa). Status aktif/nonaktif dan deskripsi ikut disalin. Penyalinan diizinkan juga ke periode yang ditutup, konsisten dengan `storeAspect`. Hanya Ketua/Admin.
6. **Migrasi `down()` no-op:** mengembalikan NOT NULL akan gagal (atau harus mengarang data) bila sudah ada siswa tanpa tinggi/berat.

Catatan untuk lead:
- Vitest memungut `e2e/*.spec.ts`. Spec baru meniru guard `process.env.VITEST` dari `responsive.spec.ts`. Usul: `exclude: ['e2e/**']` di `vitest.config.ts` (file bersama, tidak saya ubah).
- Konflik merge yang diperkirakan: hanya blok `// L4-E` di `routes/api.php` dan ekor `admin-api.ts`. Perubahan tipe `height_cm`/`weight_kg` di `admin-api.ts` ada di tengah file (3 baris tipe).
- Risiko kecil (dari review, LOW): dua penyalinan bersamaan ke periode yang sama bisa menghasilkan nama ganda, karena tidak ada unique `(period, name)`.
