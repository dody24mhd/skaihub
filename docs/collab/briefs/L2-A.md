# Brief L2-A — PWA dashboard akademi (Fase 2: 2.1–2.9)

- **Pelaksana:** Gemini-2
- **Worktree:** `.worktrees/fase2` · **Branch:** `fase-2-pwa`
- **Boleh diubah:** `dojang-hub-web/**`, `docs/collab/reports/L2-A.md`
- **Dilarang:** `dojang-hub-api/**`, file lain di `docs/`, tampilan/komponen yang tidak disebut di bawah (perombakan responsive = Fase 3, bukan sekarang).
- Wajib patuhi `docs/PLAN-2026-10.md` Bagian A (A1–A9) dan C2.
- **Wajib baca dulu:** `dojang-hub-web/node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`, `.../03-api-reference/03-file-conventions/01-metadata/manifest.md`, dan panduan `generateMetadata`/`generateViewport` di folder docs yang sama. Next 16 berbeda dari pengetahuan lama Anda.

## Keputusan lead (mengikat)
- **Hanya dashboard akademi** (`/academy/*`) yang installable. Admin internal **tidak** di fase ini. Compro (`/`, `/berita`, …) dan landing tenant (`/a/[slug]`) **tidak boleh** punya `<link rel="manifest">` dan **tidak boleh** mendaftarkan service worker.
- Jangan pakai `src/app/manifest.ts` di root (akan tertaut ke semua halaman). Pakai **file statis** `public/manifest-academy.webmanifest` (JSON) dan tautkan lewat `metadata.manifest` di layout academy.
- Service worker ditulis manual di `public/sw.js` (tanpa Serwist/next-pwa).
- Konteks rute: setiap `page.tsx` di `src/app/(admin)/academy/**` sudah merender `<AcademyShell>` sendiri. Saat ini **tidak ada** `layout.tsx` di `src/app/(admin)/academy/`.

## Tugas (satu commit per tugas)
**2.1 Ikon** — `design/icon-master.svg` (di dalam `dojang-hub-web/`): simbol sederhana bertema bela diri, latar navy `#031636`, aksen merah `#d32f2f`, putih untuk kontras; tanpa teks kecil. Script `scripts/gen-icons.mjs` menghasilkan ke `public/icons/`: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (konten dalam safe zone 80%, latar penuh navy), `apple-touch-icon-180.png`. Pakai `sharp` bila sudah ada di `node_modules` (cek `node -e "require('sharp')"`); jika tidak ada, boleh tambah `sharp` sebagai **devDependency** saja. Tambah script npm `icons`. Commit PNG hasilnya.

**2.2 Manifest** — `public/manifest-academy.webmanifest`: `id: "/academy"`, `name: "SKAIHUB Akademi"`, `short_name: "SKAIHUB"`, `start_url: "/academy?source=pwa"`, `scope: "/academy"`, `display: "standalone"`, `orientation: "portrait"`, `background_color: "#ffffff"`, `theme_color: "#031636"`, `lang: "id"`, ikon 192/512/maskable (`purpose: "maskable"`). Unit test Vitest `src/lib/pwa/__tests__/manifest.test.ts` yang membaca file JSON itu dan memastikan: start_url di dalam scope, semua path ikon ada di `public/`, ada ikon maskable, warna sesuai.

**2.3 Layout academy** — `src/app/(admin)/academy/layout.tsx` (server component) yang hanya: export `metadata` (`manifest: "/manifest-academy.webmanifest"`, `appleWebApp: { capable: true, title: "SKAIHUB Akademi", statusBarStyle: "black-translucent" }`, `icons.apple`), export `viewport` (`themeColor: "#031636"`, `viewportFit: "cover"`, `width: "device-width"`, `initialScale: 1`), lalu merender `{children}` + `<SwRegister />` + `<UpdateToast />` + `<InstallPrompt />`. Jangan mengubah halaman-halaman academy.

**2.4 Service worker** — `public/sw.js` mengikuti **C2**: `VERSION`; precache `/offline` + ikon + font di `public/fonts/`; cache-first `/_next/static/`; network-first untuk navigasi di bawah `/academy` dengan fallback `/offline` (respons HTML **tidak disimpan**); lewatkan semua request lintas-origin & yang ber-header `Authorization`; abaikan path lain; `activate` menghapus cache versi lama; pesan `SKIP_WAITING` dan `LOGOUT` (hapus cache runtime). Registrasi: daftarkan `/sw.js` dengan scope `/`, tetapi handler `fetch` **hanya** bertindak pada `/academy*`, `/_next/static/`, `/offline`, `/icons/`, `/fonts/` — semua lainnya `return` tanpa `respondWith`.

**2.5 Halaman offline** — `src/app/offline/page.tsx`: statis, bermerek (navy/merah, font proyek), pesan "Anda sedang offline", tombol "Coba lagi" (reload). Tidak bergantung API; `robots: noindex`.

**2.6 Registrasi & update** — `src/app/(admin)/_components/pwa/sw-register.tsx` (client; hanya bila `process.env.NODE_ENV === "production"`; `updateViaCache: "none"`), `pwa/update-toast.tsx` ("Versi baru tersedia" + tombol "Muat ulang" → kirim `SKIP_WAITING`, reload sekali saat `controllerchange`; **tanpa reload otomatis**). Logika state dipisah ke fungsi murni yang di-unit-test.

**2.7 Install prompt** — `pwa/install-prompt.tsx`: Android/Chromium `beforeinstallprompt` → tombol "Pasang aplikasi"; iOS Safari (bukan standalone) → kartu instruksi "Bagikan → Tambah ke Layar Utama"; disembunyikan bila `display-mode: standalone`; tombol tutup menyimpan waktu tutup di localStorage (try/catch) dan menyembunyikan 30 hari. Fungsi murni `shouldShowInstallPrompt({...})` + unit test. Kecil, tidak menutupi konten (bar bawah, sadar `env(safe-area-inset-bottom)`), target sentuh ≥44px.

**2.8 Header** — `next.config.ts` `headers()`: `/sw.js` → `Cache-Control: no-cache, no-store, must-revalidate`, `Content-Type: application/javascript; charset=utf-8`; `/manifest-academy.webmanifest` → `Content-Type: application/manifest+json`; global `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. Jangan mengubah konfigurasi lain.

**2.9 Logout** — di `src/app/(admin)/_components/academy-shell.tsx` fungsi logout: kirim `{ type: "LOGOUT" }` ke `navigator.serviceWorker?.controller` bila ada. Perubahan minimal; jangan menyentuh bagian lain shell.

## Verifikasi akhir (wajib, tempel output ringkas di laporan)
```
cd dojang-hub-web
npm run lint
npm run typecheck
npm test
npm run build
```
Plus cek via `npm run start -- -p 3100` + `curl`: HTML `/academy` berisi `rel="manifest"`; `/` dan `/berita` **tidak**; `/sw.js` dan `/manifest-academy.webmanifest` 200 dengan header yang benar. Matikan server setelahnya. Tulis `docs/collab/reports/L2-A.md` (A7) lalu commit `docs: report L2-A`. Berhenti.
