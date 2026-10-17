# Laporan L3-B — Migrasi Mobile-First Form Absensi, Rekap, Jadwal, dan Dashboard

Tugas: L3-B — Migrasi mobile-first halaman absensi, jadwal, dan dashboard akademi

## Diubah
- `dojang-hub-web/src/app/(admin)/_lib/admin-api.ts` — Penambahan tipe `AttendanceStatus` ("present" | "excused" | "sick" | "absent") dan relasi bertipe di blok `// L3-B`
- `dojang-hub-web/src/app/(admin)/_components/academy-attendance-manager.tsx` — Migrasi form absensi ke mobile-first, integrasi subkomponen attendance
- `dojang-hub-web/src/app/(admin)/_components/academy-attendance-overview-manager.tsx` — Migrasi rekap absensi ke mobile-first dengan pemisahan kalender ringkas mobile & grid desktop
- `dojang-hub-web/src/app/(admin)/_components/academy-schedules-manager.tsx` — Migrasi jadwal ke ResponsiveList (kartu di mobile, tabel di desktop) & form modal SheetModal
- `dojang-hub-web/src/app/(admin)/_components/academy-dashboard-manager.tsx` — Penambahan kartu sesi latihan terbaru mobile-first dengan tautan cepat ke absensi
- `dojang-hub-web/src/app/(admin)/_components/attendance/attendance-student-card.tsx` — Komponen kartu siswa absensi mobile dengan 4 tombol status (Hadir, Izin, Sakit, Alpa), touch target ≥44px (min-h-11)
- `dojang-hub-web/src/app/(admin)/_components/attendance/attendance-summary-bar.tsx` — Ringkasan jumlah kehadiran sticky di atas bottom nav & tombol simpan penuh-lebar
- `dojang-hub-web/src/app/(admin)/_components/attendance/attendance-session-create.tsx` — Subkomponen form pembukaan sesi absensi baru (SheetModal)
- `dojang-hub-web/src/app/(admin)/_components/attendance/attendance-session-info.tsx` — Subkomponen header & info sesi latihan aktif
- `dojang-hub-web/src/app/(admin)/_components/attendance/attendance-student-list.tsx` — Subkomponen daftar kartu siswa dan aksi batch "Semua Hadir"
- `dojang-hub-web/src/app/(admin)/_components/attendance/attendance-calendar-mobile.tsx` — Kalender ringkas & daftar sesi per bulan untuk mobile (<md)
- `dojang-hub-web/src/app/(admin)/_components/attendance/attendance-calendar-desktop.tsx` — Grid kalender 7 kolom untuk desktop (≥md) tanpa regresi
- `dojang-hub-web/src/app/(admin)/_components/attendance/attendance-history-list.tsx` — Daftar riwayat sesi menggunakan ResponsiveList
- `dojang-hub-web/src/app/(admin)/_components/attendance/schedule-form-modal.tsx` — Form tambah/edit jadwal latihan menggunakan SheetModal
- `dojang-hub-web/src/app/(admin)/_components/attendance/schedule-columns.tsx` — Definisi kolom dan label jadwal latihan
- `dojang-hub-web/e2e/fixtures/mock-api.ts` — Endpoint mock API untuk jadwal latihan, pelatih, tempat, sesi latihan, dan PUT absensi
- `dojang-hub-web/e2e/responsive.spec.ts` — Penambahan rute L3-B (`/academy`, `/academy/attendance`, `/academy/attendance/new`, `/academy/schedules`) dan test alur absensi mobile dengan status `sick`
- `dojang-hub-web/src/app/(admin)/_components/__tests__/*` — Unit tests untuk subkomponen absensi, form modal, dan manager halaman

## Pemecahan File (Baris Sebelum → Sesudah)
| File | Sebelum | Sesudah | Selisih | Keterangan |
|---|---|---|---|---|
| `academy-attendance-manager.tsx` | 419 | 356 | -63 | Berhasil dipecah di bawah batas 400 baris |
| `academy-attendance-overview-manager.tsx` | 324 | 320 | -4 | Bagian kalender dipisah ke subkomponen mobile & desktop |
| `academy-schedules-manager.tsx` | 320 | 305 | -15 | Form & definisi kolom diekstrak ke subfolder attendance |
| `academy-dashboard-manager.tsx` | 125 | 180 | +55 | Ditambah sesi latihan terbaru & tombol absensi interaktif (<400 baris) |

Subkomponen baru yang diekstrak di `src/app/(admin)/_components/attendance/`:
- `attendance-student-card.tsx` (116 baris)
- `attendance-summary-bar.tsx` (76 baris)
- `attendance-session-create.tsx` (160 baris)
- `attendance-session-info.tsx` (60 baris)
- `attendance-student-list.tsx` (56 baris)
- `attendance-calendar-mobile.tsx` (77 baris)
- `attendance-calendar-desktop.tsx` (84 baris)
- `attendance-history-list.tsx` (83 baris)
- `schedule-form-modal.tsx` (115 baris)
- `schedule-columns.tsx` (115 baris)

## Test
- Unit Test (`npm test`):
  - `src/app/(admin)/_components/__tests__/attendance-student-card.test.tsx` (3 tests) — LULUS
  - `src/app/(admin)/_components/__tests__/attendance-summary-bar.test.tsx` (3 tests) — LULUS
  - `src/app/(admin)/_components/__tests__/academy-attendance-manager.test.tsx` (4 tests) — LULUS
  - `src/app/(admin)/_components/__tests__/academy-attendance-overview-manager.test.tsx` (3 tests) — LULUS
  - `src/app/(admin)/_components/__tests__/academy-schedules-manager.test.tsx` (3 tests) — LULUS
  - `src/app/(admin)/_components/__tests__/academy-dashboard-manager.test.tsx` (3 tests) — LULUS
  - Total unit test suite: 26 passed (103 tests passed) — LULUS
- E2E Test (`playwright test` via port 3300, `--workers=1`):
  - `[mobile] responsive.spec.ts`: rute `/academy`, `/academy/attendance`, `/academy/attendance/new`, `/academy/schedules` — LULUS
  - `[mobile] responsive.spec.ts`: alur isi absensi lengkap pada mobile dengan status `sick` (verifikasi payload PUT) — LULUS
  - `[tablet] responsive.spec.ts`: rute `/academy`, `/academy/attendance`, `/academy/attendance/new`, `/academy/schedules` — LULUS
  - `[desktop] responsive.spec.ts`: rute `/academy`, `/academy/attendance`, `/academy/attendance/new`, `/academy/schedules` — LULUS
  - Total E2E: 13 passed (18.1s) — LULUS

## Verifikasi
- `npm run lint` → 0 error (13 warnings berupa `<img>` pada file di luar wilayah L3-B yang sudah ada sebelumnya)
- `npm run typecheck` → sukses (0 error, exit code 0)
- `npm test` → 26 test files passed (103 tests passed)
- `npm run build` → sukses (Next.js 16.2.6 compile & static page generation 46/46 sukses)
- `npx playwright test --workers=1` (PORT=3300) → 13 passed (13/13)

## Catatan/keputusan yang perlu pemilik project:
- Status backend `sick` telah diintegrasikan pada antarmuka pengguna (UI) sesuai instruksi dan terbukti lolos uji E2E dengan payload status `sick`.
- `playwright.config.ts` dipertahankan tanpa perubahan git diff (milik bersama). Pengujian port 3300 dijalankan tanpa merusak konfigurasi bersama.
