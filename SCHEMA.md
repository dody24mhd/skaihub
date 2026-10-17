# SKAIHUB Target Schema

> Status: Target schema blueprint
> Updated: 2026-05-23
> Database: PostgreSQL

This document describes the intended domain model after the product reset. It is the design target for migration cleanup and implementation review. Existing code and migrations should be audited against this document before new feature work expands them further.

## 1. Conventions

- Every tenant-owned business table carries `akademi_id`.
- Platform-only tables do not need `akademi_id`.
- Soft delete is useful for primary operational records where history matters.
- Use audit fields for important state changes: created by, updated by, paid by, approved by, or changed by when the workflow needs traceability.
- Public content tables stay separate from operational student and session data.

## 2. Core Platform

### `akademis`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `name` | Academy name |
| `slug` | Public or routing identifier, policy to be refined later |
| `sport_type` | Initial supported values include Taekwondo and Karate |
| `logo_url` | Optional |
| `status` | Active, inactive, suspended |
| `current_plan` | Subscription snapshot for fast display |
| `plan_expires_at` | Subscription snapshot |

### `users`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `akademi_id` | Nullable for platform users |
| `name` | Login identity name |
| `email` | Unique login email |
| `password` | Password hash |
| `role` | `super_admin`, `admin`, `ketua_akademi`, `admin_akademi`, `pelatih` |
| `is_active` | Access switch |
| `email_verified_at` | Optional for present/future auth flows |

### `subscriptions`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `akademi_id` | Academy tenant |
| `plan` | `starter`, `pro`, `scale` |
| `status` | Trialing, active, past due, expired, cancelled as policy requires |
| `starts_at`, `ends_at` | Service period |
| `included_student_limit` | Package quota snapshot |
| `extra_student_blocks` | Add-on blocks of 50 |
| `notes` | Manual onboarding note |

Self-service checkout tables and gateway payment tables are deferred targets. They may exist in experimental code, but they are not the MVP domain center.

## 3. Academy People

### `students`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `akademi_id` | Tenant |
| `member_number` | Generated internal KTA/member number |
| `name` | Required |
| `gender` | Required |
| `birth_date` | Required |
| `joined_date` | Required |
| `status` | Active, inactive, alumni |
| `current_rank_id` | Current standard rank |
| `primary_class_id` | One primary class for MVP |
| `height_cm`, `weight_kg` | Required |
| `student_phone` | Optional if guardian contact exists |
| `guardian_name`, `guardian_phone` | Optional pair unless needed as contact route |
| `photo_url` | Optional |
| `address` | Optional |
| `shirt_size` | Optional |
| `school_name`, `school_grade` | Optional |
| `health_notes` | Optional |

Validation rule target:

```text
student_phone exists OR guardian_phone exists
```

### `coach_profiles`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `akademi_id` | Tenant |
| `user_id` | Coach login identity |
| `phone` | Operational contact if needed |
| `joined_date` | Optional |
| `rank_label` | Optional display field |
| `license_number` | Optional |
| `bio` | Optional, usable for public profile only when selected |
| `photo_url` | Optional |
| `status` | Active or inactive |

No `specialization` field is needed in MVP.

## 4. Places, Classes, And Sessions

### `training_places`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `akademi_id` | Tenant |
| `name` | Place name |
| `address` | Optional |
| `notes` | Optional |
| `is_active` | State |

Places are training locations, not organizational branches.

### `classes`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `akademi_id` | Tenant |
| `name` | Shift or training group name |
| `training_place_id` | Default training place if useful |
| `spp_amount_override` | Optional class SPP nominal |
| `is_active` | State |

### `class_coaches`

| Column | Notes |
|---|---|
| `class_id` | Class |
| `coach_user_id` | Assigned coach |

### `recurring_schedules`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `akademi_id` | Tenant |
| `class_id` | Scheduled class |
| `training_place_id` | Schedule place |
| `day_of_week` | Weekly recurrence |
| `start_time`, `end_time` | Time window |
| `default_coach_user_id` | Optional |
| `is_active` | State |

### `training_sessions`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `akademi_id` | Tenant |
| `class_id` | Session class |
| `recurring_schedule_id` | Nullable source schedule |
| `training_place_id` | Actual place |
| `actual_coach_user_id` | Coach who taught |
| `session_date` | Actual date |
| `start_time`, `end_time` | Actual session time |
| `status` | Scheduled, completed, cancelled, moved, extra |
| `material` | Training material |
| `report_notes` | Berita acara or general note |

### `session_photos`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `training_session_id` | Session |
| `image_url` | Stored media |
| `caption` | Optional |

### `session_participants`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `training_session_id` | Session |
| `student_id` | Student |
| `participant_type` | Primary class member or extra participant |

### `attendances`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `training_session_id` | Session |
| `student_id` | Student |
| `status` | `hadir`, `izin`, `sakit`, `alpa` |
| `notes` | Optional |

## 5. Iuran Siswa

### `academy_spp_settings`

| Column | Notes |
|---|---|
| `akademi_id` | One settings row per academy |
| `default_monthly_amount` | Default SPP |
| `billing_day` | Optional monthly due day |

### `spp_charges`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `akademi_id` | Tenant |
| `student_id` | Billed student |
| `period_month` | Month being billed |
| `amount` | Charge snapshot |
| `status` | Unpaid, paid, void as policy requires |
| `due_date` | Optional |

### `spp_payments`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `akademi_id` | Tenant |
| `spp_charge_id` | Paid charge |
| `amount_paid` | Payment amount |
| `paid_at` | Payment time |
| `method` | Cash, transfer, or other controlled values |
| `proof_url` | Optional |
| `notes` | Optional |
| `recorded_by` | User who recorded payment |

MVP can start with one full payment per charge if partial payment is intentionally deferred.

## 6. Rank And Achievement

### `sport_ranks`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `sport_type` | Taekwondo, Karate, and later sports |
| `code` | Stable rank code |
| `label` | Display name |
| `sequence` | Rank order |

Ranks are standardized by SKAIHUB sport catalog, not freely duplicated per academy in MVP.

### `student_rank_histories`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `akademi_id` | Tenant |
| `student_id` | Student |
| `rank_id` | Achieved rank |
| `achieved_on` | Date |
| `source_type` | Manual, exam event later, import later |
| `notes` | Optional |
| `changed_by` | User who recorded it |

### `student_achievements`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `akademi_id` | Tenant |
| `student_id` | Student |
| `title` | Achievement label |
| `event_name` | Optional |
| `achieved_on` | Optional |
| `result_label` | Optional |
| `notes` | Optional |

## 7. Evaluation

### `evaluation_templates`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `akademi_id` | Tenant |
| `name` | Template name |
| `is_active` | Template availability |

### `evaluation_indicators`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `evaluation_template_id` | Template |
| `name` | Indicator name |
| `description` | Optional |
| `sort_order` | Display order |

### `evaluation_periods`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `akademi_id` | Tenant |
| `template_id` | Template snapshot source |
| `name` | Period label |
| `starts_on`, `ends_on` | Period range |
| `status` | Draft, open, closed |

### `evaluation_participants`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `evaluation_period_id` | Period |
| `student_id` | Included student |
| `is_excluded` | Allows default inclusion with exceptions |

### `evaluation_scores`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `evaluation_period_id` | Period |
| `student_id` | Student |
| `indicator_id` | Evaluated indicator |
| `score` | Integer 1 to 100 |
| `label` | Kurang, Cukup, Baik, Sangat Baik |
| `coach_user_id` | Pelatih who filled score |
| `notes` | Optional |

## 8. Public Academy Profile

### `academy_public_profiles`

| Column | Notes |
|---|---|
| `akademi_id` | One public profile per academy |
| `about` | Public description |
| `whatsapp` | CTA target |
| `is_published` | Publish state |

### `academy_gallery_items`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `akademi_id` | Tenant |
| `image_url` | Public image |
| `caption` | Optional |
| `sort_order` | Ordering |

### `academy_public_achievements`

| Column | Notes |
|---|---|
| `id` | Primary key |
| `akademi_id` | Tenant |
| `title` | Public achievement |
| `description` | Optional |
| `achieved_on` | Optional |
| `sort_order` | Ordering |

Coach display can be controlled from coach profile publishing fields or a dedicated public mapping table when needed.

## 9. Deferred Schema Branches

These are intentionally not required for MVP schema completion:

- Student and guardian users.
- Referral codes and gateway checkout orders.
- Non-SPP financial categories.
- Full exam event engine and certificates.
- Organization hierarchy.
- Public announcements.
- QR attendance tokens.
