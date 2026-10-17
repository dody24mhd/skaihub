# Laporan Tugas L2-A — PWA Dashboard Akademi (Fase 2: 2.1–2.9)

- **Pelaksana:** Gemini-2
- **Worktree:** `.worktrees/fase2` · **Branch:** `fase-2-pwa`
- **Tanggal:** 2026-10-17

---

Tugas: L2-A — PWA Dashboard Akademi (Fase 2: 2.1–2.9)

Diubah:
- `dojang-hub-web/design/icon-master.svg` — Master vector SVG logo bertema bela diri taekwondo (navy #031636, merah #d32f2f, putih kontras)
- `dojang-hub-web/scripts/gen-icons.mjs` — Script otomatis pembuat icon PNG (192, 512, maskable 512 dalam safe zone 80%, apple-touch 180) dengan sharp
- `dojang-hub-web/public/icons/*` — PNG icon PWA (192, 512, maskable-512, apple-touch-180)
- `dojang-hub-web/package.json` — Penambahan script npm `icons`
- `dojang-hub-web/public/manifest-academy.webmanifest` — Web App Manifest untuk dashboard akademi (scope & id: `/academy`, start_url: `/academy?source=pwa`)
- `dojang-hub-web/src/app/(admin)/academy/layout.tsx` — Server component layout academy dengan metadata manifest, appleWebApp, viewport, dan komponen PWA
- `dojang-hub-web/public/sw.js` — Service worker manual sesuai C2: precache offline/icon/fonts, cache-first `_next/static`, network-first `/academy` tanpa simpan respons HTML, bypass auth/API
- `dojang-hub-web/src/app/offline/page.tsx` & `reload-button.tsx` — Halaman fallback offline bermerek statis dengan metadata `robots: noindex` dan tombol reload
- `dojang-hub-web/src/lib/pwa/update-manager.ts` — Logika murni registrasi SW dan handler update SKIP_WAITING
- `dojang-hub-web/src/app/(admin)/_components/pwa/sw-register.tsx` — Registrasi SW di production dengan `updateViaCache: none` dan reload pada controllerchange setelah tombol ditekan
- `dojang-hub-web/src/app/(admin)/_components/pwa/update-toast.tsx` — Toast notifikasi versi baru dan tombol reload
- `dojang-hub-web/src/lib/pwa/install-prompt-logic.ts` — Logika murni kelayakan install prompt (beforeinstallprompt, iOS Safari, display-mode standalone, suppress 30 hari)
- `dojang-hub-web/src/app/(admin)/_components/pwa/install-prompt.tsx` — Komponen prompt pasang aplikasi dengan touch target ≥44px dan aman safe-area inset
- `dojang-hub-web/next.config.ts` — Headers keamanan (nosniff, strict-origin), Cache-Control no-cache untuk sw.js, Content-Type untuk sw.js dan webmanifest
- `dojang-hub-web/src/app/(admin)/_components/academy-shell.tsx` — Pengiriman pesan `{ type: "LOGOUT" }` ke SW controller saat logout

Test:
- `src/lib/pwa/__tests__/manifest.test.ts` — 4 passed (LULUS)
- `src/lib/pwa/__tests__/sw.test.ts` — 6 passed (LULUS)
- `src/app/offline/__tests__/offline.test.tsx` — 3 passed (LULUS)
- `src/lib/pwa/__tests__/update-manager.test.ts` — 6 passed (LULUS)
- `src/app/(admin)/_components/pwa/__tests__/update-toast.test.tsx` — 2 passed (LULUS)
- `src/lib/pwa/__tests__/install-prompt-logic.test.ts` — 8 passed (LULUS)
- `src/app/(admin)/_components/pwa/__tests__/install-prompt.test.tsx` — 3 passed (LULUS)
- `src/lib/pwa/__tests__/headers.test.ts` — 1 passed (LULUS)
- `src/app/(admin)/_components/__tests__/academy-shell-logout.test.tsx` — 1 passed (LULUS)
- Total test suite: 10 test files, 34 unit tests (100% LULUS)

Verifikasi:
- `npm run lint` → 0 errors (13 pre-existing image warnings di file profil/tenant lama)
- `npm run typecheck` → 0 errors (tsc --noEmit sukses)
- `npm test` → 10 passed, 34 passed
- `npm run build` → sukses mengompilasi 67 rute (termasuk static `/offline` dan `/academy`)
- Server test di port 3100 via `curl`:
  - `http://localhost:3100/academy`: Memiliki `<link rel="manifest" href="/manifest-academy.webmanifest">`
  - `http://localhost:3100/` & `/berita`: Tidak memiliki `rel="manifest"`
  - `http://localhost:3100/sw.js`: HTTP 200 dengan `Cache-Control: no-cache, no-store, must-revalidate` dan `Content-Type: application/javascript; charset=utf-8`
  - `http://localhost:3100/manifest-academy.webmanifest`: HTTP 200 dengan `Content-Type: application/manifest+json`
  - `http://localhost:3100/offline`: HTTP 200 dengan markup bermerek "Anda sedang offline" dan `robots: noindex, nofollow`
  - Server port 3100 telah dimatikan setelah pengujian.

Catatan/keputusan yang perlu pemilik project: tidak ada
