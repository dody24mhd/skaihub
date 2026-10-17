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

> Status per 2026-10-17 siang (lead). Gemini: kuota 5 jam habis → jalur dikerjakan agent Claude.

| Jalur | Pelaksana | Worktree / branch | Status |
|---|---|---|---|
| Fase 0–2, L1-*, L2-* | Gemini + lead | — | DONE (merged) |
| L3-A…E (Fase 3) | Gemini + Claude agents | fase3-* | DONE (merged) — E2E 61 lulus / 0 gagal |
| L3-F aksesibilitas (8 fix prioritas dari review WCAG) | Claude agent | (nanti) | TODO — setelah Fase 4 merge |
| L4-A sesi & Kelas Hari Ini | Claude agent | fase4-a / fase-4-sessions | DONE (merged) |
| L4-B SPP lanjutan | Claude agent | fase4-b / fase-4-spp | DONE (merged) |
| L4-C sistem tingkatan | Claude agent | fase4-c / fase-4-ranks | DONE (merged) |
| L4-D langganan & operator | Claude agent | fase4-d / fase-4-subscription | DONE (merged) |
| L4-E data siswa & penilaian | Claude agent | fase4-e / fase-4-students | DONE (merged) |
| L5-D ops & polish | Claude agent | fase5-d / fase-5-ops | IN_PROGRESS |
| L5-B akun platform & password | Claude agent | fase5-b / fase-5-accounts | DONE (merged) |
| L5-C rapor & sertifikat | Claude agent | — | TODO |
| L5-A E2E integrasi backend asli | Claude agent | — | TODO (terakhir) |

## Permintaan lintas wilayah

| Dari | Butuh file | Alasan | Status |
|---|---|---|---|
| — | — | — | — |
