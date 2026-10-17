# SKAIHUB Target & Actual Schema

> Status: Synchronized with Phase 1 MVP Implementation (Audit D1, D3–D7)
> Updated: 2026-10-17
> Database: PostgreSQL (Production) / SQLite (Testing)

Dokumen ini mendeskripsikan model domain dan skema database SKAIHUB setelah audit dan implementasi Fase 1. Dokumen ini telah diselaraskan dengan implementasi aktual kode backend (`dojang-hub-api`) berdasarkan keputusan audit D1–D7 di `docs/AUDIT-2026-10.md`.

---

## 1. Pemetaan Nama & Struktur Skema (Target Lama → Aktual Database)

| Konsep / Target Lama | Nama / Implementasi Aktual | Keterangan / Status |
|---|---|---|
| `akademis` | `akademi` | Nama tabel singular |
| `akademis.current_plan` | `akademi.plan` | Snapshot paket langganan aktif di tabel tenant |
| `recurring_schedules` | `training_schedules` | Tabel jadwal latihan mingguan |
| `training_sessions.status` (scheduled/completed/cancelled/moved/extra) | `training_sessions.status` (`draft`, `completed`, `cancelled`) + `session_type` (`regular`, `replacement`, `extra`) | Status operasional dan tipe sesi dipisahkan; berita acara disimpan di kolom `notes` |
| `session_photos` | `training_sessions.photo_urls` (JSON array URL) | Disimpan dalam bentuk JSON URL pada sesi; tabel terpisah ditunda (D2) |
| `session_participants` | `training_attendances` (`participant_name`, `is_extra_participant`) | Peserta trial/ekstra dicatat langsung di absensi sesi; tabel terpisah ditunda (D2) |
| `attendances` | `training_attendances` | Nama tabel aktual; nilai status: `present`, `absent`, `excused`, `sick` (D3) |
| `class_coaches` | `training_schedule_coaches` & `training_session_coaches` | Relasi pelatih melekat ke jadwal mingguan dan sesi latihan aktual; tabel statis kelas ditunda (D2) |
| `academy_spp_settings` | Default amount saat generate tagihan + override kelas di `classes.spp_amount_override` | Ditunda sebagai tabel terpisah (D2) |
| `spp_charges` | `spp_bills` | Tagihan SPP bulanan, mendukung status `unpaid`, `partial`, `paid`, `waived`, serta melacak `paid_amount` |
| `spp_payments.amount_paid` / `recorded_by` | `spp_payments.amount` / `created_by` | Kolom `akademi_id` ditambahkan (D4) untuk isolasi tenant langsung |
| `sport_ranks` | `sport_ranks` dengan `akademi_id` (nullable) | Tingkatan global bawaan platform (`akademi_id IS NULL`, read-only) + tingkatan kustom tenant (D8/F1) |
| `student_rank_histories` | `student_rank_histories` | Riwayat kenaikan sabuk siswa (manual maupun hasil UKT lulus) (D5) |
| `student_achievements` | `student_achievements` | Prestasi internal siswa per-tenant dengan soft deletes (D6) |
| `evaluation_templates`, `evaluation_indicators`, `evaluation_participants` | `evaluation_aspects` melekat ke `evaluation_periods` | Penilaian per periode menggunakan aspek langsung; template & partisipan terpisah ditunda (D2) |
| `coach_profiles.bio` | `coach_profiles.address` | Kolom `bio` ditunda pasca-MVP (D2) |

---

## 2. Fitur & Cabang Skema yang Ditunda (Deferred Post-MVP — D2 & D9)

Berikut adalah komponen skema yang secara eksplisit **ditunda pasca-MVP** berdasarkan kesepakatan audit:
1. `class_coaches` (pivot statis kelas–pelatih): pelatih saat ini melekat langsung pada jadwal dan sesi latihan.
2. `session_photos` (tabel relasi foto sesi): menggunakan kolom JSON `photo_urls` pada `training_sessions`.
3. `session_participants` (tabel peserta per sesi): peserta tambahan ditampung di `training_attendances` dengan flag `is_extra_participant`.
4. `academy_spp_settings`: konfigurasi nominal default dimasukkan saat generate tagihan bulanan atau melalui `classes.spp_amount_override`.
5. `evaluation_templates` dan `evaluation_participants`: sistem evaluasi MVP menggunakan `evaluation_aspects` per periode aktif.
6. `coach_profiles.bio`: disimpan di profil pengguna atau ditambahkan pada fase profil publik lanjutan.
7. User portal siswa & wali murid: ditunda pasca-MVP.
8. Payment gateway otomatis & checkout langganan mandiri: dikelola manual via Super Admin & upload bukti transfer.

---

## 3. Konvensi Skema

- Setiap tabel operasional milik tenant **wajib** memiliki kolom `akademi_id` (foreign key berindeks ke `akademi.id` dengan `cascadeOnDelete`).
- Setiap query data tenant wajib menyertakan filter `WHERE akademi_id = ?`.
- Soft delete (`softDeletes()`) digunakan pada entitas data master utama (`students`, `classes`, `training_places`, `rank_promotion_events`, `student_achievements`).
- Audit trail menggunakan `created_by`, `assessed_by`, atau `changed_by` merujuk ke `users.id` (`nullOnDelete`).

---

## 4. Rincian Tabel Aktual

### Core Platform

#### `akademi`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `name` | varchar(150) | Nama akademi / dojang |
| `slug` | varchar(100) (Unique) | Slug URL / identifier routing |
| `sport_type` | varchar(50) | `taekwondo`, `karate`, dll. |
| `logo_url` | varchar(500) | Nullable |
| `status` | enum / varchar | `active`, `inactive`, `suspended` |
| `plan` | enum / varchar | Snapshot paket: `starter`, `pro`, `scale` |
| `plan_expires_at` | timestamp | Nullable snapshot kedaluwarsa |
| `timestamps`, `softDeletes` | | Jejak audit waktu & soft delete |

#### `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `akademi_id` | bigint (FK, index) | Nullable untuk platform super admin |
| `name` | varchar(255) | Nama lengkap user |
| `email` | varchar(255) (Unique) | Email login |
| `password` | varchar(255) | Hash password |
| `role` | enum / varchar | `super_admin`, `admin`, `ketua_akademi`, `admin_akademi`, `pelatih` |
| `is_active` | boolean | Switch status akun aktif/nonaktif |
| `avatar_url` | varchar(500) | Nullable URL foto profil |
| `email_verified_at` | timestamp | Nullable |
| `timestamps` | | |

*Indeks komposit: `(akademi_id, role)` untuk query filtering role per tenant.*

#### `subscriptions`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `akademi_id` | bigint (FK, index) | Tenant akademi |
| `plan` | enum / varchar | `starter`, `pro`, `scale` |
| `duration_type` | enum / varchar | `trial`, `monthly`, `quarterly`, `semester`, `yearly`, `custom` |
| `duration_months` | integer | Durasi bulan paket |
| `included_student_limit` | integer | Kuota dasar siswa (50/150/300) |
| `extra_student_blocks` | integer | Blok tambahan per 50 siswa |
| `starts_at`, `ends_at` | timestamp | Masa aktif layanan |
| `subtotal_amount`, `discount_amount`, `amount` | decimal(12,2) | Informasi tagihan |
| `payment_status` | enum / varchar | `unpaid`, `paid`, `waived`, `refunded` |
| `payment_method` | varchar(100) | Nullable |
| `payment_proof_url` | varchar(500) | Nullable |
| `status` | enum / varchar | `trialing`, `active`, `past_due`, `expired`, `cancelled` |
| `activated_at`, `cancelled_at` | timestamp | Nullable |
| `created_by` | bigint (FK) | User pencatat langganan |
| `notes` | text | Catatan onboarding |
| `timestamps` | | |

---

### Manajemen Anggota & Pelatih

#### `students`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `akademi_id` | bigint (FK, index) | Tenant akademi |
| `current_rank_id` | bigint (FK) | Nullable tingkatan sabuk saat ini |
| `primary_class_id` | bigint (FK) | Nullable kelas utama |
| `member_number` | varchar(100) | Nomor anggota unik per-akademi (`unique(['akademi_id', 'member_number'])`) |
| `name` | varchar(150) | Nama lengkap siswa |
| `gender` | enum / varchar | `male`, `female` |
| `birth_date` | date | Tanggal lahir |
| `joined_date` | date | Tanggal bergabung |
| `status` | enum / varchar | `active`, `inactive`, `alumni` |
| `height_cm` | smallint | Tinggi badan dalam cm |
| `weight_kg` | decimal(5,2) | Berat badan dalam kg |
| `student_phone` | varchar(30) | Nullable |
| `guardian_name` | varchar(150) | Nullable |
| `guardian_phone` | varchar(30) | Nullable |
| `photo_url` | varchar(500) | Nullable URL foto |
| `address` | text | Nullable alamat |
| `shirt_size` | varchar(50) | Nullable ukuran dobok / baju |
| `school_name`, `school_grade` | varchar | Nullable info sekolah |
| `health_notes` | text | Nullable riwayat kesehatan |
| `timestamps`, `softDeletes` | | |

*Indeks performa: `(akademi_id, status)` untuk penegakan kuota aktif & listing.*

#### `coach_profiles`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `akademi_id` | bigint (FK, index) | Tenant akademi |
| `user_id` | bigint (FK, unique) | Akun user ber-role `pelatih` |
| `phone` | varchar(30) | Nullable nomor telepon |
| `joined_date` | date | Nullable tanggal mulai melatih |
| `rank_label` | varchar(100) | Nullable tingkatan / Dan pelatih |
| `license_number` | varchar(100) | Nullable nomor sertifikasi/lisensi |
| `photo_url` | varchar(500) | Nullable foto pelatih |
| `address` | text | Nullable alamat tempat tinggal |
| `status` | enum / varchar | `active`, `inactive` |
| `timestamps` | | |

---

### Tempat, Kelas, Jadwal, & Sesi Latihan

#### `training_places`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `akademi_id` | bigint (FK, index) | Tenant dojang/akademi |
| `name` | varchar(150) | Nama dojang / tempat latihan |
| `address` | text | Nullable alamat lokasi |
| `notes` | text | Nullable keterangan tambahan |
| `is_active` | boolean | Status aktif lokasi |
| `timestamps`, `softDeletes` | | |

#### `classes`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `akademi_id` | bigint (FK, index) | Tenant dojang/akademi |
| `training_place_id` | bigint (FK) | Nullable lokasi default kelas |
| `name` | varchar(150) | Nama kelas (mis. Reguler, Prestasi) |
| `spp_amount_override` | decimal(12,2) | Nullable override besaran SPP kelas |
| `target_sessions_per_month` | tinyint | Target pertemuan bulanan (default 4) |
| `is_active` | boolean | Status aktif kelas |
| `timestamps`, `softDeletes` | | |

#### `training_schedules` (pengganti `recurring_schedules`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `akademi_id` | bigint (FK, index) | Tenant dojang/akademi |
| `class_id` | bigint (FK, index) | Kelas yang dijadwalkan |
| `training_place_id` | bigint (FK) | Lokasi latihan |
| `day_of_week` | tinyint | Hari (0=Minggu, 1=Senin, ..., 6=Sabtu) |
| `starts_at`, `ends_at` | time | Jam mulai dan selesai |
| `is_active` | boolean | Status aktif jadwal |
| `timestamps` | | |

#### `training_schedule_coaches`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `training_schedule_id` | bigint (FK) | Pivot jadwal |
| `coach_id` | bigint (FK) | Pivot pelatih (`users.id`) |

#### `training_sessions`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `akademi_id` | bigint (FK, index) | Tenant dojang/akademi |
| `class_id` | bigint (FK, index) | Kelas sesi latihan |
| `training_schedule_id` | bigint (FK, index) | Nullable rujukan jadwal induk |
| `training_place_id` | bigint (FK) | Lokasi latihan sesi ini |
| `coach_id` | bigint (FK) | Nullable pelatih penanggung jawab utama |
| `session_date` | date | Tanggal sesi latihan |
| `starts_at`, `ends_at` | time | Waktu latihan aktual |
| `session_type` | enum / varchar | `regular`, `replacement`, `extra` |
| `status` | enum / varchar | `draft`, `completed`, `cancelled` |
| `material` | varchar(255) | Nullable materi latihan |
| `notes` | text | Nullable berita acara latihan |
| `photo_urls` | json / jsonb | Array URL foto dokumentasi sesi |
| `timestamps` | | |

#### `training_session_coaches`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `training_session_id` | bigint (FK) | Pivot sesi |
| `coach_id` | bigint (FK) | Pivot pelatih bertugas (`users.id`) |

#### `training_attendances` (pengganti `attendances`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `training_session_id` | bigint (FK) | Sesi latihan terkait |
| `student_id` | bigint (FK, index) | Nullable jika peserta ekstra non-member |
| `participant_name` | varchar(150) | Nullable nama peserta ekstra |
| `is_extra_participant` | boolean | Penanda peserta tambahan / trial |
| `status` | enum / varchar | `present`, `absent`, `excused`, `sick` (D3) |
| `notes` | text | Nullable catatan kehadiran |
| `timestamps` | | |

---

### Keuangan & SPP Siswa

#### `spp_bills` (pengganti `spp_charges`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `akademi_id` | bigint (FK, index) | Tenant dojang/akademi |
| `student_id` | bigint (FK) | Siswa penerima tagihan |
| `class_id` | bigint (FK) | Nullable kelas saat tagihan dibuat |
| `billing_year` | smallint | Tahun tagihan |
| `billing_month` | tinyint | Bulan tagihan (1–12) |
| `amount` | decimal(12,2) | Total tagihan |
| `paid_amount` | decimal(12,2) | Total yang sudah terbayar (mendukung cicilan) |
| `due_date` | date | Nullable tanggal jatuh tempo |
| `status` | enum / varchar | `unpaid`, `partial`, `paid`, `waived` |
| `notes` | text | Nullable catatan |
| `timestamps` | | |

#### `spp_payments`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `akademi_id` | bigint (FK, index) | Tenant dojang/akademi (D4) |
| `spp_bill_id` | bigint (FK, index) | Tagihan SPP terkait |
| `amount` | decimal(12,2) | Nominal yang dibayar pada transaksi ini |
| `paid_at` | date | Tanggal transaksi pembayaran |
| `method` | varchar(50) | Nullable metode (`cash`, `transfer`, dll.) |
| `proof_url` | varchar(500) | Nullable URL bukti transfer (wajib dari storage akademi sendiri) |
| `notes` | text | Nullable catatan transaksi |
| `created_by` | bigint (FK) | Petugas yang merekam pembayaran |
| `timestamps` | | |

*Indeks performa: `(akademi_id, paid_at)` dan `(spp_bill_id)`.*

---

### Tingkatan Sabuk & Prestasi

#### `sport_ranks`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `akademi_id` | bigint (FK, index) | Nullable: `NULL` = tingkatan global katalog bawaan; terisi = kustom milik tenant (D8/F1) |
| `sport_type` | varchar(50) | Jenis olahraga (`taekwondo`, `karate`) |
| `code` | varchar(50) | Kode stabil |
| `label` | varchar(100) | Label tampilan (mis. Sabuk Putih) |
| `sequence` | smallint | Urutan tingkatan |
| `timestamps` | | |

*Unique constraint: `(akademi_id, sport_type, code)`.*

#### `student_rank_histories` (D5)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `akademi_id` | bigint (FK, index) | Tenant akademi |
| `student_id` | bigint (FK, index) | Siswa terkait |
| `sport_rank_id` | bigint (FK) | Tingkatan sabuk yang diraih |
| `achieved_on` | date | Tanggal perolehan sabuk |
| `source_type` | varchar(30) | Sumber perolehan: `manual` atau `promotion_event` |
| `rank_promotion_participant_id` | bigint (FK) | Nullable referensi ke ujian kenaikan tingkat |
| `notes` | text | Nullable keterangan |
| `changed_by` | bigint (FK) | Nullable akun user yang mencatat |
| `timestamps` | | |

*Indeks komposit: `(student_id, achieved_on)`.*

#### `student_achievements` (D6)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `akademi_id` | bigint (FK, index) | Tenant akademi |
| `student_id` | bigint (FK, index) | Siswa yang meraih prestasi |
| `title` | varchar(255) | Judul prestasi (mis. Juara 1 Kyorugi) |
| `event_name` | varchar(255) | Nullable nama kompetisi / kejuaraan |
| `achieved_on` | date | Nullable tanggal raihan prestasi |
| `result_label` | varchar(100) | Nullable predikat (mis. Medali Emas) |
| `notes` | text | Nullable catatan |
| `timestamps`, `softDeletes` | | |

*Indeks komposit: `(akademi_id, student_id)`.*

#### `rank_promotion_events` & `rank_promotion_participants` (UKT)
| Tabel | Kolom Utama | Keterangan |
|---|---|---|
| `rank_promotion_events` | `id`, `akademi_id`, `name`, `event_date`, `status` (`draft`, `completed`, `cancelled`), `notes`, `created_by` | Agenda pelaksanaan Ujian Kenaikan Tingkat (UKT) |
| `rank_promotion_participants` | `id`, `akademi_id`, `rank_promotion_event_id`, `student_id`, `from_rank_id`, `to_rank_id`, `result` (`registered`, `passed`, `failed`, `absent`), `score`, `assessed_by`, `notes` | Peserta ujian UKT beserta hasil kelulusan |

---

### Evaluasi & Rapor Siswa

#### `evaluation_periods`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `akademi_id` | bigint (FK, index) | Tenant akademi |
| `name` | varchar(150) | Nama periode (mis. Semester 1 2026) |
| `starts_at`, `ends_at` | date | Rentang waktu periode |
| `status` | enum / varchar | `active`, `closed` |
| `notes` | text | Nullable catatan |
| `timestamps` | | |

#### `evaluation_aspects`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `akademi_id` | bigint (FK, index) | Tenant akademi |
| `evaluation_period_id` | bigint (FK, index) | Periode evaluasi induk |
| `name` | varchar(150) | Nama aspek (mis. Teknik Dasar, Disiplin) |
| `category` | varchar(100) | Nullable kategori aspek |
| `sort_order` | smallint | Urutan aspek |
| `is_active` | boolean | Status aktif aspek |
| `timestamps` | | |

#### `student_evaluation_scores`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `akademi_id` | bigint (FK, index) | Tenant akademi |
| `evaluation_period_id` | bigint (FK) | Periode evaluasi |
| `evaluation_aspect_id` | bigint (FK) | Aspek yang dinilai |
| `student_id` | bigint (FK) | Siswa yang dinilai |
| `class_id` | bigint (FK) | Nullable kelas saat dinilai |
| `score` | integer | Nilai angka (0–100) |
| `indicator` | varchar(50) | Kategori indikator (`kurang`, `cukup`, `baik`, `sangat_baik`) |
| `assessed_by` | bigint (FK) | Pelatih penilai (`users.id`) |
| `notes` | text | Nullable catatan penilai |
| `timestamps` | | |

---

### Profil Publik & Landing Page Akademi

| Tabel | Kolom Utama | Keterangan |
|---|---|---|
| `academy_public_profiles` | `akademi_id` (PK/Unique), `about`, `whatsapp`, `address`, `hero_image_url`, `is_published` | Pengaturan tampilan halaman publik akademi |
| `academy_gallery_items` | `id`, `akademi_id`, `image_url`, `caption`, `sort_order` | Galeri foto publik |
| `academy_public_achievements`| `id`, `akademi_id`, `title`, `description`, `achieved_on`, `sort_order` | Prestasi yang ditampilkan di website publik |
| `academy_public_officials` | `id`, `akademi_id`, `name`, `role_title`, `photo_url`, `sort_order` | Daftar pengurus & pelatih di website publik |
