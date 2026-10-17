# Laporan Pelaksanaan Brief L1-A (Backend: 1.0, 1.6, 1.7)

- **Pelaksana:** Gemini-1
- **Worktree:** `.worktrees/fase1`
- **Branch:** `fase-1-backend`
- **Status:** SELESAI

---

## 1.0 — Hijaukan baseline test

Tugas: 1.0 — Hijaukan baseline test
Diubah:
- `dojang-hub-api/tests/Feature/AkademiManagementApiTest.php` — Penyesuaian assertion test usang terhadap controller dan skema relasi evaluation aspect/period.

Alasan perbaikan per test:
1. `test_admin_akademi_can_create_and_deactivate_coach`:
   - Endpoint `DELETE /api/akademi/coaches/{coach}` menonaktifkan profil pelatih (`coach_profiles.status = 'inactive'`) dan merespons dengan pesan `'Profil pelatih berhasil dinonaktifkan.'`.
   - Kode controller sudah benar. Test sebelumnya salah karena menguji teks usang `'Pelatih berhasil dinonaktifkan.'` dan mengecek `users.is_active` alih-alih `coach_profiles.status`. Assertion diselaraskan ke `'Profil pelatih berhasil dinonaktifkan.'` dan `assertDatabaseHas('coach_profiles', ['user_id' => $coachId, 'status' => 'inactive'])`.
2. `test_ketua_and_admin_can_manage_pengurus_and_coach_accounts`:
   - Pada `setUp()`, user admin akademi (`$this->admin`) sudah dibuat terlebih dahulu.
   - Di dalam test, dibuat lagi 1 ketua akademi (`$ketua`), 1 admin baru via API (`$adminId`), dan 1 pelatih via API (`$coachId`).
   - Kode controller sudah benar (`User::whereIn('role', ...)->orWhere('id', ...)`). Total akun yang terlihat oleh ketua adalah 4 akun. Assertion test diselaraskan dari 3 menjadi 4.
3. `test_admin_can_configure_evaluation_and_coach_can_score_students`:
   - Berdasarkan skema tabel `evaluation_aspects`, kolom `evaluation_period_id` adalah foreign key wajib (NOT NULL).
   - Validasi `EvaluationController::storeAspect` mewajibkan `evaluation_period_id`. Kode controller & skema sudah benar.
   - Test diselaraskan dengan menambahkan `'evaluation_period_id' => $periodId` pada payload pembuatan aspek.
4. `test_student_detail_includes_attendance_spp_and_evaluation_history`:
   - Insert model `evaluationAspects()->create(...)` belum menyertakan `evaluation_period_id` yang wajib.
   - Kode skema sudah benar bahwa aspek milik periode. Test diselaraskan dengan menambahkan `'evaluation_period_id' => $period->id`.
5. `test_admin_can_export_students_spp_and_evaluation_csv`:
   - Sama seperti poin 4, insert `evaluationAspects()->create(...)` ditambahkan `'evaluation_period_id' => $period->id`.
   - Selain itu, endpoint `GET /api/akademi/exports/spp` secara ketat dan sengaja diproteksi hanya untuk `ketua_akademi` (`ensureCanExportFinanceData`). Admin akademi dilarang (403). Test diselaraskan untuk memverifikasi bahwa admin mendapat 403, kemudian melakukan export SPP menggunakan akun `ketua_akademi`.

Test:
- `AkademiManagementApiTest` (43 test) — LULUS

---

## 1.6 — Rate limiting

Tugas: 1.6 — Rate limiting
Diubah:
- `dojang-hub-api/app/Providers/AppServiceProvider.php` — Definisi named limiter: `login` (5/menit per IP + lowercase email), `inquiries` (3/menit per IP), `public-views` (30/menit per IP).
- `dojang-hub-api/routes/api.php` — Pemasangan middleware `throttle:login` di `POST auth/login`, `throttle:inquiries` di `POST compro/inquiries`, dan `throttle:public-views` di `POST compro/blog/{slug}/view` & `POST compro/events/{slug}/view`.
- `dojang-hub-api/tests/Feature/RateLimitTest.php` — Test baru pengujian throttle: login ke-6 (429), inquiry ke-4 (429), isolasi email login, dan public views ke-31 (429).

Test:
- `RateLimitTest` (4 test) — LULUS

---

## 1.7 — Penegakan kuota siswa aktif

Tugas: 1.7 — Penegakan kuota siswa aktif
Diubah:
- `dojang-hub-api/app/Services/SubscriptionService.php` — Penambahan method `assertCanAddActiveStudent(Akademi $akademi, ?int $ignoreStudentId = null): void` yang menghitung siswa aktif (`status = 'active'`, mengecualikan soft-deleted dan `$ignoreStudentId`), serta melempar `ValidationException` (422) pada field `status` jika kuota penuh atau tidak ada langganan aktif.
- `dojang-hub-api/app/Http/Controllers/Akademi/StudentController.php` — Injeksi `SubscriptionService` pada konstruktor; pemanggilan `assertCanAddActiveStudent` pada `store` (jika status aktif) dan `update` (jika status berubah dari non-aktif ke aktif).
- `dojang-hub-api/tests/Feature/AkademiManagementApiTest.php` — Penambahan pembuatan langganan awal starter aktif di `setUp()` agar pembuatan siswa via API di test manajemen akademi tetap valid.
- `dojang-hub-api/tests/Feature/StudentQuotaTest.php` — Test baru: di bawah batas (201), kuota penuh (422), extra student blocks menambah batas, siswa alumni/inactive tidak dihitung, reaktivasi inactive->active saat penuh (422), tanpa langganan aktif (422), isolasi antar akademi, dan kelancaran seeder demo.

Catatan bisnis:
- Siswa berstatus alumni atau inactive tidak dihitung ke dalam kuota aktif.
- Akademi tanpa langganan aktif memiliki kuota limit 0, sehingga tidak dapat menambah atau mereaktivasi siswa berstatus active (perilaku disengaja dan ditegakkan).

Test:
- `StudentQuotaTest` (8 test) — LULUS

---

## Verifikasi Akhir

```
cd dojang-hub-api
php artisan test
```
Hasil:
```
Tests:    55 passed (331 assertions)
Duration: 4.02s
```

```
vendor/bin/pint --dirty
```
Hasil:
```
{"tool":"pint","result":"passed"}
```

Catatan/keputusan yang perlu pemilik project: tidak ada.
