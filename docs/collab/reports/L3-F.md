# Laporan Tugas L3-F — Aksesibilitas (WCAG 2.2 AA) & polish pra-rilis

- **Pelaksana:** Claude agent
- **Worktree:** `.worktrees/fase3-f` · **Branch:** `fase-3-a11y` · **Port E2E:** 3960
- **Tanggal:** 2026-10-17

---

Tugas: L3-F — Aksesibilitas (bagian A1–A8 + "Serta") & polish pra-rilis (bagian B)

Diubah (per commit, urut):
- `965be23` feat(api) — `dojang-hub-api/bootstrap/app.php`: render `ThrottleRequestsException` → JSON `{ message: "Terlalu banyak percobaan. Coba lagi dalam N detik." }`, header `Retry-After`/`X-RateLimit-*` dipertahankan; `tests/Feature/ThrottleMessageTest.php` baru (B).
- `625378e` A1 — `ui/icon.tsx` (`<Icon name className? />`, selalu `aria-hidden="true"`) + ekspor barrel; 187 span `material-symbols-outlined` di `src/app/(admin)/**` diganti via codemod (skrip di scratch, tidak di-commit), 1 manual (bottom-nav, FILL aktif via kelas arbitrary `font-variation-settings`). `src/app/offline/**` tidak memakai Material Symbols. Lima tombol ikon-saja yang sebelumnya hanya "bernama" ligatur kini punya `aria-label` (Hapus thumbnail/poster/foto profil, Hapus bukti pembayaran ×2).
- `cf659e7` A2 — `ui/status-message.tsx` (`tone` success/info → `role="status"`, error → `role="alert"`; region selalu ter-mount, `sr-only` saat kosong; `children` untuk tautan/tombol tambahan). Dipakai di classes, coaches, places, ranks, schedules, users, rank-promotions, evaluation scoring/settings, SPP (+ tautan kwitansi), students (+ Coba lagi), student form, attendance, attendance overview, Kelas Hari Ini, finance, public profile.
- `85e024e` A3 — `globals.css` `--success-strong: #047857` (+ `--color-success-strong`); semua `text-success` di admin → `text-success-strong`; tombol aktif Hadir `bg-success-strong`, Sakit `bg-amber-700`; tombol WA kwitansi & hover "Hadir semua" ke `success-strong`.
- `f16e905` A4 — ring fokus transparan (`ring-primary/10|/20`, `ring-secondary/20|/50`, `focus-within:ring-primary/10`) → solid; item bottom nav `focus-visible:ring-2 ring-inset ring-primary` menggantikan `focus:outline-hidden` tanpa pengganti.
- `939e961` A5 — token `--border-strong: #828c9e`; border input/select/textarea di `ui/form-field.tsx` dan 34 file form lain; status off toggle publik (`bg-border` → `bg-border-strong`).
- `377ace8` A6 — skip link "Lewati ke konten" di `academy-shell.tsx` & `admin-shell.tsx`; bungkus luar `<div data-testid="app-shell">`, hanya area konten `<main id="konten" tabIndex={-1}>`; prop `hasPageHeader` → judul shell dirender `<p>` (dipasang di halaman classes, coaches, places, public-profile, schedules, students, users, internal/users). `e2e/responsive.spec.ts`: selector `main > aside` diganti `getByTestId("app-shell").locator(":scope > aside")` + cek satu `main#konten` & skip link.
- `161e8ec` A7 — `aria-current="page"` di sidebar akademi, sidebar + drawer admin (termasuk Ganti Password), sheet "Lainnya"; tab profil publik `tablist/tab/tabpanel` + `aria-selected`, roving tabindex, panah/Home/End; toggle pelatih publik `role="switch"` + `aria-checked` (nama "Tampilkan <nama> di website"); toggle publish (sebelumnya `div onClick`, tidak bisa keyboard) → `<button role="switch">`.
- `38d93b5` A8 — `ui/sheet-modal.tsx`: ID judul/deskripsi via `useId()`; Esc & focus trap ditangani `onKeyDown` panel + `stopPropagation` (hanya sheet teratas yang tertutup); kunci scroll body dihitung (aman untuk sheet bertumpuk). `ui/form-field.tsx` meneruskan `aria-invalid`/`aria-describedby` ke children (digabung dengan milik child) dan tidak lagi merujuk ID hint yang disembunyikan saat error. `globals.css` blok `@media (prefers-reduced-motion: reduce)`.
- `e4a5f62` Serta — `text-muted/60|/70` → `/80`, `placeholder:text-muted/50–70` → `/80`, `text-white/40|/45` → `/65`.
- `b4c8e9e` Serta — `pwa/update-toast.tsx`: container `role="status"` selalu ter-mount; di HP toast di atas bottom nav (`bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]`, `md:bottom-6`).
- `aefe936` Serta — "Logout" → "Keluar", "Prev"/"Next" → "Sebelumnya"/"Berikutnya"; selector test logout diperbarui ke `/keluar/i`.
- `5511cbe` Serta — tombol interaktif `size-10`/`size-8`/`min-h-8` → `size-11`/`min-h-11` (28 kontrol); tombol hapus gambar yang hanya muncul saat hover kini juga `focus-visible:opacity-100`.
- `0b8d14c` Serta — tombol hapus galeri/hero bernama unik: "Hapus foto galeri N (caption)", "Hapus gambar hero N (caption)".
- `137df64` Serta — `evaluation-mobile-scorer.tsx`: live region `role="status"` "Siswa X dari Y: <nama>".
- `c6d1f69` B — menu internal "Akademi" & "Subscription" `superAdminOnly`.
- `3e56088` B — hapus `admin-coming-soon.tsx` (grep `admin-coming-soon|AdminComingSoon` di `src`/`e2e` = 0 referensi).

Kontras (rumus WCAG 2.x, luminansi relatif sRGB):

| Pasangan | Sebelum | Sesudah |
|---|---|---|
| Teks sukses di putih | `#10b981` 2.54:1 | `#047857` 5.48:1 (5.25:1 di `success/5`) |
| Putih di tombol Hadir aktif | `#10b981` 2.54:1 | `#047857` 5.48:1 |
| Putih di tombol Sakit aktif | amber-500 `#f59e0b` 2.15:1 | amber-700 `#b45309` 5.02:1 |
| Putih di Izin (blue-600) / Alpa (secondary) | — | 5.17:1 / 4.98:1 (tidak diubah) |
| Teks error `#d32f2f` di `secondary/5` | — | 4.64:1 |
| Border input (non-teks, ≥3:1) | `#e2e8f0` 1.23:1 | `#828c9e` 3.39:1 putih, 3.23:1 `surface #f8f9ff`, 3.08:1 `#eff4ff` |
| Ring fokus | `primary/20` dsb. | primary 17.92:1, secondary 4.98:1 di putih |
| `text-muted/70` / `/60` di putih | 4.06:1 / 3.16:1 | `/80` 5.27:1 (5.09:1 di surface) |
| Label seksi sidebar `white/45` / `/40` di navy | 4.42:1 / 3.74:1 | `white/65` 7.95:1 |

Catatan: brief menyarankan `#8a94a6` untuk border-strong; nilai itu hanya 2.91:1 di latar `surface`, jadi dipakai `#828c9e`.

Test (baru/diperbarui):
- `ui/__tests__/icon.test.tsx` (3), `ui/__tests__/status-message.test.tsx` (5) — LULUS
- `__tests__/shell-landmarks.test.tsx` (12: skip link elemen fokus pertama, `main#konten` tunggal, h1 vs `hasPageHeader` untuk kedua shell, `aria-current` sidebar akademi & drawer admin, visibilitas menu super_admin vs admin) — LULUS
- `ui/__tests__/sheet-modal.test.tsx` (+2: ID unik, Esc pada sheet bertumpuk; Esc kini di-fire ke dialog, assert ID statis diganti `toHaveAccessibleName/Description`) — LULUS
- `ui/__tests__/form-field.test.tsx` (+2), `ui/__tests__/bottom-nav.test.tsx` (+1 `aria-current` di sheet Lainnya), `pwa/__tests__/update-toast.test.tsx` (diperbarui: region selalu ter-mount, posisi di atas bottom nav), `__tests__/academy-public-profile-manager.test.tsx` (+3: tablist/panah, switch, nama hapus unik), `evaluation/__tests__/evaluation-mobile-scorer.test.tsx` (+1 live region), `academy-shell-logout`/`admin-shell` (selector `/keluar/i`) — LULUS
- `tests/Feature/ThrottleMessageTest.php` (2; RED dulu: respons asli "Too Many Attempts.") — LULUS

Verifikasi (urut, output apa adanya):
- `php artisan test` → `{"result":"passed","tests":265,"passed":265,"assertions":1212}`
- `php -d opcache.enable_cli=0 vendor/bin/pint --dirty` → `{"result":"passed"}`
- `npm run lint` → `✖ 6 problems (0 errors, 6 warnings)` (warning `<img>` lama)
- `npm run typecheck` → sukses (tanpa output error)
- `npx vitest run --pool=threads` → `Test Files 70 passed (70)`, `Tests 317 passed (317)`
- `npm run build` → sukses, 48 halaman statis
- `PLAYWRIGHT_PORT=3960 npx playwright test --workers=1` → `87 passed`, `24 skipped` (spec khusus mobile yang memang di-skip di proyek tablet/desktop), 0 gagal (5.4m); port 3960 ditutup.

Catatan/keputusan yang perlu pemilik project:
- Penggantian `StatusMessage` dibatasi pada daftar di brief (+ attendance overview & Kelas Hari Ini). Manager internal/CMS (`admin-*-manager`, `change-password-form`, `platform-users`) masih memakai blok lama — bisa diseragamkan di tugas berikut.
- Toggle publish halaman publik diubah dari `div onClick` menjadi `<button role="switch">` (di luar daftar eksplisit, tetapi tanpanya toggle tidak bisa dipakai dengan keyboard).
- Panel tab profil publik dibungkus satu `tabpanel`; isinya sengaja tidak di-indentasi ulang agar diff/merge tetap kecil.
- Kontrol `h-10` (40px) yang bukan `size-10`/`size-8`/`min-h-8` (mis. input inline di pengaturan CMS) belum diubah; di luar cakupan brief.
