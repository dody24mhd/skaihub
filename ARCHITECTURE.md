# SKAIHUB Architecture

> Status: Target architecture blueprint
> Updated: 2026-05-23
> Scope: Company profile, Super Admin, and academy management platform

## 1. System Boundaries

SKAIHUB currently lives in two application projects:

| Project | Responsibility |
|---|---|
| `dojang-hub-web` | Next.js web UI for company profile, Super Admin, and academy dashboards |
| `dojang-hub-api` | Laravel REST API, authentication, authorization, tenant data, storage integration |

Document boundaries:

| Document | Responsibility |
|---|---|
| `PRD-COMPRO.md` | Company profile and marketing site |
| `PRD.md` | Academy management product decisions |
| `SERVICE.md` | Product modules and package boundaries |
| `ARCHITECTURE.md` | Technical structure and system flow |
| `SCHEMA.md` | Target domain data model |

The removed `docs/` feature notes are not a source of truth after the 2026-05-23 product reset.

## 2. Architecture Principles

- Multi-tenant academy system with shared infrastructure and tenant isolation by `akademi_id`.
- Manual-first onboarding for MVP.
- Role decisions modeled explicitly: Super Admin, platform CMS Admin, Ketua Akademi, Admin Akademi, Pelatih.
- Operational training data and public landing content stay separate.
- Monthly SPP recap is an administration module, not a full accounting ledger.
- Core modules should work before self-service checkout and gateway work returns.

## 3. High-Level Flow

```text
Browser
  -> Next.js web application
      -> Laravel REST API
          -> PostgreSQL
          -> object storage for uploaded media
          -> queue/cache services when needed
```

MVP onboarding flow:

```text
Super Admin
  -> create academy and subscription
  -> create Ketua account
  -> optionally create first Admin account
Academy team
  -> configure places, classes, schedules, students, coaches, SPP defaults
Coach
  -> run sessions, attendance, training reports, evaluations
```

## 4. Web Surfaces

| Surface | Primary path or host intent | Notes |
|---|---|---|
| Company profile | `skaihub.com` | Marketing and CMS-backed public content |
| Super Admin | admin area | Academy onboarding, subscription management, platform CMS |
| Academy dashboard | academy authenticated area | Ketua, Admin, and Pelatih workflows |
| Public academy profile | package-enabled academy page | Promotion only, no public operational data |

Detailed subdomain and slug rules are intentionally deferred. The app should keep academy public profile support isolated enough to refine host policy later.

## 5. Authorization Model

### Platform roles

| Role | Scope |
|---|---|
| `super_admin` | Full SKAIHUB platform operations |
| `admin` | Platform CMS or delegated internal platform work |

### Academy roles

| Role | Scope |
|---|---|
| `ketua_akademi` | Academy leader and monitoring owner |
| `admin_akademi` | Academy operational administrator |
| `pelatih` | Training operator |

Authorization should enforce both:

1. Role permission.
2. Academy tenant ownership.

Student and guardian roles are not required for the MVP access model.

### MVP academy permission matrix

| Area | Ketua Akademi | Admin Akademi | Pelatih |
|---|---|---|---|
| Academy dashboard | View | View | View limited operational shortcuts |
| Academy users | Manage Admin Akademi and Pelatih | Manage Pelatih only | No access |
| Students, places, classes | Manage | Manage | No admin navigation |
| Schedules | Manage | Manage | Read and run training workflow |
| Attendance and training reports | Manage | Manage | Fill assigned/session training work |
| Evaluations | Configure and fill | Configure and fill | Fill scores |
| Rank promotions / UKT | Manage | Manage | No access |
| SPP / iuran | View and manage recap | View and manage recap | No access |

Backend authorization must remain the final source of enforcement. Frontend navigation should mirror the same matrix so Pelatih users are not shown finance or master-data menus.

## 6. Backend Domain Modules

| Domain | Main responsibility |
|---|---|
| Auth And Users | Login, academy role access, platform role access |
| Academy | Tenant identity, sport type, package snapshot, public profile state |
| Subscription | Manual package activation, duration, quota, current service status |
| Students | Student records, generated member number, status, primary class |
| Coaches | Coach profile and coach dashboard access |
| Places And Classes | Training places, class or shift groups, coach assignments |
| Scheduling | Recurring schedule definitions and generated session instances |
| Sessions | Actual coach, changes, attendance, material, report, photos |
| Iuran | Monthly charges, payments, proof, notes, recap |
| Rank | Sport-standard ranks and student rank history |
| Evaluation | Templates, periods, participants, indicator values, output |
| Achievement | Internal student achievements and public curated academy achievements |
| Public Profile | Landing content, gallery, WhatsApp CTA |

## 7. Frontend Areas

Recommended academy dashboard areas:

- Overview for Ketua and Admin.
- Students.
- Coaches.
- Places.
- Classes and schedules.
- Sessions and attendance.
- Iuran siswa.
- Rank and evaluation.
- Student achievements.
- Public profile settings when package allows it.

Pelatih UI should prioritize today's or assigned sessions and evaluation work instead of exposing broad admin navigation.

## 8. Key Data Flows

### Session Generation

```text
Recurring schedule
  -> generated session instance
  -> session may be kept, moved, cancelled, replaced, or added manually
  -> actual coach records attendance and report
```

### SPP

```text
Active students for month
  -> monthly SPP charges
  -> quick or bulk payment recording
  -> recap by month, student, paid status, and academy
```

### Evaluation

```text
Admin defines evaluation template
  -> Admin opens evaluation period
  -> active students included by default
  -> Pelatih fills indicator scores
  -> result is printed or downloaded
```

## 9. Public And Internal Data Separation

Public profile may read academy profile content, training places, selected coach display data, gallery items, and curated academy achievements.

Public profile must not directly expose:

- Attendance.
- SPP.
- Student evaluation.
- Student achievements unless a later explicit publish workflow exists.
- Session photos unless explicitly promoted into public gallery content.

## 10. Deferred Technical Work

Keep these as later architecture branches, not MVP blockers:

- Self-service account creation before activation.
- Payment gateway and webhook activation.
- Referral code checkout discounts.
- Student and guardian auth.
- Organization or federation hierarchy.
- Rich exam event engine.
- Profit accounting.
- Advanced subdomain policy.

## 11. Verification Discipline

Before each implementation milestone:

1. Check role permission and tenant scope.
2. Check package quota and feature boundary.
3. Check the workflow remains usable for daily Admin and Pelatih work.
4. Add tests for shared billing, generated sessions, and evaluation rules where mistakes create data drift.
