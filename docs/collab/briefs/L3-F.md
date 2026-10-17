# Brief L3-F — Aksesibilitas (WCAG 2.2 AA) & polish pra-rilis

- **Worktree:** `.worktrees/fase3-f` · **Branch:** `fase-3-a11y` · **Port E2E:** 3960
- Aturan sama dengan pembuka `L4.md` (Bagian A PLAN, TDD untuk logika, satu commit per butir dengan trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, laporan `docs/collab/reports/L3-F.md`).
- Sumber temuan: review a11y Fase 3 (ringkasan di bawah). Jangan mengubah perilaku data/API; ini perbaikan presentasi, semantik, dan polish.

## A. Aksesibilitas — 8 perbaikan prioritas
1. Komponen `ui/icon.tsx` (`<Icon name="..." />`, selalu `aria-hidden="true"`, opsional `className`) dan ganti **semua** `<span className="material-symbols-outlined">` di `src/app/(admin)/**` dan `src/app/offline/**` agar teks ligatur tidak dibaca screen reader. Tombol ikon tetap punya `aria-label`.
2. Komponen `ui/status-message.tsx` (`tone: "success" | "error" | "info"`; success/info `role="status"`, error `role="alert"`; container tetap ter-mount). Ganti blok pesan sukses/error di semua manager & view (classes, coaches, places, ranks, schedules, users, rank-promotions, evaluation scoring/settings, spp, students, student form, attendance, finance, public profile).
3. Token warna di `src/app/globals.css`: `--success-strong: #047857` untuk teks sukses; tombol status aktif Hadir/Sakit di `attendance/attendance-student-card.tsx` memakai latar dengan kontras ≥ 4.5:1 untuk teks putih (mis. emerald-700, amber-700).
4. Fokus terlihat: `focus-visible:ring-2` solid (kontras ≥ 3:1) pada item bottom nav dan semua kontrol yang memakai `ring-*/20`; hapus `focus:outline-hidden` tanpa pengganti.
5. Token `--border-strong` (≈ `#8a94a6`, ≥ 3:1) untuk border input/select/textarea/toggle di `ui/form-field.tsx` dan form lain.
6. Skip link "Lewati ke konten" di `academy-shell.tsx` dan `admin-shell.tsx`; hanya area konten yang menjadi `<main id="konten">` (bungkus luar `<div>`). Satu `<h1>` per halaman (judul shell jadi `<p>` bila halaman punya `PageHeader`).
7. `aria-current="page"` pada link sidebar, drawer, dan sheet "Lainnya" yang aktif; tab profil publik pakai semantik `tablist/tab/aria-selected`; toggle pelatih publik `role="switch"` + `aria-checked`.
8. `ui/sheet-modal.tsx`: ID via `useId()`; Esc hanya menutup sheet teratas (handler di panel + `stopPropagation`); `ui/form-field.tsx` meneruskan `aria-invalid` & `aria-describedby` ke children; blok CSS `@media (prefers-reduced-motion: reduce)`.

Serta: teks kontras rendah (`text-muted/70`, `/60`, `white/45`, placeholder) → minimal 4.5:1; update toast PWA tidak menutupi bottom nav di HP dan pakai container `role="status"` yang selalu ter-mount; label Inggris → Indonesia ("Logout"→"Keluar", "Prev"→"Sebelumnya", "Next"→"Berikutnya"); target `size-10`/`size-8`/`min-h-8` → minimal 44px; tombol hapus foto galeri punya nama unik; scorer evaluasi mobile mengumumkan "Siswa X dari Y" lewat live region polite.

## B. Polish pra-rilis
- Menu internal "Akademi" dan "Subscription" hanya tampil untuk `super_admin` (flag `superAdminOnly` seperti "Staf Platform").
- Pesan 429 Laravel dalam Bahasa Indonesia: handler di `dojang-hub-api/bootstrap/app.php` untuk `ThrottleRequestsException` → JSON `{ message: "Terlalu banyak percobaan. Coba lagi dalam N detik." }` (+ feature test).
- Hapus `src/app/(admin)/_components/admin-coming-soon.tsx` bila tidak lagi direferensikan (cek dengan grep).

## Verifikasi
`php artisan test`, `pint --dirty`; `npm run lint`, `npm run typecheck`, `npx vitest run`, `npm run build`, `PLAYWRIGHT_PORT=3960 npx playwright test --workers=1` (semua harus tetap lulus; perbarui selector test yang bergantung pada teks ikon/struktur `<main>`). Tambahkan unit test untuk `Icon`, `StatusMessage`, skip link, `aria-current`, dan SheetModal bertumpuk.
