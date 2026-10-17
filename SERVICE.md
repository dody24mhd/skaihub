# SKAIHUB Service Definition

> Status: Product service draft
> Updated: 2026-05-23

## 1. Service Shape

SKAIHUB serves martial arts academies that need dependable daily management before they need a large enterprise system. The core service is internal academy management. A public academy landing page is a package benefit for academies that also want a promotional profile.

The first product is academy-centric:

- One academy is one tenant.
- Academy operations are handled by Ketua Akademi, Admin Akademi, and Pelatih.
- Students and guardians are data subjects in MVP, not dashboard users.
- SKAIHUB manages onboarding manually in MVP.

## 2. Service Modules

| Module | MVP capability |
|---|---|
| Academy Setup | Identity, sport type, training places, role assignment |
| Students | Student CRUD, generated member number, contact and profile completeness |
| Coaches | Coach CRUD and coach login access |
| Classes And Schedules | Shift-based class groups, recurring schedules, actual training sessions |
| Attendance | Session attendance with hadir, izin, sakit, and alpa |
| Training Report | Material, general report, and session photos |
| Iuran Siswa | Monthly SPP charges, payment capture, quick pay, bulk payment input, recap |
| Rank | Standard sport rank catalog, current rank, rank history |
| Evaluation | Periods, templates, indicators, score entry, evaluation output |
| Achievement | Internal student achievement CRUD and recap |
| Public Profile | Academy landing page content for eligible packages |
| Export | Student list, SPP recap, student evaluation result |

## 3. Package Recommendation

All packages include the same core academy management modules. This avoids a broken experience where an academy can track attendance but cannot track the progress that made the attendance matter.

| Package | Price placeholder | Quota | Landing page | Best fit |
|---|---:|---:|---|---|
| Starter | Rp99.000 / month | 50 active students | No | Academy that wants management first |
| Pro | Rp199.000 / month | 150 active students | Yes | Academy that needs management and promotion |
| Scale | Rp349.000 / month | 300 active students | Yes | Larger academy with heavier daily operations |

Pricing is a working recommendation, not a frozen commercial policy.

## 4. Capacity Add-on

- Quota counts active students only.
- Alumni and inactive students do not consume active quota.
- Additional capacity is sold per block of 50 active students.
- Final add-on price and package-specific maximum can be decided after the first usage signals.

## 5. Role Service Boundaries

### Ketua Akademi

- Monitor academy activity.
- View iuran recap.
- Manage Admin Akademi and Pelatih access.
- Retain top-level academy control.
- Cannot create another Ketua account from academy dashboard in MVP; that stays under SKAIHUB internal onboarding/control.

### Admin Akademi

- Manage operational data: students, coaches, places, classes, schedules.
- Configure SPP defaults and evaluation setup.
- Record SPP payments.
- Support training operation without being exposed to profit accounting.
- Manage Pelatih access only, not other Admin Akademi accounts.

### Pelatih

- Open assigned training sessions.
- Fill attendance.
- Write session material and report.
- Upload session photos.
- Fill student evaluations for configured periods.
- Does not access SPP, academy user management, or master-data administration menus.

## 6. Onboarding Service

### MVP Manual Onboarding

```text
Lead from WhatsApp or direct sales
  -> Super Admin creates academy
  -> Super Admin activates package and subscription
  -> Ketua account is created
  -> Optional first Admin account is created
  -> Academy starts operational setup
```

### Future Self-service

Self-service registration, email verification, payment gateway activation, and referral discount can return after the core operations product is stable. Their future data model should not force the MVP interface to behave like a checkout product now.

## 7. Iuran Service Boundary

Use product language such as `Iuran Siswa`, `SPP`, and `Rekap Iuran`.

Do not position MVP as accounting software:

- No profit dashboard.
- No cost bookkeeping.
- No payroll.
- No cashflow statement.

SPP MVP only needs to answer:

- Which active student is billed this month?
- Which charge is paid or unpaid?
- When and how was it paid?
- Is there proof or a note?
- What recap does Ketua need to monitor?

## 8. Public Profile Boundary

The academy public page may show:

- Name, logo, about text, and sport.
- Training places.
- Gallery.
- Curated academy achievements.
- Coach list.
- WhatsApp contact and direct CTA.

It must not automatically publish operational data such as session photos, student achievements, attendance, evaluation, or internal schedule changes.

## 9. Outputs

MVP output set:

- Student list export.
- SPP recap export.
- Printable or downloadable student evaluation result.

Later outputs can include richer attendance reports, exam output, cards, or accounting exports if product demand proves it.
