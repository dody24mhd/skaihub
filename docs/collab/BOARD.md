# BOARD — Koordinasi Multi-AI

> Dikelola oleh lead (Claude). Pelaksana hanya membaca. Aturan: `docs/PLAN-2026-10.md` Bagian A9.

Status: `TODO` → `IN_PROGRESS` → `REVIEW` → `CHANGES_REQUESTED` → `DONE`

## Jalur kerja

| Jalur | Pelaksana | Worktree | Branch | Wilayah file (terkunci) |
|---|---|---|---|---|
| L1 Backend (Fase 1B) | Gemini-1 | `.worktrees/fase1` | `fase-1-backend` | `dojang-hub-api/**` |
| L2 PWA (Fase 2) | Gemini-2 | `.worktrees/fase2` | `fase-2-pwa` | `dojang-hub-web/**` |
| L3 Responsive (Fase 3) | Gemini-3..n | `.worktrees/fase3-*` | `fase-3-*` | Dibuka setelah L2 merge |
| Audit (Fase 1A) | Claude (agents, read-only) | `main` | — | `docs/AUDIT-2026-10.md` |

## Tugas

> Status 2026-10-17 (lead): **semua fase 0–5 + L3-F selesai dan di-merge ke `main`.**

| Fase / jalur | Status | Bukti |
|---|---|---|
| Fase 0 fondasi | DONE | |
| Fase 1 audit + backend (L1-A/B/C) | DONE | `docs/AUDIT-2026-10.md` |
| Fase 2 PWA + web (L2-A/B) | DONE | |
| Fase 3 responsive (L3-A…E) + aksesibilitas (L3-F) | DONE | E2E mock 87 lulus |
| Fase 4 penyesuaian alur (L4-A…E) | DONE | |
| Fase 5 kelengkapan (L5-A/B/C/D) | DONE | Integrasi backend asli 26/26 lulus |
| Deploy | TODO | menunggu keputusan hosting, domain, izin push GitHub |

Tindak lanjut kecil (pasca-rilis): tampilkan `public_schedule` di landing page; redirect pelatih dari `/academy/spp`; pesan wali di form siswa tertutup validasi `required` browser; pesan status di manager internal/CMS belum memakai `StatusMessage`; event audit SPP belum ada tampilannya; urutan sabuk perlu konfirmasi pemilik (`docs/RANK-SYSTEMS.md`).

## Permintaan lintas wilayah

| Dari | Butuh file | Alasan | Status |
|---|---|---|---|
| — | — | — | — |
