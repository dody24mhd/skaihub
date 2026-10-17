# Review L1-B + L1-C — CHANGES_REQUESTED

Reviewer: lead (Claude) + security-reviewer agent. Hasil: 92 test lulus (sqlite); migrasi up → seed → rollback → up lulus di pgsql. Perbaiki butir berikut, **satu commit per butir**, masing-masing dengan test yang gagal dulu lalu lulus. Migrasi bertanggal `2026_10_17_*` **belum pernah di-merge ke main**, jadi BOLEH diedit langsung (pengecualian A8.1 khusus file-file itu).

| # | Sev | Lokasi | Perbaikan wajib |
|---|---|---|---|
| R1 | HIGH | `SppBillController.php` ±132-140 (B6) | `proof_url` bisa di-bypass dengan `../`, `%2e%2e`, `\`, `?`/`#`. Parse URL → `rawurldecode(path)`; tolak jika mengandung segmen `..`, `\`, karakter kontrol; path wajib diawali `/storage/akademi/{akademi_id}/`; pastikan `Storage::disk('public')->exists(<relatif>)`. Test: `../2/x.jpg`, `%2e%2e`, backslash, query/fragment, file milik akademi lain → 422; file sah → 201. |
| R2 | HIGH | `SportRankController.php` ±67-82 + migrasi `2026_10_17_000004` | Menghapus sabuk menghapus riwayat (cascade). Tambahkan cek `StudentRankHistory` di `$isUsed`, dan ubah FK `sport_rank_id` menjadi `restrictOnDelete()`. Test: sabuk yang punya riwayat → hapus ditolak 422. |
| R3 | MEDIUM | `RankPromotionController.php` ±172-186 | Riwayat UKT tidak idempoten. Pakai `updateOrCreate` berkunci `rank_promotion_participant_id`; saat hasil dikembalikan dari `passed` ke lainnya, hapus baris riwayat itu. Test: PATCH passed dua kali → 1 baris; revert → 0 baris & current rank kembali. |
| R4 | MEDIUM | migrasi `2026_10_17_000001` | Di pgsql, unique `(akademi_id, sport_type, code)` tidak mencegah duplikat global (NULL). Tambahkan partial unique index `(sport_type, code) WHERE akademi_id IS NULL` (pgsql & sqlite mendukung partial index). Pakai `DROP CONSTRAINT IF EXISTS` untuk nama constraint lama. |
| R5 | MEDIUM | migrasi `2026_10_17_000002` `down()` | Sebelum memasang CHECK lama, `UPDATE training_attendances SET status='excused' WHERE status='sick'`. |
| R6 | MEDIUM | migrasi `2026_10_17_000003` | Setelah backfill, hapus/laporkan orphan lalu jadikan `akademi_id` NOT NULL (aman di kedua driver; di sqlite lewat `->change()`). Bila ada orphan (bill hilang), isi dari `spp_bills` termasuk yang soft-deleted (`withTrashed` / tanpa filter deleted_at). |
| R7 | MEDIUM | `ExportController.php` ±63 (B7) | Jangan menambah `'` pada angka negatif murni (`/^-?\d+(\.\d+)?$/`). Tetap lindungi `=`, `+`, `@`, tab, CR, spasi di depan rumus, dan varian fullwidth `＝＋－＠`. Test kedua kasus. |
| R8 | MEDIUM | `EnsureSuperAdmin.php`, `routes/api.php` (B1) | Super admin nonaktif masih punya akses; `auth/me` & `auth/logout` tidak cek `is_active`. Buat satu middleware `EnsureActiveUser` (alias `active`) dan pasang di semua grup `auth:sanctum`. Test: super admin nonaktif → 401; `auth/me` user nonaktif → 401. |
| R9 | LOW | `StudentController.php` ±192 | Catatan riwayat sabuk manual jangan memakai `notes` siswa; isi `null` (atau field `rank_notes` opsional di request). |
| R10 | LOW | `SuperAdmin/AkademiController.php` ±169 | Ganti `DB::table('personal_access_tokens')` + string morph dengan `PersonalAccessToken::whereIn('tokenable_id', ...)->where('tokenable_type', (new User)->getMorphClass())`. |

Catatan (tidak perlu diubah): login menghapus token lama dengan nama sama → satu sesi per user. Ini disengaja untuk MVP; sebutkan di laporan.

Setelah selesai: `php artisan test`, `vendor/bin/pint --dirty`, perbarui `docs/collab/reports/L1-C.md` dengan bagian "Perbaikan review", commit `docs: address review L1-BC`. Berhenti.
