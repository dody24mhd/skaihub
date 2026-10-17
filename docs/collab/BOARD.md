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

> Status per 2026-10-17 (lead). Resume: cek `git worktree list`, `git -C .worktrees/<wt> log main..HEAD`, dan `git status` per worktree.

| Jalur | Pemilik | Worktree / branch | Status | Catatan |
|---|---|---|---|---|
| Fase 0 | Gemini | main | DONE | `3b279d0` |
| Audit 1A | Claude | main | DONE | `docs/AUDIT-2026-10.md` (D1–D17) |
| L1-A (1.0, 1.6, 1.7) | Gemini-1 | fase1 / fase-1-backend | DONE (merged) | 55 test |
| L1-B, L1-C | Gemini-1 | fase1 / fase-1-backend | CHANGES_REQUESTED | 92 test; perbaikan R1–R10 di `docs/collab/reviews/L1-BC.md` |
| L2-A PWA | Gemini-2 | fase2 / fase-2-pwa | DONE (merged) | + fix reload pertama oleh lead |
| L2-B sanitasi + rute admin | Gemini-2 | fase2 / fase-2-pwa | DONE (merged) | |
| L3-A UI + shell + e2e | Gemini-3 | fase3-a / fase-3-shell | DONE (merged) | |
| L3-B absensi | Gemini-4 | fase3-b / fase-3-attendance | IN_PROGRESS | PLAYWRIGHT_PORT=3300 |
| L3-C siswa + SPP | Gemini-5 | fase3-c / fase-3-students-spp | TODO | mulai setelah L1-B/C merge |
| L3-D evaluasi | Gemini-6 | fase3-d / fase-3-evaluation | IN_PROGRESS | PLAYWRIGHT_PORT=3500 |
| L3-E setup | Gemini-7 | fase3-e / fase-3-setup | IN_PROGRESS | PLAYWRIGHT_PORT=3600 |
| 3.9 E2E final, 3.10 a11y | Claude | main | TODO | setelah semua L3 merge |

## Permintaan lintas wilayah

| Dari | Butuh file | Alasan | Status |
|---|---|---|---|
| — | — | — | — |
