# SKAIHUB Product Requirements Document

> Status: Product blueprint draft
> Updated: 2026-05-23
> Scope: Academy management product. Company profile scope stays in `PRD-COMPRO.md`.

## 1. Product Direction

SKAIHUB is a web SaaS for personal martial arts academies in Indonesia, starting with Taekwondo and Karate. The first product promise is not a broad federation platform and not a student social portal. It is a practical operating system for an academy that wants its administration, training history, dues records, and student progress to stop living in scattered notes and chats.

The core problem:

- Student and coach data are not consistently recorded.
- Attendance and training notes do not build a usable history.
- Monthly dues administration is repetitive and hard to recap.
- Rank and evaluation progress are not documented with enough discipline.
- Many academies do not have a clean public profile to support promotion.

The product priority is:

1. Make internal academy management smooth.
2. Make daily coach and admin workflows simple enough to be used.
3. Add public academy profiles for packages that need promotion.
4. Keep future self-service purchase and richer billing possible without blocking the MVP.

## 2. MVP Scope

### In Scope

- Managed onboarding by SKAIHUB Super Admin.
- Academy roles: Ketua Akademi, Admin Akademi, and Pelatih.
- Student and coach records.
- Training places, classes or shifts, recurring schedules, generated sessions, and session exceptions.
- Attendance per training session.
- Training material, general session report, and session photos.
- Monthly SPP or iuran siswa charges and payment recap.
- Standard rank catalog by sport type and student rank history.
- Configurable student evaluation templates and evaluation periods.
- Internal student achievement records.
- Academy public landing page for eligible packages.
- Exports for student list, SPP recap, and student evaluation result.

### Deferred

- Student and parent login portals.
- Organization, federation, branch hierarchy, and cross-academy governance.
- Profit and loss accounting.
- Payments beyond monthly SPP, such as registration, uniform, exam, and event fees.
- Automatic self-service registration, payment gateway activation, and referral checkout.
- Multi-class membership for a student.
- Public training schedule on the academy landing page.
- Public announcements.
- QR attendance.
- Detailed subdomain and slug policy work.

## 3. Users And Roles

| Role | Product meaning | Main access |
|---|---|---|
| Super Admin | SKAIHUB internal operator | Onboard academies, manage subscriptions, maintain platform CMS |
| Ketua Akademi | Academy owner or leader | Monitoring and control for the academy, including iuran recap and user delegation |
| Admin Akademi | Daily academy operator | Students, coaches, schedules, sessions administration, SPP operations, evaluation setup |
| Pelatih | Coach or trainer | Run assigned training sessions, attendance, training report, student evaluation input |

Permission decisions:

- Ketua may manage Admin Akademi and Pelatih.
- Admin Akademi may manage Pelatih.
- Pelatih does not manage academy users.
- Student and parent access are not part of MVP.

## 4. Onboarding Decision

MVP onboarding is manual-first.

```text
1. Academy contacts SKAIHUB.
2. Super Admin records academy identity and subscription.
3. Super Admin creates Ketua Akademi as the required first academy account.
4. Super Admin may also create the first Admin Akademi account during onboarding.
5. Ketua or Admin completes operational setup: coaches, students, places, classes, schedules, and SPP defaults.
```

Future self-service can later create a paid activation flow from the company profile site, but it is not the workflow that drives the MVP implementation now.

## 5. Academy Operations

### Students

Required student data:

- Name.
- Gender.
- Birth date.
- Joined date.
- Student status.
- Current rank.
- Primary class or shift.
- Height and weight.
- At least one usable contact path: student phone or guardian contact.

Generated data:

- Academy member number or internal KTA number.

Optional student data:

- Photo.
- Address.
- Shirt size.
- Student WhatsApp.
- Guardian name and phone.
- School and school grade.
- Health notes.

Optional fields do not block student creation. The UI may surface an incomplete profile reminder.

### Coaches

Coach records should focus on operational identity and access. Specialization is removed from MVP. Coach access exists because the coach must run sessions and fill evaluations, not because the coach owns academy administration.

### Classes, Schedules, And Sessions

- A class is a practical training group or shift.
- A student has one primary class in MVP.
- A student joining another class for one session is recorded as an extra session participant, not a second class membership.
- A class can involve multiple coaches.
- A recurring schedule can have a default coach.
- Each actual session records the coach who actually taught, including a substitute.
- Sessions can be generated from recurring schedules and then changed for cancellations, replacements, or extra training.

### Attendance And Session Report

Attendance statuses are limited to:

- Hadir.
- Izin.
- Sakit.
- Alpa or tidak hadir.

Each training session may carry:

- Training material.
- General report or berita acara.
- Session photos.

## 6. Iuran Siswa

The product records monthly SPP administration, not full financial accounting.

- All active students receive a monthly SPP charge.
- Each academy has a default SPP nominal.
- A class may override the SPP nominal, for example a private class.
- MVP does not need per-student custom pricing.
- Admin records payment method, paid date, optional proof, and optional notes.
- Ketua monitors iuran recap.
- Pelatih has no SPP access.

The UX must support repeated daily work:

- Monthly dues table.
- Quick payment action per row.
- Bulk payment entry for multiple students.

## 7. Rank, Achievement, And Evaluation

### Rank

- Rank standards come from SKAIHUB sport catalogs, for example Taekwondo or Karate.
- Academy records the student's current rank and rank history.
- Rank change must be explicit and traceable.
- Exam or event-driven promotion can be added later for selected participants; an event must not promote all students automatically.

### Student Achievement

- Student achievements are internal records shown from the student detail and recap views.
- Public landing page achievements are curated academy achievements, not automatic exposure of every student achievement.

### Evaluation

- Evaluation templates and indicators are configured by Admin Akademi.
- Pelatih fills evaluations.
- Values use numeric score 1 to 100 and label bands: Kurang, Cukup, Baik, Sangat Baik.
- Evaluation periods are academy-defined, for example three or six months.
- Active students are included by default for a period, while exclusions remain possible.

## 8. Public Academy Landing Page

The landing page supports academy promotion. It is not the operational dashboard.

Included content:

- Academy name and logo.
- About text and sport type.
- Training places.
- Gallery.
- Curated academy achievements.
- Coach list.
- WhatsApp contact.
- CTA directly to WhatsApp.

Public schedule, public announcements, student records, and automatic session photos are out of scope.

## 9. Packaging Direction

All paid packages should include the core management product. Package differences should be easy to explain:

| Package | Price placeholder | Active student quota | Public landing page |
|---|---:|---:|---|
| Starter | Rp99.000 / month | 50 | No |
| Pro | Rp199.000 / month | 150 | Yes |
| Scale | Rp349.000 / month | 300 | Yes |

Capacity add-on direction:

- Student quota is based on active students.
- Add-ons increase capacity per block of 50 active students.
- Add-on pricing and maximum policy can be finalized later.

## 10. Delivery Order

Recommended implementation order:

1. Align docs, architecture, and schema with this blueprint.
2. Align roles and onboarding around Ketua, Admin, and Pelatih.
3. Build student, coach, places, classes, schedules, and sessions.
4. Build attendance and session report flow for coaches.
5. Build monthly SPP charges, quick payment, and recap.
6. Build rank history and evaluation periods/templates.
7. Refine package entitlements and academy landing page.
8. Revisit self-service checkout, payment gateway, referral codes, slug, and subdomain policy.
