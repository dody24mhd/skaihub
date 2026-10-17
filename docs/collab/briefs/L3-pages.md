# Brief L3-B…E — Migrasi halaman ke mobile-first (3.3–3.7, sisa 3.9)

Empat jalur paralel. Masing-masing: worktree & branch sendiri **dari `main` setelah L3-A (dan L1-C) di-merge**.

| Jalur | Pelaksana | Worktree | Branch | File yang menjadi wilayahnya |
|---|---|---|---|---|
| L3-B | Gemini-4 | `.worktrees/fase3-b` | `fase-3-attendance` | `academy-attendance-manager.tsx`, `academy-attendance-overview-manager.tsx`, `academy-schedules-manager.tsx`, `academy-dashboard-manager.tsx`, `src/app/(admin)/academy/attendance/**`, `src/app/(admin)/academy/schedules/**`, `src/app/(admin)/academy/page.tsx` |
| L3-C | Gemini-5 | `.worktrees/fase3-c` | `fase-3-students-spp` | `academy-students-manager.tsx`, `academy-student-detail-manager.tsx`, `academy-student-form-manager.tsx`, `academy-spp-manager.tsx`, `src/app/(admin)/academy/students/**`, `src/app/(admin)/academy/spp/**` |
| L3-D | Gemini-6 | `.worktrees/fase3-d` | `fase-3-evaluation` | `academy-evaluations-manager.tsx`, manager pengaturan evaluasi, `academy-rank-promotions-manager.tsx`, `academy-ranks-manager.tsx`, `academy-finance-manager.tsx` + page terkait |
| L3-E | Gemini-7 | `.worktrees/fase3-e` | `fase-3-setup` | `academy-classes-manager.tsx`, `academy-coaches-manager.tsx`, `academy-users-manager.tsx`, `academy-places-manager.tsx`, `academy-public-profile-manager.tsx` + page terkait |

Setiap jalur juga boleh: membuat komponen baru **di subfolder miliknya** (`src/app/(admin)/_components/<area>/…`, mis. `attendance/`, `students/`, `evaluation/`, `setup/`), menambah fungsi bertipe ke `src/app/(admin)/_lib/admin-api.ts` **hanya** untuk endpoint yang disebut di briefnya (tambahkan di akhir file, satu blok berkomentar `// L3-x`), menambah rute ke `ACADEMY_ROUTES` dan fixture di `e2e/**` (hanya entri miliknya), dan menulis `docs/collab/reports/<jalur>.md`.

**Dilarang:** mengubah `ui/**`, `academy-shell.tsx`, `admin-shell.tsx`, komponen PWA, wilayah jalur lain, `dojang-hub-api/**`. Butuh perubahan komponen UI bersama → tulis di laporan, jangan edit.

## Aturan umum (semua jalur)
1. Pakai komponen dari `src/app/(admin)/_components/ui` (`ResponsiveList`, `SheetModal`, `FormField`, `PageHeader`). Jangan membuat ulang pola yang sama.
2. Target per halaman di lebar **375px**: tidak ada scroll horizontal halaman; tabel → kartu (`ResponsiveList`); semua modal → `SheetModal`; target sentuh ≥ 44px; teks isi ≥ 14px; aksi utama mudah dijangkau.
3. Desktop (≥1024px) **tidak boleh regresi** — tampilan tabel tetap.
4. File besar: jangan menambah baris ke file > 400 baris; **ekstrak** bagian yang Anda sentuh ke komponen kecil di subfolder area. Target: tidak ada file di wilayah Anda yang bertambah panjang.
5. Perilaku data (panggilan API, validasi, pesan) **tidak berubah** kecuali disebut di bawah.
6. Satu commit per halaman/kelompok (`feat(web): mobile-first <halaman>`).
7. Tambah rute Anda ke `ACADEMY_ROUTES` di `e2e/responsive.spec.ts` + fixture yang dibutuhkan, dan pastikan lulus di project `mobile`, `tablet`, `desktop`.

## Khusus per jalur
**L3-B (absensi — prioritas tertinggi, dipakai pelatih di lapangan)**
- Form absensi (`/academy/attendance/new` dan edit sesi): kartu per siswa, empat tombol status besar yang muat 375px: **Hadir / Izin / Sakit / Alpa** (`present` / `excused` / `sick` / `absent` — `sick` didukung backend setelah L1-C), tombol "Semua hadir", ringkasan jumlah per status yang sticky di bawah (di atas bottom nav), tombol simpan penuh-lebar. Hapus `min-w-56` dan `h-9 min-w-16`.
- Rekap absensi (`min-w-[900px]`): di HP tampilkan daftar per sesi/tanggal (kartu) atau kalender ringkas; desktop tetap grid.
- Jadwal & dashboard: kartu di HP.
- E2E tambahan: alur isi absensi lengkap di project `mobile` (mock API, pastikan payload berisi status yang dipilih).

**L3-C (siswa & SPP)**
- Daftar siswa → `ResponsiveList` (kartu: nama, sabuk, kelas, status); pencarian/filter tetap dapat dipakai di HP.
- Form siswa: satu kolom, `inputMode` untuk telepon/angka, grup field yang jelas.
- Detail siswa: section bertumpuk di HP. **Tambahkan** dua section baru memakai endpoint L1-C: "Riwayat Sabuk" (`GET /akademi/students/{id}/rank-histories`, read-only) dan "Prestasi" (`GET|POST|PUT|DELETE /akademi/students/{id}/achievements`; tulis hanya Ketua/Admin, form di `SheetModal`). Baca bentuk respons dari controller di `dojang-hub-api` (read-only).
- SPP: daftar tagihan → kartu (nama, periode, nominal, status, sisa); modal bayar → `SheetModal`; generate tagihan tetap jalan.

**L3-D (evaluasi & kenaikan tingkat)**
- Input nilai evaluasi (`min-w-[760px]`, `min-w-[900px]`): di HP pola "pilih siswa → isi semua aspek dalam kartu" dengan input `inputMode="numeric"`, label nilai (Kurang/Cukup/Baik/Sangat Baik) terlihat; desktop tetap tabel matriks. `academy-evaluations-manager.tsx` (835 baris) wajib dipecah.
- Pengaturan evaluasi, UKT (peserta & hasil), sabuk, keuangan: kartu + `SheetModal`.

**L3-E (setup & profil publik)**
- Kelas, pelatih, akun, tempat: `ResponsiveList` + `SheetModal` untuk form.
- Profil publik (`academy-public-profile-manager.tsx`, 1624 baris): modal di ~L1342 dan ~L1540 → `SheetModal`; pecah per section (profil, hero, galeri, prestasi, pengurus) ke `setup/public-profile/*`. Perilaku penyimpanan & upload tidak berubah.

## Verifikasi akhir (setiap jalur)
`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`. Laporan A7 + daftar file yang dipecah (baris sebelum → sesudah). Commit `docs: report <jalur>`. Berhenti.
