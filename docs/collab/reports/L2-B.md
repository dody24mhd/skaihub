# Laporan Tugas L2-B — Web: sanitasi HTML & perbaikan rute admin (D13, D14)

- **Pelaksana:** Gemini-2
- **Worktree:** `.worktrees/fase2` · **Branch:** `fase-2-pwa`
- **Tanggal:** 2026-10-17

---

Tugas: L2-B — Web: sanitasi HTML & perbaikan rute admin (D13, D14)

Diubah:
- `dojang-hub-web/package.json` & `package-lock.json` — Penambahan dependensi `isomorphic-dompurify` (diizinkan pada brief dan D13)
- `dojang-hub-web/src/lib/sanitize-html.ts` — Fungsi pembantu `sanitizeHtml(html)` berbasis `isomorphic-dompurify` dengan allowlist tag editor (p, br, strong, em, u, s, a[href,target,rel], ul, ol, li, h2–h4, blockquote, img[src,alt], figure, figcaption, span, code, pre), rel="noopener noreferrer" otomatis untuk link target="_blank", serta penolakan skrip, event handler (onerror, onclick), dan skema URL berbahaya (javascript:, data:, vbscript:)
- `dojang-hub-web/src/app/(compro)/berita/[slug]/page.tsx` — Pengamanan rendering konten berita dengan `sanitizeHtml(post.content)` sebelum `dangerouslySetInnerHTML`
- `dojang-hub-web/src/app/(compro)/event/[slug]/page.tsx` — Pengamanan rendering deskripsi event dengan `sanitizeHtml(event.description || "")` sebelum `dangerouslySetInnerHTML`
- `dojang-hub-web/src/lib/routing/resolve-rewrite.ts` — Fungsi murni `resolveRewrite(host, path, baseDomain)` untuk pemetaan rewrite subdomain (admin `/` → `/internal`; path diawali `/internal`, `/login`, `/offline` tidak di-rewrite; path lain pada admin → `/internal${path}`; akademi → `/a/:subdomain`; compro/main domain/IP → null/tidak berubah)
- `dojang-hub-web/src/proxy.ts` — Delegasi logika rewrite subdomain ke `resolveRewrite`
- `dojang-hub-web/next.config.ts` — Konfigurasi `redirects()` di level framework: `/admin/academy/:path*` → `/academy/:path*`, `/admin` → `/internal`, `/admin/:path*` → `/internal/:path*` (`permanent: false`)
- `dojang-hub-web/src/app/(admin)/admin/**` — Penghapusan 21 stub redirect legacy yang kini ditangani langsung oleh `next.config.ts`

Test:
- `src/lib/__tests__/sanitize-html.test.ts` — 8 passed (LULUS)
  - Penghapusan `<script>` dan pemblokiran eksekusi javascript
  - Penghapusan inline event handler (onerror, onclick)
  - Penghapusan URL javascript: pada link
  - Penghapusan URL data: pada link dan image
  - Penambahan otomatis rel="noopener noreferrer" pada target="_blank"
  - Preservasi konten rich-text editor standar
  - Pembersihan tag terlarang (iframe, style, form, button, dll)
  - Penanganan input kosong/non-string secara aman
- `src/lib/routing/__tests__/resolve-rewrite.test.ts` — 16 passed (LULUS)
  - Tabel kasus brief: admin root ke `/internal`, `/login` tidak berubah, `/internal/akademi` tidak berubah, `/akademi` ke `/internal/akademi`, `garuda` root ke `/a/garuda`, base domain `/academy` tidak berubah
  - Kasus edge admin: `/offline` tidak berubah, `/internal/*` tidak berubah, path admin lain ke `/internal/*`, variasi port dev (3100)
  - Kasus subdomain akademi dengan path child
  - Kasus domain compro / main domain dan IP address
  - Kasus domain format produksi (`admin.skaihub.com`, `garuda.skaihub.com`, `skaihub.com`)
- Total test suite: 12 test files, 58 unit tests (100% LULUS)

Verifikasi:
- `npm run lint` → 0 errors (13 warnings pra-ada terkait `<img>` di komponen tenant/profil)
- `npm run typecheck` → 0 errors (`tsc --noEmit` sukses)
- `npm test` → 12 test files passed, 58 tests passed
- `npm run build` → sukses mengompilasi dan mengoptimasi 46 static pages
- Verifikasi server manual di port 3100 (`npm run start -- -p 3100`):
  - `curl -H "Host: admin.localhost:3100" -I http://127.0.0.1:3100/` → `HTTP/1.1 200 OK`, `x-middleware-rewrite: /internal`
  - `curl -H "Host: admin.localhost:3100" -I http://127.0.0.1:3100/login` → `HTTP/1.1 200 OK` (tanpa rewrite / tanpa redirect loop / tanpa 404)
  - `curl -I http://127.0.0.1:3100/admin/akademi` → `HTTP/1.1 307 Temporary Redirect` ke `/internal/akademi`
  - `curl -I http://127.0.0.1:3100/admin/academy/students` → `HTTP/1.1 307 Temporary Redirect` ke `/academy/students`
  - Server port 3100 telah dimatikan dan port dipastikan bebas (`netstat` socket released).

Catatan/keputusan yang perlu pemilik project: tidak ada
