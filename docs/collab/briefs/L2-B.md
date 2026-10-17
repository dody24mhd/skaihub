# Brief L2-B — Web: sanitasi HTML & perbaikan rute admin (D13, D14)

- **Pelaksana:** Gemini-2 · **Worktree:** `.worktrees/fase2` · **Branch:** `fase-2-pwa` (lanjutan, setelah L2-A di-merge ke `main` dan branch disinkronkan)
- **Boleh diubah:** `dojang-hub-web/src/proxy.ts`, `dojang-hub-web/next.config.ts` (hanya `redirects()`), `dojang-hub-web/src/app/(admin)/admin/**` (hapus), `dojang-hub-web/src/app/(compro)/berita/[slug]/page.tsx`, `dojang-hub-web/src/app/(compro)/event/[slug]/page.tsx`, `dojang-hub-web/src/lib/**`, `dojang-hub-web/package.json` (hanya bila dependensi sanitasi dibutuhkan), test terkait, `docs/collab/reports/L2-B.md`
- **Dilarang:** shell/komponen `_components/**` (wilayah Fase 3), `dojang-hub-api/**`.
- Dasar: `docs/AUDIT-2026-10.md` §2 F9, §4, D13, D14. Patuhi PLAN Bagian A. Baca docs Next 16 untuk `redirects` dan `proxy`.

## B1 — Sanitasi HTML (F9 / D13)
- Buat `src/lib/sanitize-html.ts` dengan fungsi `sanitizeHtml(html: string): string` yang dipakai **sebelum** `dangerouslySetInnerHTML` di halaman detail berita dan event (server components).
- Gunakan `isomorphic-dompurify` (dependensi diizinkan) dengan allowlist tag konten editor (p, br, strong, em, u, s, a[href,target,rel], ul, ol, li, h2–h4, blockquote, img[src,alt], figure, figcaption, span, code, pre). Paksa `rel="noopener noreferrer"` pada link `target=_blank`. Tolak `javascript:` dan semua `data:` URL.
- Unit test: `<script>`, `onerror=`, `javascript:` dihapus; konten format normal tetap.
- Commit: `fix(web): sanitize CMS HTML before rendering`.

## B2 — Rute admin (D14)
- Hapus seluruh `src/app/(admin)/admin/**` (stub redirect legacy).
- `next.config.ts` `redirects()`: `/admin/academy/:path*` → `/academy/:path*` (taruh lebih dulu), `/admin` → `/internal`, `/admin/:path*` → `/internal/:path*` (permanent: false).
- `src/proxy.ts` untuk subdomain `admin`: `/` → rewrite `/internal`; path yang diawali `/internal`, `/login`, `/offline` → **tidak** di-rewrite; path lain → rewrite `/internal${path}`. Subdomain akademi dan compro tidak berubah.
- Ekstrak logika pemetaan host+path → target ke fungsi murni `resolveRewrite(host, path, baseDomain)` di `src/lib/routing/resolve-rewrite.ts` + unit test tabel kasus: `admin.localhost:3000/` → `/internal`; `/login` → tidak berubah; `/internal/akademi` → tidak berubah; `/akademi` → `/internal/akademi`; `garuda.localhost:3000/` → `/a/garuda`; `localhost:3000/academy` → tidak berubah.
- Verifikasi manual: `npm run build && npm run start -- -p 3100`, lalu `curl -H "Host: admin.localhost:3100" -I http://127.0.0.1:3100/` dan `/login` → tidak 404/loop; `curl -I http://127.0.0.1:3100/admin/akademi` → 307 ke `/internal/akademi`. Matikan server.
- Commit: `fix(web): repair admin subdomain routing and drop legacy redirect stubs`.

## Verifikasi akhir
`npm run lint`, `npm run typecheck`, `npm test`, `npm run build` + cek curl di atas. Tulis `docs/collab/reports/L2-B.md`, commit `docs: report L2-B`. Berhenti.
