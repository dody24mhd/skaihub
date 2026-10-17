# Laporan Tugas L3-C — Siswa & SPP mobile-first (3.3–3.7, sisa 3.9)

- **Pelaksana:** Claude (melanjutkan dari Gemini-5; tidak ada perubahan setengah jadi yang ditinggalkan)
- **Worktree:** `.worktrees/fase3-c` · **Branch:** `fase-3-students-spp`
- **Tanggal:** 2026-10-17

---

Tugas: L3-C — Siswa & SPP mobile-first + section Riwayat Sabuk/Prestasi + generate tagihan SPP

Diubah:
- `src/app/(admin)/_components/academy-students-manager.tsx` — daftar siswa memakai `ResponsiveList` (kartu: nama, kelas, sabuk, status; foto & fisik hanya di tabel), `PageHeader`, toolbar filter 375px, paginasi 44px, tombol "Coba lagi" saat gagal memuat
- `src/app/(admin)/_components/academy-student-form-manager.tsx` — form satu kolom di HP lewat `FormField`, `inputMode` tel/numeric/decimal, tiga grup field, bar simpan sticky di atas bottom nav
- `src/app/(admin)/_components/academy-student-detail-manager.tsx` — section bertumpuk di HP, ditambah section **Prestasi** dan **Riwayat Sabuk**, tombol "Edit Siswa" untuk ketua/admin
- `src/app/(admin)/_components/academy-spp-manager.tsx` — tagihan per kelas memakai `ResponsiveList` (kartu: nama, periode, tagihan, terbayar, **sisa**, status), modal bayar memakai `SheetModal`, tombol **Buat Tagihan Bulan Ini** (ketua/admin)
- `src/app/(admin)/_components/students/*` (baru) — `student-columns`, `student-list-toolbar`, `list-pagination`, `student-status`, `student-form-model`, `student-form-sections`, `student-profile-card`, `student-recent-history`, `detail-section-card`, `use-student-list`, `student-rank-history-section`, `student-achievements-section`, `achievement-form`, `achievement-form-modal`, `format`
- `src/app/(admin)/_components/spp/*` (baru) — `spp-summary` (rekap yang sebelumnya terduplikasi), `spp-bill-columns`, `spp-class-summary-list`, `spp-payment-modal`, `spp-generate`, `spp-generate-modal`
- `src/app/(admin)/_lib/admin-api.ts` — blok `// L3-C` di akhir file: tipe `StudentRankHistory`, `StudentAchievement`, `StudentAchievementPayload`; fungsi `getAkademiStudentRankHistories`, `getAkademiStudentAchievements`, `create/update/deleteAkademiStudentAchievement`. `generateAkademiSppBills` sudah ada sebelumnya dan kini dipakai
- `e2e/responsive.spec.ts` — 4 rute ditambahkan ke `ACADEMY_ROUTES` + 4 alur khusus `mobile`
- `e2e/fixtures/mock-api-students-spp.ts` (baru) — fixture L3-C, didaftarkan setelah `setupMockApi` (rute Playwright yang didaftarkan belakangan dicocokkan lebih dulu; sisanya diteruskan dengan `route.fallback()`)

File yang dipecah (baris sebelum → sesudah):

| File | Sebelum | Sesudah |
|---|---|---|
| `academy-students-manager.tsx` | 295 | 222 |
| `academy-student-form-manager.tsx` | 347 | 177 |
| `academy-student-detail-manager.tsx` | 290 | 92 |
| `academy-spp-manager.tsx` | 460 | 245 (termasuk fitur generate baru) |
| `_lib/admin-api.ts` | 1983 | 2060 (hanya blok `// L3-C`) |

Komponen baru terbesar: `student-achievements-section.tsx` 155 baris, `spp-generate-modal.tsx` 137 baris. Semuanya di bawah 400.

Commit:
- `8fdf9de` feat(web): mobile-first students list
- `8c6afa3` feat(web): mobile-first student form
- `d728eef` feat(web): mobile-first student detail with rank history and achievements
- `991b45a` feat(web): mobile-first SPP bills
- `6e54881` feat(web): generate monthly SPP bills from SPP page
- `f6e9202` fix(web): keep student row actions on one line on desktop
- `b13d5fe` test(e2e): responsive routes and mobile flows for students and SPP

Test (unit, Vitest — semuanya LULUS):
- `students/__tests__/student-columns.test.tsx` — 4
- `students/__tests__/academy-students-manager.test.tsx` — 3 (filter status dikirim ke API, role pelatih, coba lagi)
- `students/__tests__/student-form-model.test.ts` — 2
- `students/__tests__/academy-student-form-manager.test.tsx` — 3 (inputMode, payload create, akses pelatih ditolak)
- `students/__tests__/achievement-form.test.ts` — 3
- `students/__tests__/student-rank-history-section.test.tsx` — 3
- `students/__tests__/student-achievements-section.test.tsx` — 4 (read-only pelatih, tambah/edit di SheetModal, hapus)
- `spp/__tests__/spp-summary.test.ts` — 3
- `spp/__tests__/spp-bill-columns.test.tsx` — 3
- `spp/__tests__/spp-payment-modal.test.tsx` — 3
- `spp/__tests__/spp-generate.test.ts` — 3
- `spp/__tests__/spp-generate-modal.test.tsx` — 4 (default bulan/tahun, nominal wajib, nominal opsional per kelas, payload + ringkasan)

Test (E2E, Playwright):
- Responsive `/academy`, `/academy/students`, `/academy/students/new`, `/academy/students/1`, `/academy/spp` × mobile/tablet/desktop — LULUS
- [mobile] daftar siswa kartu + filter → request `status=alumni` — LULUS
- [mobile] detail siswa: Riwayat Sabuk, Prestasi, SheetModal tambah prestasi — LULUS
- [mobile] buat tagihan SPP: validasi nominal default, payload `{default_amount:125000, class_id:null}`, ringkasan hasil, tanpa scroll horizontal — LULUS
- [mobile] modal bayar SheetModal: nominal default = sisa, tutup dengan Esc — LULUS

Verifikasi:
- `npm run lint` → 0 error, 13 warning (sudah ada sebelumnya, `no-img-element` di file lain)
- `npm run typecheck` → 0 error
- `npm test` → 32 file, 125 test lulus
- `npm run build` → sukses
- `PLAYWRIGHT_PORT=3400 npx playwright test --workers=1` → 19 lulus, 8 dilewati (alur khusus HP di-skip di tablet/desktop), 0 gagal. Catatan: `webServer` di config menjalankan `npm run build && npm run start` dengan timeout 120 detik, padahal build di mesin ini ±3 menit sehingga run pertama timeout. E2E dijalankan dengan config sementara (tidak di-commit) yang meng-extend `playwright.config.ts` dan hanya menjalankan `npm run start` di atas build yang sudah ada. Commit `f6e9202` (satu class Tailwind `md:flex-nowrap`) dibuat setelah run E2E; unit test diulang dan lulus.
- Screenshot `e2e/__screenshots__/academy-students-*`, `academy-spp-*` dicek: kartu di 375px, tabel tetap di desktop.

Perubahan perilaku kecil yang disengaja (bukan perubahan data):
- Detail siswa sekarang juga memanggil `GET /akademi/me` untuk menentukan hak tulis prestasi.
- Label status detail siswa memakai label Indonesia (sebelumnya `inactive`/`alumni` tampil mentah). Label absensi `sick` → "Sakit" sudah disiapkan.
- Input berat badan diberi `step="0.1"` (sebelumnya browser menolak desimal).
- Error bayar/upload kini tampil di dalam modal, bukan di halaman di belakangnya.
- Tombol "Lihat Tabel" di SPP menjadi "Lihat Tagihan" (di HP isinya kartu).
- Nomor telepon siswa/wali di detail menjadi tautan `tel:`.

Catatan/keputusan yang perlu pemilik project:
1. **Timeout `webServer` Playwright (120 detik)** terlalu pendek untuk `build && start` di mesin ini. Usul: naikkan `timeout` atau pisahkan build dari `webServer` (file milik L3-A, tidak saya ubah).
2. **Konflik merge yang diperkirakan:** `ACADEMY_ROUTES` di `e2e/responsive.spec.ts` dan ekor `admin-api.ts` (blok `// L3-B` vs `// L3-C`) — keduanya tinggal digabung. Di main, locator sidebar sudah `aside:not([aria-label*='Ringkasan'])`; halaman L3-C tidak memakai `<aside>`, jadi aman. Fixture L3-C sengaja dipisah ke `mock-api-students-spp.ts` agar tidak bentrok dengan `mock-api.ts` di main yang sudah banyak berubah.
3. Brief menyebut "generate tagihan tetap jalan", padahal sebelumnya tidak ada UI generate. UI-nya ditambahkan sesuai instruksi koordinator (commit terpisah). Nominal default diwajibkan bila kelas target (atau salah satu kelas, jika "Semua kelas") belum punya `spp_amount_override`. Siswa tanpa kelas tidak bisa dideteksi dari frontend; mereka akan muncul di hitungan "dilewati karena nominal kosong".
