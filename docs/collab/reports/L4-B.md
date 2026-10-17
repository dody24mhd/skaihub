# Laporan Tugas L4-B — SPP default, jatuh tempo, Terlambat, tunggakan, kwitansi, audit (4.2)

- **Pelaksana:** Claude (agent)
- **Worktree:** `.worktrees/fase4-b` · **Branch:** `fase-4-spp`
- **Tanggal:** 2026-10-17

---

Tugas: L4-B — SPP default, jatuh tempo, Terlambat, tunggakan, kwitansi, audit

Diubah (backend, `dojang-hub-api`):
- `database/migrations/2026_10_18_020001_create_academy_spp_settings_table.php` — tabel baru `academy_spp_settings` (`akademi_id` unik, `default_monthly_amount` nullable, `due_day` default 10)
- `database/migrations/2026_10_18_020002_create_spp_bill_events_table.php` — tabel audit `spp_bill_events` (created/payment/waived/payment_voided)
- `database/migrations/2026_10_18_020003_add_receipt_number_to_spp_payments_table.php` — kolom `receipt_number` + unique `(akademi_id, receipt_number)` + backfill pembayaran lama per akademi/bulan
- `app/Models/AcademySppSetting.php`, `app/Models/SppBillEvent.php` (baru)
- `app/Models/SppBill.php` — atribut terhitung `is_overdue` (di-append), scope `overdue()`, konstanta `OPEN_STATUSES`
- `app/Models/SppPayment.php` — `receipt_number` fillable, `nextReceiptNumber()` (`KW-YYYYMM-0001`, urut per akademi per bulan `paid_at`)
- `app/Http/Controllers/Akademi/SppSettingController.php` (baru) — `GET|PUT /akademi/spp-settings` (Ketua/Admin)
- `app/Http/Controllers/Akademi/SppReceiptController.php` (baru) — `GET /akademi/spp-payments/{payment}/receipt`
- `app/Http/Controllers/Akademi/SppBillController.php` — generate: nominal = override kelas ?? `default_amount` ?? default akademi, `due_date` default = `due_day` bulan tagihan, event `created`; index: filter `?overdue=1`; `arrears()` baru; pay: nomor kwitansi + event `payment` (lock + validasi `proof_url` tetap); waive: transaksi + lock, tolak tagihan lunas/sudah dibebaskan, `reason` wajib bila sudah dibayar sebagian, event `waived`
- `routes/api.php` — blok `// L4-B` (4 route)

Diubah (frontend, `dojang-hub-web`):
- `src/app/(admin)/_lib/admin-api.ts` — `SppPayment.receipt_number`, `SppBill.is_overdue` (opsional), filter `overdue`, `waiveAkademiSppBill(..., reason)`; blok `// L4-B` di akhir: tipe `SppSettings`, `SppArrear`, `SppReceipt` + `get/updateAkademiSppSettings`, `getAkademiSppArrears`, `getAkademiSppReceipt`
- `_components/academy-spp-manager.tsx` — tombol ⚙ "Pengaturan SPP", opsi filter "Terlambat", tab Tagihan/Tunggakan (Ketua/Admin), modal bebaskan, tautan "Lihat kwitansi" setelah bayar (245 → 317 baris; daftar tagihan per kelas diekstrak ke `spp/spp-class-bills.tsx`)
- `_components/spp/spp-settings-modal.tsx`, `spp-arrears-section.tsx`, `spp-waive-modal.tsx`, `spp-class-bills.tsx`, `spp-receipt.ts`, `spp-receipt-view.tsx` (baru, semuanya < 160 baris)
- `_components/spp/spp-bill-columns.tsx` — badge **Terlambat**, kolom "Kwitansi" (tautan per pembayaran)
- `_components/spp/spp-generate.ts`, `spp-generate-modal.tsx` — nominal tidak wajib bila akademi punya default; petunjuk tanggal jatuh tempo dari pengaturan
- `_components/spp/spp-payment-modal.tsx` — `onPaid` menerima tagihan hasil bayar (untuk tautan kwitansi)
- `src/app/(admin)/academy/spp/receipts/[paymentId]/page.tsx` (baru) — halaman kwitansi (tanpa shell; cetak via `@media print`)
- `e2e/fixtures/mock-api-spp-l4b.ts` (baru), `e2e/responsive.spec.ts` — blok `// L4-B` (3 alur mobile)

Commit:
- `1eb0d79` feat(api): academy SPP settings with default amount and due day
- `6002fc2` feat(api): overdue SPP flag, overdue filter, and arrears report
- `86ca9e7` feat(api): SPP bill audit events and waive reason
- `96e6e75` feat(api): SPP payment receipt numbers and receipt endpoint
- `e242c61` feat(web): SPP settings sheet and generate dialog defaults
- `f5e467d` feat(web): overdue badge, Terlambat filter, arrears tab, and waive reason
- `4b1e96c` feat(web): printable SPP receipt page with WhatsApp share
- `a806740` test(e2e): mobile SPP settings, overdue, arrears, payment and receipt flow
- docs: report L4-B (commit ini)

Test (Laravel, feature — semua LULUS; RED dicek sebelum implementasi untuk overdue/arrears, audit, kwitansi):
- `SppSettingsTest` — 9 (default bila belum diatur, update Ketua, validasi 422, pelatih 403, isolasi tenant, fallback nominal kelas → request → akademi, siswa tanpa sumber nominal dilewati, `due_date` dari `due_day`, fallback tanggal 10 & `due_date` eksplisit)
- `SppOverdueArrearsTest` — 4 (`is_overdue` hanya unpaid/partial lewat jatuh tempo, index + `overdue=1`, tunggakan per siswa urut total sisa, tenant & pelatih 403)
- `SppBillEventTest` — 6 (event created/payment/waived, waive parsial wajib `reason`, tolak waive tagihan lunas, tenant 404)
- `SppReceiptTest` — 5 (nomor berurutan per bulan, per akademi, unik dalam akademi, isi kwitansi + sisa saat pembayaran itu, tenant 404 / pelatih 403)

Test (Vitest — semua LULUS):
- `spp-settings-modal` 4, `academy-spp-manager` 5 (⚙ simpan, filter Terlambat → `overdue: true`, tab Tunggakan, tautan kwitansi setelah bayar, pelatih tanpa ⚙), `spp-arrears-section` 3, `spp-waive-modal` 3, `spp-receipt` 4, `spp-receipt-view` 4, tambahan di `spp-bill-columns` (+2), `spp-generate` (+1), `spp-generate-modal` (+1)

Test (E2E Playwright, mobile):
- pengaturan SPP disimpan dari SheetModal (payload PUT diverifikasi) — LULUS
- tagihan terlambat ditandai, tab Tunggakan tampil, tanpa scroll horizontal — LULUS
- bayar → "Lihat kwitansi" → halaman kwitansi (nomor, periode, link `wa.me/62…`), tanpa scroll horizontal, mode `print` menyembunyikan toolbar (screenshot `e2e/__screenshots__/academy-spp-receipt-print-mobile.png` dicek) — LULUS

Verifikasi:
- `php artisan test` → 127 passed (628 assertions)
- `vendor/bin/pint --dirty` → passed
- `npm run lint` → 0 error, 6 warning (`no-img-element` di file lain, sudah ada)
- `npm run typecheck` → 0 error
- `npm test` → 47 file, 163 test lulus
- `npm run build` → sukses
- `PLAYWRIGHT_PORT=3820 npx playwright test --workers=1` → 64 passed, 14 skipped (alur khusus HP di tablet/desktop), 0 gagal (10.8 menit)

## Keputusan
1. **Arti "tunggakan"** = tagihan `unpaid`/`partial` dengan `due_date < hari ini` (definisi sama dengan `is_overdue`), dijumlahkan per siswa. Tagihan lama tanpa `due_date` tidak pernah dianggap terlambat; tagihan baru selalu punya `due_date` (default dari pengaturan).
2. **Filter "Terlambat"** digabung dengan filter tahun/bulan yang sedang dipilih; lintas bulan dilihat di tab Tunggakan.
3. **Waive**: selain aturan brief (parsial wajib `reason`), tagihan `paid`/`waived` kini ditolak (422) — sebelumnya tagihan lunas bisa diubah menjadi "dibebaskan". Nilai event `waived` = sisa yang dibebaskan. `window.confirm` diganti SheetModal.
4. **Nomor kwitansi** memakai bulan `paid_at`, diserialisasi dengan `lockForUpdate` baris akademi (selain lock tagihan yang sudah ada) + unique index sebagai jaring pengaman. Pembayaran lama di-backfill di migrasi (urut `paid_at`, `id`).
5. **Sisa di kwitansi** dihitung sampai pembayaran tersebut (bukan sisa saat ini), 0 bila tagihan sudah dibebaskan.
6. **WhatsApp**: nomor wali, jika kosong nomor siswa (siswa dewasa); tanpa nomor tombol disembunyikan dan ada keterangan. Normalisasi `0…`/`+62…`/`8…` → `62…`. Tidak ada pengiriman otomatis.
7. **Halaman kwitansi tanpa AcademyShell** agar cetak bersih dan shell (milik jalur lain) tidak disentuh; `@page { size: portrait }` sehingga A5/A4 dipilih di dialog cetak; saat print hanya `.spp-receipt` yang terlihat.
8. `spp_bill_events.type` enum memuat `payment_voided` sesuai brief, tetapi belum ada endpoint void (tidak diminta).
9. Pengaturan SPP dibaca terpisah dan hanya untuk Ketua/Admin; bila gagal dimuat, dialog generate kembali mewajibkan nominal (aman).

## Belum dikerjakan / catatan untuk lead
- Tidak ada endpoint/UI untuk membaca riwayat audit (`spp_bill_events`) — brief hanya meminta penulisan.
- Tidak ada test khusus untuk backfill `receipt_number` pada data lama (logika migrasi sederhana; tidak dijalankan pada pgsql lokal sesuai larangan).
- `academy-spp-manager.tsx` bertambah 72 baris (masih < 400) meski sebagian diekstrak.
- Konflik merge yang diperkirakan: blok `// L4-B` di `routes/api.php`, ekor `admin-api.ts`, dan akhir `e2e/responsive.spec.ts`; `SppBillController` mungkin juga disentuh jalur lain — perubahan saya ada di dalam method.
