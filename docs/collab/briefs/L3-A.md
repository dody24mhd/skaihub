# Brief L3-A — Fondasi responsive: komponen UI, shell, harness E2E (3.1, 3.2, 3.8, awal 3.9)

- **Pelaksana:** Gemini-3 · **Worktree:** `.worktrees/fase3-a` · **Branch:** `fase-3-shell` (dari `main` setelah L2-A di-merge)
- **Boleh diubah:** `dojang-hub-web/src/app/(admin)/_components/ui/**` (baru), `academy-shell.tsx`, `admin-shell.tsx`, `dojang-hub-web/src/app/globals.css` (hanya utilitas baru bila perlu), `dojang-hub-web/e2e/**`, `dojang-hub-web/playwright.config.*`, `docs/collab/reports/L3-A.md`
- **Dilarang:** file `*-manager.tsx` (wilayah L3-B..E), `dojang-hub-api/**`, komponen PWA kecuali bila shell perlu memberi ruang untuk install bar.
- Patuhi PLAN Bagian A (terutama A4) dan `DESIGN.md` (root): navy `#031636`, merah `#d32f2f`, Montserrat/Inter, sudut tegas, **"Layout mobile-first: card besar, mudah di-tap. Bottom navigation di mobile (bukan sidebar)"**.

## Konteks
- `academy-shell.tsx`: sidebar `hidden lg:flex`; di HP ada strip chip horizontal `overflow-x-auto lg:hidden` (~L174) dengan tombol `h-9`. Menu dibangun oleh `buildNavSections(plan)` dengan filter role.
- `admin-shell.tsx`: pola sama (~L114, ~L219), chip dari semua section digabung.
- Komponen PWA (`pwa/install-prompt.tsx`) memakai bar bawah — bottom nav dan install bar **tidak boleh saling menutupi** (install bar di atas bottom nav).

## 3.1 Komponen UI bersama (`src/app/(admin)/_components/ui/`) — dengan unit test (Vitest + Testing Library)
- `bottom-nav.tsx` — `md:hidden`, fixed bawah, `pb-[env(safe-area-inset-bottom)]`, 5 slot, ikon Material Symbols + label kecil, item aktif ditandai warna merah + `aria-current="page"`, tinggi item ≥ 56px.
  - Ketua/Admin: Beranda (`/academy`), Siswa, Absensi, SPP, Lainnya.
  - Pelatih: Beranda, Siswa, Absensi, Penilaian, Lainnya.
  - "Lainnya" membuka `sheet-modal` berisi sisa menu (dikelompokkan seperti `buildNavSections`) + tombol Keluar.
- `sheet-modal.tsx` — bottom sheet di HP (`items-end`), dialog tengah di `md+`; `max-h-[90dvh] overflow-y-auto`; `role="dialog"`, `aria-modal`, judul via `aria-labelledby`; Esc & klik backdrop menutup; fokus awal ke dialog dan kembali ke pemicu saat tutup; body scroll lock. Prop `side?: "bottom" | "left"` untuk drawer.
- `responsive-list.tsx` — generik bertipe: `columns: { key, header, render(row), primary?: boolean, hideOnMobile?: boolean }[]`, `rows`, `getRowKey`, `onRowClick?`, `emptyState`. `md+` → `<table>`; di HP → daftar kartu (kolom `primary` jadi judul kartu, sisanya pasangan label–nilai). Kartu bisa di-tap (≥44px) bila `onRowClick`.
- `form-field.tsx` — label, hint, error (`aria-describedby`), input `min-h-11`, prop `inputMode`; satu kolom di HP.
- `page-header.tsx` — judul + aksi utama; di HP aksi utama bisa jadi tombol penuh-lebar.
- Ekspor dari `ui/index.ts`. Tanpa dependensi baru.

## 3.2 `academy-shell.tsx`
- Sidebar tetap untuk `lg+`. Di bawah `lg`: header ringkas sticky (nama akademi + judul halaman, tinggi ≤ 56px), **hapus strip chip**, pasang `BottomNav` (role & plan dari state yang sudah ada). Konten diberi `pb-24` (ruang bottom nav + safe area) di bawah `md`.
- Ekstrak konfigurasi menu ke `ui/academy-nav.ts` (fungsi murni `buildNavSections(plan)` + `bottomNavItems(role)`) + unit test filter role/plan. Pertahankan logout (termasuk pesan `LOGOUT` ke service worker dari L2-A).

## 3.8 `admin-shell.tsx`
- Di bawah `lg`: header dengan tombol hamburger (`aria-label="Buka menu"`, `size-11`) yang membuka drawer kiri (`sheet-modal side="left"`), menu tetap dikelompokkan per section. Hapus strip chip. Tanpa bottom nav.

## Harness E2E (fondasi 3.9)
- `e2e/fixtures/session.ts`: helper set `localStorage` token/role/nama/email (`skaihub_admin_token`, `skaihub_admin_role`, `skaihub_admin_name`, `skaihub_admin_email`) sebelum navigasi (`page.addInitScript`).
- `e2e/fixtures/mock-api.ts`: `page.route` untuk `NEXT_PUBLIC_API_URL` (`http://localhost:8000/api/**` atau nilai env saat test) dengan fixture minimal (akademi Pro, user ketua, 3 siswa, 2 kelas, 1 sesi berisi absensi, 2 tagihan SPP) dan fallback kosong untuk endpoint lain. Ambil bentuk respons dari tipe di `src/app/(admin)/_lib/admin-api.ts`.
- `playwright.config.ts`: `webServer` = `npm run build && npm run start -- -p 3200`, projects `mobile` (375×812, isMobile, hasTouch), `tablet` (768×1024), `desktop` (1280×800), hanya chromium.
- `e2e/responsive.spec.ts`: untuk daftar `ACADEMY_ROUTES` (awal: `/academy`), cek: tidak ada scroll horizontal (`document.documentElement.scrollWidth <= window.innerWidth`), bottom nav terlihat hanya di `mobile`, sidebar hanya di `desktop`; simpan screenshot ke `e2e/__screenshots__/` (gitignore). L3-B..E akan menambah rute.
- Jalankan `npx playwright install chromium` bila perlu.

## Verifikasi akhir
`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`. Tulis `docs/collab/reports/L3-A.md`, commit `docs: report L3-A`. Berhenti.
