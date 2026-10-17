# Laporan L5-C — Rapor & sertifikat UKT siap cetak (5.4)

- **Pelaksana:** Claude agent (Opus 5.5)
- **Worktree:** `.worktrees/fase5-c` · **Branch:** `fase-5-printables`
- **Tanggal:** 2026-10-17

---

Tugas: L5-C — endpoint data rapor & sertifikat, halaman cetak A4 (rapor portrait, sertifikat landscape), tautan dari detail siswa dan daftar peserta UKT.

Diubah (backend, `dojang-hub-api`):
- `app/Http/Controllers/Akademi/StudentReportController.php` (baru) — `GET /akademi/students/{student}/report?period_id=`: identitas, kelas + tempat latihan, sabuk (warna/strip), kehadiran dalam rentang periode (hadir/sakit/izin/alpa, total, persentase; sesi `rescheduled`/`cancelled` tidak dihitung), nilai per aspek + predikat, rata-rata + predikat, catatan per aspek, daftar penilai
- `app/Http/Controllers/Akademi/RankPromotionCertificateController.php` (baru) — `GET /akademi/rank-promotions/{event}/participants/{participant}/certificate`: hanya `result = passed` (lainnya 422), nomor sertifikat, akademi, siswa, event, sabuk asal/tujuan, nilai, penguji, ketua akademi
- `app/Http/Controllers/Akademi/EvaluationController.php` — `indicatorForScore` dari `private` menjadi `public static` agar dipakai ulang (batas <60/<75/<90 tidak didefinisikan ulang)
- `routes/api.php` — blok `// L5-C` (2 route GET di grup `/akademi`; middleware `subscription.writable` meloloskan GET → tetap jalan saat baca-saja)

Diubah (frontend, `dojang-hub-web`):
- `src/app/(admin)/_lib/admin-api.ts` — blok `// L5-C` di akhir: tipe `StudentReport`, `RankCertificate`, `PrintableRank`, `ScoreIndicator` + `getAkademiStudentReport`, `getAkademiRankCertificate`
- `_components/printable/printable-page.tsx` (baru) — kerangka halaman cetak bersama (kembali, tombol **"Cetak / Simpan PDF"** → `window.print()`, loading/error + coba lagi, `@page { size: A4 portrait|landscape }`, saat print hanya `.printable-doc` tampil) + hook `usePrintableData`
- `_components/printable/printable-format.ts` (baru) — tanggal panjang Indonesia, angka desimal id-ID
- `_components/printable/student-report-document.tsx`, `student-report-view.tsx` (baru) — dokumen rapor; label predikat dari `SCORE_BANDS`/`getScoreLabel` (`evaluation-types.ts`), legenda rentang dari `SCORE_BANDS`
- `_components/printable/rank-certificate-document.tsx`, `rank-certificate-view.tsx` (baru) — sertifikat landscape dengan `AcademyRankBeltBadge` (warna sabuk L4-C)
- `src/app/(admin)/academy/students/[id]/report/page.tsx`, `academy/rank-promotions/[eventId]/certificates/[participantId]/page.tsx` (baru) — tanpa `AcademyShell` (pola kwitansi L4-B)
- `_components/students/student-report-link.tsx` (baru) + `academy-student-detail-manager.tsx` (+3 baris) — kartu "Cetak Rapor Periode": pilih periode (default periode aktif) → tautan rapor
- `_components/academy-rank-promotions-manager.tsx` — kolom "Sertifikat" (tautan hanya untuk peserta lulus; semua role)
- `e2e/printables-l5c.spec.ts`, `e2e/fixtures/mock-api-printables-l5c.ts` (baru; tidak mengubah `responsive.spec.ts`/`mock-api.ts`)

Commit:
- `400d020` feat(api): printable student report endpoint per evaluation period
- `7df22cf` feat(api): UKT certificate endpoint for passed participants
- `38c6cc5` feat(web): printable A4 student report page with period picker
- `2b2f07b` feat(web): printable A4 landscape UKT certificate page
- `74ec0f2` test(e2e): student report and UKT certificate print flows
- docs: report L5-C (commit ini)

Test (Laravel — semua LULUS; RED dicek sebelum route ditambahkan):
- `StudentReportTest` (6) — isi rapor + predikat + rata-rata 82,5 → `baik`, aspek tanpa nilai, kehadiran hanya dalam periode & sesi batal tidak dihitung, pelatih boleh, tetap jalan saat baca-saja, `period_id` wajib & milik akademi (422), akademi lain 404
- `RankPromotionCertificateTest` (6) — data sertifikat lulus, ditolak 422 untuk `registered`/`failed`/`absent`, pelatih & admin boleh, tetap jalan saat baca-saja, akademi lain 404, peserta dari event lain 404

Test (Vitest — semua LULUS):
- `printable/__tests__/student-report-view.test.tsx` (5) — identitas/kehadiran/nilai/predikat (`Cukup`, `Sangat Baik`, rata-rata `82,5 Baik`)/catatan, tombol cetak → `window.print`, belum ada nilai, tanpa periode, error + coba lagi
- `printable/__tests__/rank-certificate-view.test.tsx` (3) — isi sertifikat, tombol cetak, pesan 422 tanpa tombol cetak
- `students/__tests__/student-report-link.test.tsx` (3) — default periode aktif & ganti periode mengubah href, tanpa periode, error + coba lagi
- `__tests__/academy-rank-promotions-manager.test.tsx` (+1, RED dicek) — tautan sertifikat hanya untuk peserta lulus

Test (E2E Playwright, mobile/tablet/desktop):
- detail siswa → "Cetak Rapor" → halaman rapor (tanpa scroll horizontal, mode print menyembunyikan toolbar, screenshot `e2e/__screenshots__/academy-student-report-print-*.png` dicek) — LULUS
- daftar peserta UKT → "Sertifikat" → halaman sertifikat (screenshot `academy-rank-certificate-print-*.png` dicek) — LULUS
- sertifikat peserta tidak lulus → pesan server, tanpa tombol cetak — LULUS

Verifikasi (berurutan):
- `php artisan test` → 275 passed (1266 assertions)
- `php -d opcache.enable_cli=0 vendor/bin/pint --dirty` → passed
- `npm run lint` → 0 error, 6 warning (lama, `<img>`)
- `npm run typecheck` → 0 error
- `npx vitest run --pool=threads` → 70 file, 300 test passed
- `npm run build` → sukses (rute `/academy/students/[id]/report`, `/academy/rank-promotions/[eventId]/certificates/[participantId]`)
- `PLAYWRIGHT_PORT=3930 npx playwright test --workers=1` → 96 passed, 24 skipped (alur khusus HP di tablet/desktop), 0 failed (7.5m)

## Keputusan
1. **Predikat**: backend memakai `EvaluationController::indicatorForScore` (dijadikan `public static`). Predikat rata-rata = `indicatorForScore(floor(rata-rata))`, sehingga sama dengan `SCORE_BANDS` frontend untuk nilai desimal (mis. 59,5 → Kurang, 74,9 → Cukup). Label yang **ditampilkan** selalu dari `getScoreLabel` (`SCORE_BANDS`); kunci `indicator` di API hanya pelengkap.
2. **Rata-rata** = rata-rata semua nilai aspek siswa pada periode itu, dibulatkan 1 desimal; `null` bila belum ada nilai. Aspek nonaktif yang tidak dinilai tidak ditampilkan; aspek aktif tanpa nilai tampil dengan "-".
3. **Kehadiran periode** = absensi siswa pada sesi dengan `session_date` di antara `starts_at`–`ends_at` periode; status sesi `rescheduled`/`cancelled` dikecualikan (sama dengan statistik L4-A). Persentase = hadir / total (sakit & izin tidak dihitung hadir).
4. **Catatan pelatih** = kolom `notes` per aspek dari `student_evaluation_scores` (tidak ada tabel catatan rapor terpisah; tanpa migrasi). Penanda tangan rapor = nama penilai unik; kolom tanda tangan orang tua/wali dikosongkan.
5. **Nomor sertifikat** deterministik tanpa kolom baru: `UKT/{tahun event}/{id event 4 digit}/{id peserta 4 digit}` — unik global, stabil saat dicetak ulang.
6. **Akses**: rapor & sertifikat untuk Ketua/Admin/Pelatih akademi yang sama (rapor sesuai brief; sertifikat mengikuti `GET rank-promotions/{event}` yang sudah terbuka untuk semua role akademi). Tenant lain / peserta di event lain → 404; `period_id` akademi lain → 422 (validasi `exists` ter-scope). Keduanya GET sehingga tetap tersedia saat baca-saja (diuji).
7. **Penanda tangan sertifikat**: penguji (`assessed_by`) + "Ketua Akademi" = user `ketua_akademi` pertama di akademi (kosong → "-").
8. **Halaman cetak tanpa `AcademyShell`** (pola L4-B); kerangka `PrintablePage` dipakai bersama rapor & sertifikat. Kwitansi L4-B **tidak** diubah agar tidak menyentuh kode jalur lain (bisa dipindah ke `PrintablePage` nanti).
9. Tautan "Cetak Rapor" tampil untuk semua role di detail siswa (pelatih boleh rapor); default periode = periode `active`, selain itu periode terbaru.

## Belum dikerjakan / catatan untuk lead
- Logo akademi (`logo_url`) dikirim API tetapi belum ditampilkan di dokumen (tidak diminta; `<img>` memicu warning lint `no-img-element`).
- Checklist Bagian B/D `PLAN-2026-10.md` tidak diubah (menghindari konflik antarjalur).
- Konflik merge yang mungkin: blok `// L5-C` di `routes/api.php` dan ekor `admin-api.ts` (jalur L5 lain juga menambah blok di sana); `EvaluationController` hanya 2 baris berubah.
