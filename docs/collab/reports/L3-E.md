# Laporan Tugas L3-E — Migrasi Mobile-First Setup & Profil Publik (3.7)

- **Pelaksana:** Gemini-7
- **Worktree:** `.worktrees/fase3-e` · **Branch:** `fase-3-setup`
- **Tanggal:** 2026-10-17

---

Tugas: L3-E — Migrasi mobile-first untuk area setup dan profil publik (`academy-places-manager.tsx`, `academy-classes-manager.tsx`, `academy-coaches-manager.tsx`, `academy-users-manager.tsx`, `academy-public-profile-manager.tsx`), memecah file raksasa `academy-public-profile-manager.tsx` (< 400 baris per file), memastikan modal hero image crop preview dan galeri responsif menggunakan `SheetModal`, memperluas uji E2E responsive Playwright pada port 3600 (workers=1).

Diubah:
- `dojang-hub-web/src/app/(admin)/_components/academy-places-manager.tsx` (330 baris) — Migrasi ke `ResponsiveList` (card di mobile, tabel di desktop), `SheetModal`, `FormField`, `PageHeader`.
- `dojang-hub-web/src/app/(admin)/_components/academy-classes-manager.tsx` (394 baris) — Migrasi ke `ResponsiveList`, `SheetModal`, `FormField`, `PageHeader`, tombol aksi sentuh minimal 44px.
- `dojang-hub-web/src/app/(admin)/_components/academy-coaches-manager.tsx` (336 baris) — Migrasi ke `ResponsiveList`, `SheetModal`, `FormField`, `PageHeader`, card ringkas dengan info kontak dan lisensi.
- `dojang-hub-web/src/app/(admin)/_components/academy-users-manager.tsx` (325 baris) — Migrasi ke `ResponsiveList`, `PageHeader`, pemisahan subkomponen modal formulir pengguna.
- `dojang-hub-web/src/app/(admin)/_components/setup/users/user-form-modal.tsx` (215 baris) — Subkomponen form modal penambahan/pengubahan akun pengguna operasional dengan `SheetModal` dan pencegahan re-render cascading.
- `dojang-hub-web/src/app/(admin)/_components/academy-public-profile-manager.tsx` (261 baris, dipecah dari 1625 baris) — Manager profil publik modular yang mengorkestrasi 7 subkomponen terisolasi dalam tab navigasi.
- `dojang-hub-web/src/app/(admin)/_components/setup/public-profile/`:
  - `profile-info-section.tsx` (165 baris) — Formulir info profil (tentang, visi, misi, kontak WhatsApp, CTA label).
  - `profile-appearance-section.tsx` (173 baris) — Pengaturan tema tampilan (warna primer, tombol, background, font heading & body, border radius tombol) dengan live preview.
  - `profile-coaches-section.tsx` (79 baris) — Toggle visibilitas pelatih di halaman publik.
  - `profile-officials-section.tsx` (302 baris) — Manajemen struktur pengurus akademi dengan `ResponsiveList` dan `SheetModal`.
  - `profile-hero-section.tsx` (338 baris) — Manajemen slider hero image dan modal pratinjau crop interaktif menggunakan `SheetModal`.
  - `profile-gallery-section.tsx` (168 baris) — Manajemen galeri foto kegiatan dengan modal upload `SheetModal`.
  - `profile-achievements-section.tsx` (208 baris) — Manajemen prestasi dojang dengan `ResponsiveList` dan `SheetModal`.
  - `index.ts` (7 baris) — Barrel export untuk seluruh subkomponen profil publik.
- Unit Test Suite (`src/app/(admin)/_components/__tests__/`):
  - `academy-places-manager.test.tsx` (105 baris) — 3 unit tests.
  - `academy-classes-manager.test.tsx` (119 baris) — 3 unit tests.
  - `academy-coaches-manager.test.tsx` (123 baris) — 2 unit tests.
  - `academy-users-manager.test.tsx` (148 baris) — 3 unit tests.
  - `academy-public-profile-manager.test.tsx` (222 baris) — 2 unit tests.
- E2E Test Suite (`dojang-hub-web/e2e/`):
  - `fixtures/mock-api.ts` — Mock API handler untuk rute places, coaches, users, dan public profile.
  - `responsive.spec.ts` — Menambahkan 5 rute setup ke daftar pengujian responsif lintas viewports (`/academy/classes`, `/academy/coaches`, `/academy/users`, `/academy/places`, `/academy/public-profile`).

Rincian Pemecahan File (Baris Sebelum -> Sesudah):
- `academy-public-profile-manager.tsx`: 1625 baris -> 261 baris
  - `profile-info-section.tsx`: 165 baris
  - `profile-appearance-section.tsx`: 173 baris
  - `profile-coaches-section.tsx`: 79 baris
  - `profile-officials-section.tsx`: 302 baris
  - `profile-hero-section.tsx`: 338 baris
  - `profile-gallery-section.tsx`: 168 baris
  - `profile-achievements-section.tsx`: 208 baris
- `academy-users-manager.tsx`: 497 baris -> 325 baris
  - `setup/users/user-form-modal.tsx`: 215 baris
- Seluruh file berada di bawah batas keras 400 baris.

Test:
- `src/app/(admin)/_components/__tests__/academy-places-manager.test.tsx` — 3 passed (LULUS)
- `src/app/(admin)/_components/__tests__/academy-classes-manager.test.tsx` — 3 passed (LULUS)
- `src/app/(admin)/_components/__tests__/academy-coaches-manager.test.tsx` — 2 passed (LULUS)
- `src/app/(admin)/_components/__tests__/academy-users-manager.test.tsx` — 3 passed (LULUS)
- `src/app/(admin)/_components/__tests__/academy-public-profile-manager.test.tsx` — 2 passed (LULUS)
- Total Unit Test Suite: 25 test files, 100 tests (100% LULUS)
- Playwright Responsive E2E (`$env:PLAYWRIGHT_PORT="3600"; npm run test:e2e -- --workers=1`):
  - `[mobile]` (375x812): 6 rute L3-E & shell passed
  - `[tablet]` (768x1024): 6 rute L3-E & shell passed
  - `[desktop]` (1280x800): 6 rute L3-E & shell passed
  - Total E2E: 18 passed (100% LULUS)

Verifikasi:
- `npm run lint` → 0 errors, 6 pre-existing warnings di halaman tenant luar L3-E (`@next/next/no-img-element`)
- `npm run typecheck` → 0 errors (`tsc --noEmit` sukses, exit code 0)
- `npm test` → 25 test files passed (100 tests)
- `npm run build` → sukses mengompilasi 46 rute statis
- `npm run test:e2e -- --workers=1` → 18 passed (mobile, tablet, desktop) pada port 3600
- Tidak ada port tertinggal dan tidak menyentuh worktree/branch lain.

Catatan/keputusan yang perlu pemilik project: tidak ada
