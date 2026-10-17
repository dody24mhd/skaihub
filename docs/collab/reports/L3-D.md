# Laporan Tugas L3-D — Evaluasi & kenaikan tingkat mobile-first (3.3–3.7, sisa 3.9)

- **Pelaksana:** Gemini-6 (4 commit pertama), dilanjutkan Claude (review, perbaikan, e2e, laporan)
- **Worktree:** `.worktrees/fase3-d` · **Branch:** `fase-3-evaluation` (basis `dce6083`)
- **Tanggal:** 2026-10-17

---

Tugas: L3-D — Evaluasi, pengaturan evaluasi, UKT, sabuk, keuangan → kartu + `SheetModal`

Diubah:
- `src/app/(admin)/_components/academy-evaluations-manager.tsx` — dipecah: sekarang hanya merangkai hook + view (835 → 87 baris)
- `src/app/(admin)/_components/evaluation/use-evaluation-data.ts`, `evaluation-handlers.ts` — state, pemuatan data, dan handler evaluasi dipindah tanpa mengubah panggilan API/pesan
- `src/app/(admin)/_components/evaluation/evaluation-scoring-view.tsx` — daftar kelas via `ResponsiveList`; matriks nilai desktop tetap tabel `min-w-[900px]` (kini `hidden md:block`)
- `src/app/(admin)/_components/evaluation/evaluation-mobile-scorer.tsx` — HP: pilih siswa (select + Sebelumnya/Berikutnya) → kartu semua aspek, input `inputMode="numeric"`, predikat per aspek, legenda rentang Kurang/Cukup/Baik/Sangat Baik
- `src/app/(admin)/_components/evaluation/evaluation-types.ts` — `SCORE_BANDS` jadi satu sumber untuk label, gaya, dan legenda predikat
- `src/app/(admin)/_components/evaluation/evaluation-settings-view.tsx`, `evaluation-settings-aside.tsx`, `evaluation-period-modal.tsx`, `evaluation-aspect-modal.tsx` — pengaturan periode/variabel: kartu + `SheetModal` di HP, aside tetap di desktop
- `src/app/(admin)/_components/academy-rank-promotions-manager.tsx` + `evaluation/use-rank-promotions.ts`, `rank-promotion-aside.tsx`, `rank-promotion-modals.tsx` — peserta UKT via `ResponsiveList`, form event/peserta di `SheetModal` (< xl)
- `src/app/(admin)/_components/academy-ranks-manager.tsx` + `evaluation/rank-form.tsx`, `evaluation/rank-list.tsx` — daftar sabuk kartu/tabel, form di `SheetModal` (< xl); di xl tombol Edit mengisi form samping tanpa membuka sheet
- `src/app/(admin)/_components/academy-finance-manager.tsx` + `finance/finance-bill-list.tsx` — rekap SPP via `ResponsiveList`, kartu ringkasan dipisah
- `e2e/responsive.spec.ts` — 5 rute L3-D ditambahkan ke `ACADEMY_ROUTES`; locator sidebar `main > aside` (halaman L3-D punya `<aside>` sendiri)
- `e2e/fixtures/mock-api.ts` — fixture sabuk, periode/aspek evaluasi, event UKT; respons `students` dan `spp-bills` disesuaikan ke bentuk paginasi `admin-api.ts`
- `admin-api.ts` — tidak diubah

File dipecah / ukuran (baris sebelum → sesudah, basis `dce6083`):

| File | Sebelum | Sesudah |
|---|---|---|
| `academy-evaluations-manager.tsx` | 835 | 87 |
| `academy-rank-promotions-manager.tsx` | 381 | 322 |
| `academy-ranks-manager.tsx` | 248 | 231 |
| `academy-finance-manager.tsx` | 246 | 212 |

Komponen baru (semua < 400): `evaluation/` — aspect-modal 136, handlers 278, mobile-scorer 206, period-modal 83, scoring-view 376, settings-aside 114, settings-view 398, types 53, rank-form 137, rank-list 82, rank-promotion-aside 206, rank-promotion-modals 246, use-evaluation-data 372, use-rank-promotions 276; `finance/finance-bill-list.tsx` 151.

Test:
- `evaluation/__tests__/evaluation-types.test.ts` — LULUS
- `evaluation/__tests__/evaluation-mobile-scorer.test.tsx` (3 test: kartu + predikat, legenda + `inputmode`, empty state `md:hidden`) — LULUS
- `__tests__/academy-ranks-manager.test.tsx` (3 test, termasuk Edit di xl tanpa SheetModal) — LULUS
- `__tests__/academy-rank-promotions-manager.test.tsx` — LULUS
- `__tests__/academy-finance-manager.test.tsx` — LULUS
- Playwright `responsive.spec.ts` 6 rute × mobile/tablet/desktop — 18 LULUS

Verifikasi (di `dojang-hub-web`, berurutan):
- `npm run lint` → 0 error, 13 warning (lama, `<img>` di profil publik/tenant)
- `npm run typecheck` → 0 error
- `npm test` → 25 file, 105 test passed
- `npm run build` → sukses
- `PLAYWRIGHT_PORT=3500 npx playwright test --workers=1` → 18 passed (3.2m)

Catatan/keputusan yang perlu pemilik project:
- Batas predikat nilai (Kurang 1–59, Cukup 60–69, Baik 70–84, Sangat Baik 85–100) tidak didefinisikan di PRD/SCHEMA; ini keputusan UI di `SCORE_BANDS`. Mohon dikonfirmasi atau ditetapkan.
- `e2e/fixtures/mock-api.ts` dan `e2e/responsive.spec.ts` juga diubah oleh L3-B/L3-E di `main` → konflik merge diperkirakan di kedua file. Perubahan bentuk mock `students`/`spp-bills` (paginasi) menyentuh fixture bersama; diperlukan agar halaman L3-D memuat data.
- Modal UKT (`rank-promotion-modals.tsx`) menutup setelah submit walau request gagal; pesan error tetap tampil di halaman dan isian form tetap tersimpan di state.
- Sebagian label kecil di kartu (`text-[10px]`/`text-[11px]`) adalah label/caps, bukan teks isi.
