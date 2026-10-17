# Laporan Tugas L4-C — Sistem tingkatan per akademi (4.3)

- **Pelaksana:** Claude (agen)
- **Worktree:** `.worktrees/fase4-c` · **Branch:** `fase-4-ranks` (basis `6ad22f4`)
- **Tanggal:** 2026-10-17

---

Tugas: L4-C — Sistem tingkatan per akademi (Kukkiwon / FORKI / KKI)

Diubah:
- `docs/RANK-SYSTEMS.md` — hasil riset + tabel per sistem + URL sumber; baris lemah ditandai "PERLU KONFIRMASI PEMILIK"
- `dojang-hub-api/app/Enums/RankSystem.php` — enum `taekwondo_kukkiwon | karate_forki | karate_kki`, default per cabang olahraga (null untuk cabang tanpa katalog)
- `dojang-hub-api/database/migrations/2026_10_17_300001_add_rank_system_columns.php` — `akademi.rank_system` (nullable), `sport_ranks.rank_system/level_type/level_number/belt_color/stripe_color` + index; backfill baris lama (id tidak berubah → FK siswa aman)
- `dojang-hub-api/app/Models/Akademi.php`, `SportRank.php` — isi otomatis `rank_system`, scope `visibleTo(akademi)` (sistem + cabang + global/milik sendiri), konstanta warna & level
- `dojang-hub-api/database/seeders/RankCatalogSeeder.php` — katalog global 60 sabuk (Kukkiwon 23, FORKI 20, KKI 17), idempoten, memetakan kode demo lama (`white`… `black`) ke kode katalog di tempat
- `dojang-hub-api/database/seeders/DatabaseSeeder.php`, `DemoAkademiSeeder.php` — memanggil katalog; siswa demo memakai kode Kukkiwon; peserta UKT demo naik ke tingkat berikutnya per `sequence`
- `dojang-hub-api/app/Http/Controllers/SuperAdmin/AkademiController.php` — `rank_system` saat buat/ubah akademi, validasi cocok dengan cabang; ganti sistem ditolak bila ada siswa bersabuk
- `dojang-hub-api/app/Http/Controllers/Akademi/SportRankController.php` — index per sistem akademi (urut `sequence`, Poom sebelum Dan); sabuk tambahan mewarisi sistem akademi, boleh berisi warna/level
- `dojang-hub-api/app/Http/Controllers/Akademi/RankPromotionController.php` — sabuk tujuan wajib dari sistem akademi & lebih tinggi; loncat tingkat diterima dengan `warnings`
- `dojang-hub-api/app/Http/Controllers/Akademi/StudentController.php` — validasi `current_rank_id` ikut sistem tingkatan (perubahan 4 baris; L4-E juga menyentuh file ini)
- `dojang-hub-web/src/app/(admin)/_lib/rank-systems.ts` — label/opsi sistem (sama dengan enum API)
- `dojang-hub-web/src/app/(admin)/_lib/admin-api.ts` — tipe `SportRank` (+sistem, level, warna), `rank_system` pada akademi, `warnings` pada respons peserta UKT (edit tipe di tempat; tidak ada fungsi baru)
- `dojang-hub-web/src/app/(admin)/_components/akademi/rank-system-select.tsx` + `admin-akademi-manager.tsx` — pilihan sistem di form buat/ubah, label di detail (manager hanya +28 baris karena komponen diekstrak)
- `dojang-hub-web/src/app/(admin)/_components/belt-colors.ts`, `academy-rank-belt-badge.tsx` — satu sumber warna sabuk; badge membaca `belt_color` + `stripe_color` (fallback kode lama)
- `dojang-hub-web/src/app/(admin)/_components/academy-ranks-manager.tsx`, `evaluation/rank-list.tsx`, `evaluation/rank-form.tsx` — sabuk bawaan terkunci "Bawaan Kukkiwon/FORKI/KKI", "Tambahan akademi", urutan terlihat, pemilih warna sabuk & strip
- `dojang-hub-web/src/app/(admin)/_components/evaluation/rank-progression.ts`, `rank-target-field.tsx`, `use-rank-promotions.ts`, `rank-promotion-aside.tsx`, `rank-promotion-modals.tsx`, `academy-rank-promotions-manager.tsx` — UKT: default 1 tingkat di atas, hanya sabuk lebih tinggi, peringatan loncat tidak memblokir
- `dojang-hub-web/e2e/fixtures/mock-api.ts` — fixture sabuk jadi katalog Kukkiwon + 1 sabuk akademi; `e2e/ranks.spec.ts` (baru) — E2E ranks mobile

Test:
- `tests/Feature/AkademiRankSystemTest.php` (7) — kolom, default dari cabang, pilih KKI, validasi sistem/cabang, ganti sistem diblok bila ada siswa bersabuk, derivasi `rank_system`, cabang tanpa katalog — LULUS
- `tests/Feature/RankCatalogSeederTest.php` (4) — jumlah per sistem, idempoten (id sama), remap kode lama tanpa memutus FK siswa, DatabaseSeeder + demo — LULUS
- `tests/Feature/SportRankSystemFilterTest.php` (6) — filter FORKI/KKI, sabuk tambahan, warna tidak valid 422, isolasi tenant, sabuk sistem lain 404, siswa tidak bisa memakai sabuk sistem lain — LULUS
- `tests/Feature/RankPromotionSequenceTest.php` (10) — tingkat berikutnya, harus lebih tinggi, loncat → `warnings`, Poom/Dan setara, sabuk tambahan dihitung, sistem lain ditolak, update `to_rank_id`, sabuk akademi lain ditolak, pelatih 403 — LULUS
- Vitest: `rank-systems.test.ts`, `rank-system-select.test.tsx`, `rank-progression.test.ts`, `rank-target-field.test.tsx`, `academy-ranks-manager.test.tsx` (+1 test bawaan terkunci) — LULUS
- Playwright `e2e/ranks.spec.ts` (mobile) — lihat Verifikasi

Perubahan test lama (dengan alasan):
- `academy-ranks-manager.test.tsx`: jumlah teks "Putih"/"Kuning" 3 → 4 (form kini punya opsi warna strip), dan tombol Edit dicari dengan nama "Edit Putih" (tombol kini punya `aria-label` per sabuk agar bisa dibedakan pembaca layar).

Verifikasi (berurutan):
- `php artisan test` → 130 passed (623 assertions)
- `vendor/bin/pint --dirty` → passed
- `npm run lint` → 0 error, 6 warning (lama, `<img>`)
- `npm run typecheck` → 0 error
- `npm test` → 41 file, 148 test passed
- `npm run build` → sukses
- `PLAYWRIGHT_PORT=3830 npx playwright test --workers=1` → 46 passed, 2 skipped (`ranks.spec.ts` khusus mobile dilewati di tablet/desktop), 0 failed (7.4m). Run pertama: spec baru gagal karena `.first()` menunjuk sel tabel desktop yang tersembunyi di HP → locator diganti `:visible`, lalu seluruh suite dijalankan ulang.

Catatan lingkungan: mesin sangat lambat saat semua jalur paralel (satu file Vitest ±100 dtk; pool `forks` kadang timeout saat start worker, `--pool=threads` dipakai untuk run tunggal). `npm run build && npm run start` melebihi `webServer.timeout` 120 dtk dua kali, sehingga E2E dijalankan dengan config sementara (tidak di-commit) yang mewarisi `playwright.config.ts` dan hanya menaikkan `timeout` ke 900 dtk.

## Keputusan
1. **UKT tidak memblokir loncat tingkat (keputusan pemilik, menggantikan brief).** Satu-satunya aturan yang memblokir: sabuk tujuan harus beda & lebih tinggi (`sequence`). Loncat tingkat diterima; API mengembalikan `warnings` ("Melewati N tingkat dari X ke Y.") dan UI menampilkannya sebagai catatan + menambahkannya ke pesan sukses. Tidak ada flag `allow_skip`, tidak ada cek kehadiran/masa tunggu.
2. **`sequence` berjarak 10** (Geup/Kyu n = (11−n)×10; Dan/Poom n = 100+n×10) agar akademi bisa menyisipkan sabuk sendiri. **Poom n = Dan n** (sequence sama): Geup 1 → Poom 1 atau Dan 1 dihitung satu tingkat; konversi Poom→Dan bukan UKT (ubah sabuk siswa manual). Default UI: Poom bila usia < 15, selain itu Dan.
3. "Jumlah tingkat dilompati" = jumlah nilai `sequence` berbeda di antara asal & tujuan (termasuk sabuk tambahan akademi).
4. Siswa tanpa sabuk: semua sabuk boleh dipilih tanpa peringatan.
5. **Cabang tanpa katalog** (judo, silat, dll. yang sudah ada di form): `rank_system` = null, akademi hanya melihat sabuk cabangnya sendiri (perilaku lama).
6. Kolom tambahan `belt_color`/`stripe_color` (di luar brief) agar badge warna tidak bergantung pada kode/label.
7. Ganti sistem tingkatan ditolak (422) bila sudah ada siswa yang memiliki sabuk, agar data tidak tercampur.
8. Katalog FORKI ditanam sebagai urutan umum 10 kyu karena FORKI adalah federasi payung tanpa satu standar sabuk yang ditemukan.
9. Migrasi `2026_10_17_300001` diedit sekali di branch ini (default → nullable) sebelum pernah di-merge/dijalankan di luar test; bukan migrasi lama.

## Catatan/keputusan yang perlu pemilik project
- **PERLU KONFIRMASI PEMILIK** (detail di `docs/RANK-SYSTEMS.md`):
  - Kukkiwon Geup 9–1: dua varian warna/strip di sumber Indonesia; yang ditanam = Varian A (Geup 9 Kuning, 8 Kuning strip hijau, 7 Hijau, 6 Hijau strip biru, 5 Biru, 4 Biru strip merah, 3 Merah, 2 Merah strip hitam 1, 1 Merah strip hitam 2). Geup 10, Poom 1–4, Dan 1–9 konsisten.
  - FORKI: seluruh tabel (Kyu 10 Putih, 9–8 Kuning, 7–6 Oranye, 5–4 Hijau, 3–2 Biru, 1 Coklat, Dan 1–10).
  - KKI: Kyu 4–1 (biru strip/biru, coklat strip/coklat vs "muda/tua") dan batas atas Dan (ditanam Dan 1–10). Kyu 7 Putih, 6 Kuning, 5 Hijau konsisten.
- Tidak ada dokumen resmi PBTI/FORKI/KKI yang bisa diakses daring; semua sumber sekunder.
- File bersama yang diubah: `admin-api.ts` (tipe saja), `e2e/fixtures/mock-api.ts` (`MOCK_SPORT_RANKS`), `StudentController.php` (L4-E) → kemungkinan konflik merge kecil.
- Setelah merge, jalankan `php artisan migrate` lalu `php artisan db:seed --class=RankCatalogSeeder` di lingkungan yang sudah berisi data (seeder memetakan kode demo lama di tempat).
