# Laporan L5-D — Ops & polish (5.5, 5.6)

- **Pelaksana:** Claude agent (Opus 5.5)
- **Worktree:** `.worktrees/fase5-d` · **Branch:** `fase-5-ops`
- **Tanggal:** 2026-10-17

---

Tugas: L5-D — sanitizer kelas `ql-*` + `h1`, `GET /api/health`, `docs/DEPLOY.md`, `.env.example` API.

Diubah:
- `dojang-hub-web/src/lib/sanitize-html.ts`: menambahkan tag `h1`. Atribut `class` kini boleh di semua tag yang diizinkan, **hanya bila setiap token** cocok `^ql-[a-z0-9]+(-[a-z0-9]+)*$`. Spasi dinormalkan. Aturan atribut `a`/`img` dan cek URL tidak berubah (diekstrak ke `isAllowedAttribute`).
- `dojang-hub-web/src/lib/__tests__/sanitize-html.test.ts`: 7 test baru untuk h1, kelas align/indent yang dipertahankan, token campuran, nilai yang hanya mirip ql-, whitespace, atribut lain di samping class yang valid, dan class di `<a>` dengan `javascript:`.
- `dojang-hub-web/src/app/globals.css`: CSS publik untuk `.ql-align-{center,right,justify}` dan `.ql-indent-1..8`. CSS Quill hanya berlaku di dalam `.ql-editor`, jadi tanpa ini kelas yang dipertahankan tidak berefek di halaman berita/event.
- `dojang-hub-web/src/app/(admin)/_components/rich-text-editor.tsx`: menambahkan tombol `align` di toolbar Quill.
- `dojang-hub-api/app/Http/Controllers/HealthController.php` (baru): `select 1`. Bila berhasil, `200 {status:"ok", db:true, time}`. Bila gagal, `503 {status:"error", db:false, time}` dan detail error hanya masuk log. Header `Cache-Control: no-store`.
- `dojang-hub-api/routes/api.php`: blok `// L5-D` berisi `Route::get('health', HealthController::class)`, tanpa auth dan tanpa throttle (tidak ada throttle global pada grup api).
- `dojang-hub-api/tests/Feature/HealthCheckTest.php` (baru): 3 test.
- `dojang-hub-api/.env.example`: catatan produksi untuk `SANCTUM_EXPIRATION`, `CORS_ALLOWED_ORIGINS`, dan `DB_SSLMODE`. `ADMIN_API_TOKEN` dikosongkan (F11). Variabel `SUPER_ADMIN_*` ditulis sebagai komentar.
- `docs/DEPLOY.md` (baru): arsitektur, env produksi (F11/F12), langkah server, DNS/wildcard SSL, urutan rilis, rollback, backup dan uji restore, monitoring `/api/health`, checklist keamanan. Syarat Vercel diverifikasi via web pada 2026-10-17, URL dikutip.

Commit:
- `9b9f259` feat(api): add unauthenticated /api/health endpoint with db check
- `2c4de70` chore(api): document production env vars in .env.example
- `9593af9` docs: add production deployment guide
- `465818e` feat(web): keep Quill ql-* alignment classes and h1 in sanitized HTML
- (commit laporan ini)

Test:
- `HealthCheckTest::test_health_returns_ok_without_authentication` — LULUS
- `HealthCheckTest::test_health_reports_database_down_with_503_without_leaking_details` — LULUS
- `HealthCheckTest::test_health_is_not_strictly_rate_limited` (40 request berturut-turut) — LULUS
- `sanitize-html.test.ts` — 15/15 LULUS (sebelum implementasi: 5 gagal, 10 lulus. Test "drops ..." sudah lulus sejak awal karena sanitizer lama membuang semua class)

Verifikasi (dijalankan berurutan di worktree):
- `php artisan test` → 106 passed (563 assertions)
- `vendor/bin/pint --dirty` → passed
- `npm run lint` → 0 errors, 6 warnings (semua `no-img-element` lama di `src/app/(tenant)/a/[slug]/*`, bukan dari jalur ini)
- `npm run typecheck` → sukses (tanpa error)
- `npm test` → 36 files, 141 tests passed
- `npm run build` → sukses

## Keputusan
1. **Class campuran dibuang seluruhnya**, bukan disaring per token. `class="ql-align-center evil"` menghasilkan tanpa class. Alasan: aturan lebih sederhana dan ketat, serta konten Quill asli tidak pernah mencampur kelas lain. Token harus huruf kecil, angka, dan tanda hubung. `ql-`, `QL-ALIGN-CENTER`, `ql-align_center`, dan nilai yang memuat kutip ditolak.
2. **Health DB mati → HTTP 503 + `status:"error"`**, bukan `status:"ok", db:false` dengan 200. Alasan: monitor uptime berbasis kode HTTP langsung mendeteksi. Bentuk field tetap `{status, db, time}` sesuai brief.
3. **Tanpa throttle** pada `/api/health`. Query-nya `select 1` sehingga sangat murah, dan grup api tidak memiliki throttle global.
4. Menambahkan CSS `ql-*` dan tombol align di editor, di luar teks brief yang hanya menyebut sanitizer. Tanpa keduanya fitur perataan tidak terlihat di halaman publik dan tidak bisa dibuat dari editor. Masing-masing perubahan kecil.
5. `.env.example`: `SUPER_ADMIN_*` sengaja dibiarkan sebagai komentar. Nilai kosong akan mengalahkan default `env()` di `SuperAdminSeeder` dan merusak `migrate --seed` lokal.

## Temuan untuk lead (tidak diperbaiki, di luar wilayah L5-D)
- **Blokir rilis — routing subdomain:** `src/lib/routing/resolve-rewrite.ts` memperlakukan semua subdomain selain `admin` sebagai slug akademi. Akibatnya `app.skaihub.com` (disebut di UI super admin `admin-akademi-manager.tsx` sebagai alamat login akademi) di-rewrite ke `/a/app/...`, begitu pula `www`. Perlu daftar subdomain cadangan (`www`, `app`, `api`) dan larangan slug tersebut di API. Sudah dicatat di DEPLOY.md §4.
- `next.config.ts` → `images.remotePatterns` hanya berisi `localhost:8000`/`127.0.0.1:8000`. Host API produksi perlu ditambahkan bila `next/image` merender file `/storage`.
- Upload memakai disk `public` secara hardcode, sehingga hosting API wajib punya disk persisten. Pindah ke S3/R2 butuh perubahan kode.
- Fase 4 belum di-merge di branch ini (`config/skaihub.php` belum ada). Env Fase 4 tidak dapat diverifikasi. Menurut brief L4, angka paket ada di file konfigurasi, bukan `.env`. Periksa ulang `.env.example` setelah merge.

Catatan/keputusan yang perlu pemilik project: paket Vercel Pro (komersial wajib; $20/kursi developer/bulan per 2026-10-17) dan pilihan penyedia VPS + PostgreSQL terkelola.
