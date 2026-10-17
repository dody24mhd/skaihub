# Laporan Tugas L4-D — Siklus langganan, harga otomatis, dashboard operator (4.4, 4.7)

- **Pelaksana:** Claude agent
- **Worktree:** `.worktrees/fase4-d` · **Branch:** `fase-4-subscription`
- **Tanggal:** 2026-10-17

---

Tugas: L4-D — Siklus langganan, harga otomatis, dashboard operator (4.4, 4.7)

Diubah (backend `dojang-hub-api`):
- `config/skaihub.php` — baru: `plans` (starter/pro/scale: `monthly_price`, `included_students`, `free_extra_blocks` = 1, `public_website`), `extra_block_size` 50, `extra_block_surcharge_percent` 15, `renewal_warning_days` 14, `grace_days` 7, `quota_warning_percent` 80
- `app/Services/PlanPricingService.php` — membaca config; `effectiveStudentLimit()`, `subscriptionSubtotal(plan, months, paidBlocks)`
- `app/Services/SubscriptionService.php` — `includedStudentLimit`/entitlement dari config; subtotal otomatis + wajib catatan bila nominal manual berbeda; `lifecycle()`/`lifecycleState()`/`lifecycleFromSubscriptions()`; `activeStudentCount()`; `monthlyRevenue()`. `assertCanAddActiveStudent` tetap satu-satunya penegak kuota, kini memakai limit efektif
- `app/Models/Subscription.php` — `totalStudentLimit()` = bawaan + (gratis + berbayar) × 50 dari config
- `app/Http/Middleware/EnsureSubscriptionWritable.php` + alias `subscription.writable` di `bootstrap/app.php`; dipasang pada grup `/akademi` di `routes/api.php` (metode aman GET/HEAD/OPTIONS selalu lolos, termasuk export)
- `app/Http/Controllers/Akademi/ProfileController.php` — `/akademi/me` menambah `subscription_state`, `days_left`, `subscription_ends_at`, `effective_student_limit`, `active_students`
- `app/Http/Controllers/SuperAdmin/DashboardController.php` + route `GET /super-admin/dashboard` (blok `// L4-D`)
- `tests/TestCase.php` — helper `giveActiveSubscription()`; akademi uji yang menulis data diberi langganan aktif (Auth, RoleEscalation, SppPayment*, StudentAchievement, TrainingAttendanceSick, TrainingSessionSecurity, CsvExportSecurity)

Diubah (frontend `dojang-hub-web`):
- `src/lib/plan-pricing.ts` — konstanta frontend yang sama nilainya dengan `config/skaihub.php` (harga, kuota, blok gratis, 50, 15%) + `priceBreakdown`, `durationMonths`, `quotaNote`
- `_components/ui/subscription-banner.tsx` + `ui/subscription-status.ts` — banner terisolasi di bawah header `AcademyShell` (kuning/oranye/merah), `useSubscriptionStatus()` dan `useCanWrite()`; `academy-shell.tsx` hanya menambah satu baris `<SubscriptionBanner />`
- `academy-students-manager.tsx` (Tambah/Edit/Hapus disembunyikan), `academy-spp-manager.tsx` (Bayar/Bebaskan/Simpan dinonaktifkan), `academy-attendance-overview-manager.tsx` (Buka Absensi dinonaktifkan) saat baca-saja; Export tetap ada
- `_components/operator-dashboard-panel.tsx` — kartu MRR, ringkasan state, daftar perlu ditindaklanjuti, akademi mendekati kuota (loading/kosong/error + coba lagi); dipasang di `admin-dashboard-overview.tsx` (MRR lama berbasis harga hardcode dihapus)
- `_components/subscription-price-preview.tsx` — diekstrak dari `admin-subscription-manager.tsx` (960 → 912 baris): kuota efektif + rincian harga (paket × bulan + blok berbayar × 15%); nominal kosong = harga otomatis server
- `(compro)/harga/page.tsx` — harga & kuota dari konstanta + keterangan kuota; `(compro)/page.tsx` — kartu paket beranda ikut disinkronkan
- `_lib/admin-api.ts` — blok `// L4-D` di akhir: tipe & `getAkademiSubscriptionStatus`, `getOperatorDashboard`
- `globals.css` — token baru `--caution` (#ea580c) untuk oranye masa tenggang
- `e2e/subscription-banner.spec.ts` — E2E banner mobile (file baru, tidak mengubah `responsive.spec.ts`/`mock-api.ts`)

Test:
- `SubscriptionPricingTest` (11) — 0/1/2 blok, multi-bulan, baca config, kuota efektif 100/200/350, subtotal otomatis, trial gratis, nominal manual butuh catatan, role — LULUS
- `SubscriptionLifecycleTest` (17) — active/expiring/grace/read_only (travel), perpanjangan tercatat, cancelled diabaikan, pencatatan langganan baru membuka baca-saja, tulis ditolak 402, GET/export lolos, grace boleh tulis, super-admin tak terdampak, isolasi antar akademi, field `/me` — LULUS
- `SuperAdminDashboardTest` (3) — angka MRR, state, attention, near quota; 403 non super admin; 401 — LULUS
- Penyesuaian test lama karena keputusan pemilik (blok gratis): `StudentQuotaTest` (batas 50→100, blok +1 → 150), `AuthApiTest` (limit pro+1 blok 200→250); `test_cannot_create_active_student_without_active_subscription` kini mengharapkan 402 read_only (akademi tanpa langganan = baca-saja)
- Vitest: `plan-pricing.test.ts` (6), `subscription-banner.test.tsx` (8), `operator-dashboard-panel.test.tsx` (3), `subscription-price-preview.test.tsx` (5) — LULUS
- Playwright `subscription-banner.spec.ts` (mobile): baca-saja (banner merah di bawah header & di atas bottom nav, Tambah Siswa hilang, Export ada, tanpa scroll horizontal), akan habis (sisa hari), aktif (tanpa banner)

Verifikasi:
- `php artisan test` → 134 passed (600 assertions) (setelah perbaikan masa tenggang)
- `vendor/bin/pint --dirty` → passed
- `npm run lint` → 0 errors, 6 warnings (lama, `<img>`)
- `npm run typecheck` → 0 errors
- `npm test` → 41 files, 157 tests passed (dijalankan dengan `--pool=threads`; pool default `forks` time-out saat start worker karena mesin sedang dipakai banyak worktree)
- `npm run build` → sukses
- `PLAYWRIGHT_PORT=3840 npx playwright test --workers=1` → 54 passed (9.3m), termasuk 3 test banner L4-D (mobile; tablet/desktop lolos sebagai no-op). Catatan: dijalankan via config lokal sementara yang memperpanjang `webServer.timeout` (build di mesin yang sibuk > 120 detik); file config sementara sudah dihapus, `playwright.config.ts` tidak diubah.

## Keputusan
1. **Kode respons baca-saja: 402** (Payment Required) dengan `message` Indonesia dan `subscription_state: "read_only"`. Frontend menampilkan pesan server lewat `adminFetch`.
2. **Akademi tanpa langganan sama sekali = `read_only`** (default aman). Akibatnya test lama yang menulis data memberi akademinya langganan aktif lewat `TestCase::giveActiveSubscription()`.
3. **Hitungan hari:** hari terakhir tercakup = `ends_at − 1 detik`. `expiring` bila sisa ≤ 14 hari; `grace` hari ke-1..7 setelah hari terakhir; `read_only` mulai hari ke-8. `days_left` saat grace = sisa hari tenggang.
4. **Perpanjangan yang sudah dicatat dan menyambung** memperpanjang cakupan, jadi tidak muncul peringatan palsu.
5. **"Sampai pembayaran dicatat"** = super admin membuat langganan baru (status bayar apa pun). Siklus dihitung dari tanggal, bukan `payment_status`; tagihan belum lunas dipantau lewat alert yang sudah ada.
6. **Masa tenggang = layanan penuh** (keputusan lead, commit `fix(api): keep entitlements during grace period`). Entitlement (kuota siswa efektif, website publik, fitur paket) diambil dari langganan terbaru selama state `active`/`expiring`/`grace`; hanya `read_only` yang menghapusnya (tulis ditolak 402, halaman publik 404). Satu sumber: `SubscriptionService::entitledSubscription(Akademi)`, dipakai `entitlements()`/`assertCanAddActiveStudent`, `Akademi::hasPublicWebsite`, middleware `feature`, `/akademi/me` (`subscription` = langganan yang memberi entitlement), dashboard akademi, detail & dashboard super admin. `activeForAkademi()` kini hanya dipakai untuk snapshot `akademi.plan`. Test lama yang menegaskan sebaliknya diubah: `AuthApiTest::test_expired_subscription_does_not_grant_akademi_entitlements` dan `LandingPageEntitlementTest::test_expired_pro_cannot_access_public_endpoint` dulu memakai langganan yang berakhir **kemarin** (kini = masa tenggang); tanggal akhirnya digeser ke **10 hari lalu** (baca-saja) sehingga maksud test (langganan kedaluwarsa tidak memberi entitlement) tetap diuji. Test baru: grace hari ke-3 → bisa menambah siswa aktif dalam kuota (100) & halaman publik tampil; read_only → halaman publik 404 dan tanpa entitlement.
7. **Nominal manual** yang berbeda dari harga otomatis wajib `notes` (422). Trial = Rp 0. Durasi custom ditagih per bulan dibulatkan (min. 1).
8. **Blok gratis** dibaca dari config saat dipakai (tidak di-snapshot); `included_student_limit` tetap snapshot seperti sebelumnya.
9. **MRR** = jumlah ekuivalen bulanan (`amount / bulan`) langganan yang sedang berjalan pada akademi berstatus aktif, termasuk yang belum lunas; akademi suspended/nonaktif tidak dihitung di dashboard. Lifecycle dihitung di memori dari langganan yang di-eager-load (tanpa N+1).
10. **UI baca-saja:** aksi berbasis link (Tambah/Edit siswa) disembunyikan, tombol (Bayar, Bebaskan, Simpan, Buka Absensi) dinonaktifkan; halaman lain mengandalkan penolakan server. Status diambil sekali per muat halaman (cache modul); banner juga tampil untuk pelatih.
11. **Sinkron config ↔ frontend:** `src/lib/plan-pricing.ts` menyalin angka `config/skaihub.php` (komentar di kedua file). Harga final selalu dihitung ulang server.

## Belum dikerjakan / catatan
- Form absensi detail (`/academy/attendance/new`) dan halaman tulis lain tidak memakai `useCanWrite()`; server tetap menolak dengan pesan 402.
- Checklist Bagian B/D `PLAN-2026-10.md` tidak diubah (belum ada butir 4.4/4.7; menghindari konflik merge antarjalur).

Catatan/keputusan yang perlu pemilik project: tidak ada (no. 6 sudah diputuskan lead).
