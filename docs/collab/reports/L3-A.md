# Laporan Tugas L3-A — Fondasi responsive: komponen UI, shell, harness E2E (3.1, 3.2, 3.8, awal 3.9)

- **Pelaksana:** Gemini-3
- **Worktree:** `.worktrees/fase3-a` · **Branch:** `fase-3-shell`
- **Tanggal:** 2026-10-17

---

Tugas: L3-A — Fondasi responsive: komponen UI, shell, harness E2E (3.1, 3.2, 3.8, awal 3.9)

Diubah:
- `dojang-hub-web/src/app/(admin)/_components/ui/bottom-nav.tsx` — Komponen bottom navigation mobile (`md:hidden`) dengan 5 slot, label + icon, indikator aktif, dan sheet modal untuk menu "Lainnya" serta logout
- `dojang-hub-web/src/app/(admin)/_components/ui/sheet-modal.tsx` — Komponen modal/bottom sheet/drawer samping (`side="bottom" | "left"`), aksesibel (`role="dialog"`, Esc close, backdrop click, body scroll lock, focus restore)
- `dojang-hub-web/src/app/(admin)/_components/ui/responsive-list.tsx` — Komponen daftar generik bertipe: table di `md+`, card list di HP dengan primary column sebagai judul dan secondary columns sebagai pasangan label-nilai
- `dojang-hub-web/src/app/(admin)/_components/ui/form-field.tsx` — Komponen form field responsive dengan label, hint, error (`aria-describedby`), input mode, dan sentuh minimal 44px
- `dojang-hub-web/src/app/(admin)/_components/ui/page-header.tsx` — Header halaman dengan eyebrow, judul Montserrat, deskripsi, dan tombol aksi full-width di HP
- `dojang-hub-web/src/app/(admin)/_components/ui/academy-nav.ts` — Fungsi murni navigasi (`buildNavSections` dengan filter plan starter/pro/scale, `filterNavSectionsByRole`, dan `bottomNavItems`)
- `dojang-hub-web/src/app/(admin)/_components/ui/index.ts` — Ekspor barrel untuk seluruh komponen dan helper UI
- `dojang-hub-web/src/app/(admin)/_components/ui/__tests__/*` — Unit test lengkap untuk bottom-nav, sheet-modal, responsive-list, form-field, page-header, dan academy-nav
- `dojang-hub-web/src/app/(admin)/_components/academy-shell.tsx` — Shell akademi responsif: sidebar pada `lg+`, sticky header ringkas (h ≤ 56px) tanpa chip horizontal di bawah `lg`, `BottomNav` terintegrasi, padding bawah `pb-24` di bawah `md`
- `dojang-hub-web/src/app/(admin)/_components/pwa/install-prompt.tsx` — Penyesuaian posisi install prompt di atas bottom nav agar tidak bertumpukan
- `dojang-hub-web/src/app/(admin)/_components/admin-shell.tsx` — Shell admin platform responsif: tombol hamburger `aria-label="Buka menu"` (size-11) di bawah `lg` dengan left drawer `sheet-modal side="left"`, chip horizontal dihapus
- `dojang-hub-web/src/app/(admin)/_components/__tests__/admin-shell.test.tsx` — Unit test pembukaan drawer admin-shell dan logout
- `dojang-hub-web/playwright.config.ts` — Konfigurasi Playwright E2E dengan projects `mobile` (375x812), `tablet` (768x1024), `desktop` (1280x800), chromium, dan `webServer` port 3200
- `dojang-hub-web/e2e/fixtures/session.ts` — Fixture pengisian localStorage (`skaihub_admin_token`, `skaihub_admin_role`, `skaihub_admin_name`, `skaihub_admin_email`) via `addInitScript`
- `dojang-hub-web/e2e/fixtures/mock-api.ts` — Interseptor route `**/api/**` dengan mock data sesuai tipe `admin-api.ts` (akademi Pro, ketua akademi, 3 siswa, 2 kelas, sesi training, tagihan SPP, dan summary dashboard)
- `dojang-hub-web/e2e/responsive.spec.ts` — Spec Playwright untuk memvalidasi ketiadaan horizontal scroll (`scrollWidth <= innerWidth`), visibility bottom nav hanya di mobile, visibility sidebar hanya di desktop, dan pengambilan screenshot per device
- `dojang-hub-web/e2e/__screenshots__/.gitignore` — Pengabaian file screenshot png dari git commit

Test:
- `src/app/(admin)/_components/ui/__tests__/academy-nav.test.ts` — 5 passed (LULUS)
- `src/app/(admin)/_components/ui/__tests__/bottom-nav.test.tsx` — 3 passed (LULUS)
- `src/app/(admin)/_components/ui/__tests__/sheet-modal.test.tsx` — 7 passed (LULUS)
- `src/app/(admin)/_components/ui/__tests__/responsive-list.test.tsx` — 4 passed (LULUS)
- `src/app/(admin)/_components/ui/__tests__/form-field.test.tsx` — 4 passed (LULUS)
- `src/app/(admin)/_components/ui/__tests__/page-header.test.tsx` — 2 passed (LULUS)
- `src/app/(admin)/_components/__tests__/admin-shell.test.tsx` — 2 passed (LULUS)
- Total Unit Test Suite: 18 test files, 63 tests (100% LULUS)
- Playwright E2E (`responsive.spec.ts`):
  - `[mobile]` › memverifikasi responsive layout pada /academy — LULUS
  - `[tablet]` › memverifikasi responsive layout pada /academy — LULUS
  - `[desktop]` › memverifikasi responsive layout pada /academy — LULUS
  - Total E2E: 3 passed (100% LULUS)

Verifikasi:
- `npm run lint` → 0 errors, 13 pre-existing warnings di halaman profil publik/tenant lama
- `npm run typecheck` → 0 errors (tsc --noEmit sukses)
- `npm test` → 18 test files passed (63 unit tests)
- `npm run build` → sukses mengompilasi 67 rute
- `npm run test:e2e -- --workers=1` → 3 passed (mobile, tablet, desktop)
- Port 3200 telah ditutup dan tidak ada proses server tertinggal.

Catatan/keputusan yang perlu pemilik project: tidak ada
