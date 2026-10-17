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

| Tugas | Pemilik | Status | Catatan |
|---|---|---|---|
| 0.1–0.5 | Gemini | DONE | Commit `3b279d0` |
| 1.1–1.5 | Claude | IN_PROGRESS | Audit read-only |
| 1.0 | Gemini-1 | TODO | Hijaukan 5 test baseline |
| 1.6 | Gemini-1 | TODO | Rate limit |
| 1.7 | Gemini-1 | TODO | Kuota siswa |
| 1.8–1.10 | Gemini-1 | TODO | Menunggu keputusan audit |
| 2.1–2.10 | Gemini-2 | TODO | |
| 3.1–3.10 | Gemini-3..n | TODO | Setelah Fase 2 merge |

## Permintaan lintas wilayah

| Dari | Butuh file | Alasan | Status |
|---|---|---|---|
| — | — | — | — |
