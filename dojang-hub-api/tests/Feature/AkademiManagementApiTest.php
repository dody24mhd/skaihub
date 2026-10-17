<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\SportRank;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AkademiManagementApiTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $akademi;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->akademi = Akademi::create([
            'name' => 'Garuda Sakti',
            'slug' => 'garuda-sakti',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'starter',
        ]);

        $this->admin = User::factory()->akademiAdmin($this->akademi->id)->create();
        Sanctum::actingAs($this->admin);
    }

    public function test_admin_akademi_can_manage_training_places_classes_and_students(): void
    {
        $placeId = $this->postJson('/api/akademi/training-places', [
            'name' => 'Dojang Utama',
            'address' => 'Jl. Merdeka No. 1',
        ])->assertCreated()
            ->assertJsonPath('training_place.name', 'Dojang Utama')
            ->json('training_place.id');

        $classId = $this->postJson('/api/akademi/classes', [
            'training_place_id' => $placeId,
            'name' => 'Shift Senin Junior',
            'spp_amount_override' => 150000,
        ])->assertCreated()
            ->assertJsonPath('training_class.name', 'Shift Senin Junior')
            ->assertJsonPath('training_class.training_place.id', $placeId)
            ->json('training_class.id');

        $rank = SportRank::create([
            'sport_type' => 'taekwondo',
            'code' => 'white',
            'label' => 'Sabuk Putih',
            'sequence' => 1,
        ]);

        $this->postJson('/api/akademi/students', [
            'primary_class_id' => $classId,
            'current_rank_id' => $rank->id,
            'name' => 'Budi Pratama',
            'gender' => 'male',
            'birth_date' => '2014-01-10',
            'joined_date' => '2026-05-23',
            'height_cm' => 145,
            'weight_kg' => 38,
            'guardian_name' => 'Ibu Budi',
            'guardian_phone' => '08123456789',
        ])->assertCreated()
            ->assertJsonPath('student.name', 'Budi Pratama')
            ->assertJsonPath('student.member_number', 'GARUDA-0001')
            ->assertJsonPath('student.primary_class.id', $classId)
            ->assertJsonPath('student.current_rank.label', 'Sabuk Putih');

        $this->assertDatabaseHas('students', [
            'akademi_id' => $this->akademi->id,
            'member_number' => 'GARUDA-0001',
            'name' => 'Budi Pratama',
        ]);
    }

    public function test_student_detail_includes_attendance_spp_and_evaluation_history(): void
    {
        $class = $this->akademi->trainingClasses()->create(['name' => 'Junior']);
        $coach = User::factory()->pelatih($this->akademi->id)->create(['name' => 'Coach Satria']);
        $student = $this->akademi->siswa()->create([
            'primary_class_id' => $class->id,
            'member_number' => 'GARUDA-0001',
            'name' => 'Budi',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-05-23',
            'height_cm' => 145,
            'weight_kg' => 38,
            'status' => 'active',
        ]);

        $session = $this->akademi->trainingSessions()->create([
            'class_id' => $class->id,
            'coach_id' => $coach->id,
            'session_date' => '2026-05-25',
            'starts_at' => '16:00',
            'ends_at' => '17:30',
            'material' => 'Tendangan dasar',
            'status' => 'completed',
        ]);

        $session->attendances()->create([
            'student_id' => $student->id,
            'status' => 'present',
        ]);

        $this->akademi->sppBills()->create([
            'student_id' => $student->id,
            'class_id' => $class->id,
            'billing_year' => 2026,
            'billing_month' => 5,
            'amount' => 150000,
            'paid_amount' => 0,
            'status' => 'unpaid',
        ]);

        $period = $this->akademi->evaluationPeriods()->create([
            'name' => 'Semester 1 2026',
            'starts_at' => '2026-01-01',
            'ends_at' => '2026-06-30',
            'status' => 'active',
        ]);

        $aspect = $this->akademi->evaluationAspects()->create([
            'name' => 'Teknik Dasar',
            'sort_order' => 1,
        ]);

        $student->evaluationScores()->create([
            'akademi_id' => $this->akademi->id,
            'evaluation_period_id' => $period->id,
            'evaluation_aspect_id' => $aspect->id,
            'class_id' => $class->id,
            'assessed_by' => $coach->id,
            'score' => 90,
            'indicator' => 'sangat_baik',
        ]);

        $this->getJson("/api/akademi/students/{$student->id}")
            ->assertOk()
            ->assertJsonPath('student.name', 'Budi')
            ->assertJsonPath('summary.attendance_total', 1)
            ->assertJsonPath('summary.attendance_present', 1)
            ->assertJsonPath('summary.spp_unpaid_count', 1)
            ->assertJsonPath('summary.evaluation_average', 90)
            ->assertJsonPath('attendances.0.session.material', 'Tendangan dasar')
            ->assertJsonPath('spp_bills.0.status', 'unpaid')
            ->assertJsonPath('evaluation_scores.0.aspect.name', 'Teknik Dasar');
    }

    public function test_admin_can_manage_rank_promotion_and_only_passed_students_are_promoted(): void
    {
        $white = SportRank::create([
            'sport_type' => 'taekwondo',
            'code' => 'white',
            'label' => 'Sabuk Putih',
            'sequence' => 1,
        ]);

        $yellow = SportRank::create([
            'sport_type' => 'taekwondo',
            'code' => 'yellow',
            'label' => 'Sabuk Kuning',
            'sequence' => 2,
        ]);

        $studentA = $this->akademi->siswa()->create([
            'current_rank_id' => $white->id,
            'member_number' => 'GARUDA-0001',
            'name' => 'Budi',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-05-23',
            'height_cm' => 145,
            'weight_kg' => 38,
            'status' => 'active',
        ]);

        $studentB = $this->akademi->siswa()->create([
            'current_rank_id' => $white->id,
            'member_number' => 'GARUDA-0002',
            'name' => 'Sari',
            'gender' => 'female',
            'birth_date' => '2014-02-01',
            'joined_date' => '2026-05-23',
            'height_cm' => 140,
            'weight_kg' => 35,
            'status' => 'active',
        ]);

        $eventId = $this->postJson('/api/akademi/rank-promotions', [
            'name' => 'UKT Mei 2026',
            'event_date' => '2026-05-30',
        ])->assertCreated()
            ->assertJsonPath('rank_promotion_event.name', 'UKT Mei 2026')
            ->json('rank_promotion_event.id');

        $participantAId = $this->postJson("/api/akademi/rank-promotions/{$eventId}/participants", [
            'student_id' => $studentA->id,
            'to_rank_id' => $yellow->id,
            'result' => 'passed',
            'score' => 88,
        ])->assertCreated()
            ->assertJsonPath('rank_promotion_participant.result', 'passed')
            ->json('rank_promotion_participant.id');

        $this->postJson("/api/akademi/rank-promotions/{$eventId}/participants", [
            'student_id' => $studentB->id,
            'to_rank_id' => $yellow->id,
            'result' => 'failed',
            'score' => 55,
        ])->assertCreated()
            ->assertJsonPath('rank_promotion_participant.result', 'failed');

        $this->assertDatabaseHas('students', [
            'id' => $studentA->id,
            'current_rank_id' => $yellow->id,
        ]);

        $this->assertDatabaseHas('students', [
            'id' => $studentB->id,
            'current_rank_id' => $white->id,
        ]);

        $this->patchJson("/api/akademi/rank-promotions/{$eventId}/participants/{$participantAId}", [
            'result' => 'failed',
            'score' => 58,
        ])->assertOk()
            ->assertJsonPath('rank_promotion_participant.result', 'failed');

        $this->assertDatabaseHas('students', [
            'id' => $studentA->id,
            'current_rank_id' => $white->id,
        ]);

        $this->getJson("/api/akademi/rank-promotions/{$eventId}")
            ->assertOk()
            ->assertJsonCount(2, 'rank_promotion_event.participants')
            ->assertJsonPath('rank_promotion_event.participants.0.to_rank.label', 'Sabuk Kuning');
    }

    public function test_pelatih_cannot_manage_rank_promotions(): void
    {
        Sanctum::actingAs(User::factory()->pelatih($this->akademi->id)->create());

        $this->postJson('/api/akademi/rank-promotions', [
            'name' => 'UKT Pelatih',
            'event_date' => '2026-05-30',
        ])->assertForbidden()
            ->assertJsonPath('message', 'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengatur kenaikan tingkat.');
    }

    public function test_admin_akademi_can_create_and_deactivate_coach(): void
    {
        $coachId = $this->postJson('/api/akademi/coaches', [
            'name' => 'Coach Satria',
            'email' => 'coach@satria.test',
            'password' => 'password123',
            'phone' => '0811223344',
            'rank_label' => 'DAN 2',
            'joined_date' => '2026-05-23',
        ])->assertCreated()
            ->assertJsonPath('coach.role', 'pelatih')
            ->assertJsonPath('coach.coach_profile.phone', '0811223344')
            ->json('coach.id');

        $this->deleteJson("/api/akademi/coaches/{$coachId}")
            ->assertOk()
            ->assertJsonPath('message', 'Pelatih berhasil dinonaktifkan.');

        $this->assertDatabaseHas('users', [
            'id' => $coachId,
            'role' => 'pelatih',
            'is_active' => false,
        ]);
    }

    public function test_pelatih_cannot_mutate_master_data(): void
    {
        Sanctum::actingAs(User::factory()->pelatih($this->akademi->id)->create());

        $this->postJson('/api/akademi/training-places', [
            'name' => 'Tempat Rahasia',
        ])->assertForbidden()
            ->assertJsonPath('message', 'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengubah data.');
    }

    public function test_ketua_and_admin_can_manage_pengurus_and_coach_accounts(): void
    {
        $ketua = User::factory()->create([
            'akademi_id' => $this->akademi->id,
            'role' => 'ketua_akademi',
            'is_active' => true,
        ]);

        Sanctum::actingAs($ketua);

        $adminId = $this->postJson('/api/akademi/users', [
            'name' => 'Admin Operasional',
            'email' => 'admin.ops@test.local',
            'password' => 'password123',
            'role' => 'admin_akademi',
        ])->assertCreated()
            ->assertJsonPath('academy_user.role', 'admin_akademi')
            ->json('academy_user.id');

        $coachId = $this->postJson('/api/akademi/users', [
            'name' => 'Coach Baru',
            'email' => 'coach.baru@test.local',
            'password' => 'password123',
            'role' => 'pelatih',
            'phone' => '081234',
        ])->assertCreated()
            ->assertJsonPath('academy_user.role', 'pelatih')
            ->assertJsonPath('academy_user.coach_profile.phone', '081234')
            ->json('academy_user.id');

        $this->getJson('/api/akademi/users')
            ->assertOk()
            ->assertJsonCount(3, 'data');

        Sanctum::actingAs(User::findOrFail($adminId));

        $adminTwoId = $this->postJson('/api/akademi/users', [
            'name' => 'Admin Dua',
            'email' => 'admin.dua@test.local',
            'password' => 'password123',
            'role' => 'admin_akademi',
        ])->assertCreated()
            ->assertJsonPath('academy_user.role', 'admin_akademi')
            ->json('academy_user.id');

        $this->assertDatabaseHas('users', [
            'id' => $adminTwoId,
            'role' => 'admin_akademi',
        ]);

        $this->patchJson("/api/akademi/users/{$coachId}", [
            'name' => 'Coach Update',
            'role' => 'pelatih',
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('academy_user.name', 'Coach Update')
            ->assertJsonPath('academy_user.is_active', false);
    }

    public function test_pelatih_cannot_access_spp_or_user_management(): void
    {
        Sanctum::actingAs(User::factory()->pelatih($this->akademi->id)->create());

        $this->getJson('/api/akademi/spp-bills')
            ->assertForbidden()
            ->assertJsonPath('message', 'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengubah SPP.');

        $this->getJson('/api/akademi/users')
            ->assertForbidden()
            ->assertJsonPath('message', 'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengatur akun.');
    }

    public function test_admin_can_export_students_spp_and_evaluation_csv(): void
    {
        $class = $this->akademi->trainingClasses()->create(['name' => 'Junior']);
        $student = $this->akademi->siswa()->create([
            'primary_class_id' => $class->id,
            'member_number' => 'GARUDA-0001',
            'name' => 'Budi',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-05-23',
            'height_cm' => 145,
            'weight_kg' => 38,
            'status' => 'active',
        ]);

        $this->akademi->sppBills()->create([
            'student_id' => $student->id,
            'class_id' => $class->id,
            'billing_year' => 2026,
            'billing_month' => 5,
            'amount' => 150000,
            'paid_amount' => 50000,
            'status' => 'partial',
        ]);

        $period = $this->akademi->evaluationPeriods()->create([
            'name' => 'Semester 1 2026',
            'starts_at' => '2026-01-01',
            'ends_at' => '2026-06-30',
            'status' => 'active',
        ]);

        $aspect = $this->akademi->evaluationAspects()->create([
            'name' => 'Teknik Dasar',
            'category' => 'Teknik',
        ]);

        $student->evaluationScores()->create([
            'akademi_id' => $this->akademi->id,
            'evaluation_period_id' => $period->id,
            'evaluation_aspect_id' => $aspect->id,
            'class_id' => $class->id,
            'assessed_by' => $this->admin->id,
            'score' => 88,
            'indicator' => 'baik',
        ]);

        $studentExport = $this->get('/api/akademi/exports/students')
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $this->assertStringContainsString('Budi', $studentExport->streamedContent());
        $this->assertStringContainsString('GARUDA-0001', $studentExport->streamedContent());

        $sppExport = $this->get('/api/akademi/exports/spp?year=2026&month=5')->assertOk();
        $this->assertStringContainsString('150000', $sppExport->streamedContent());
        $this->assertStringContainsString('partial', $sppExport->streamedContent());

        $evaluationExport = $this->get("/api/akademi/exports/evaluations/{$period->id}")->assertOk();
        $this->assertStringContainsString('Semester 1 2026', $evaluationExport->streamedContent());
        $this->assertStringContainsString('Teknik Dasar', $evaluationExport->streamedContent());
        $this->assertStringContainsString('88', $evaluationExport->streamedContent());
    }

    public function test_pelatih_cannot_export_admin_reports(): void
    {
        Sanctum::actingAs(User::factory()->pelatih($this->akademi->id)->create());

        $this->getJson('/api/akademi/exports/students')
            ->assertForbidden()
            ->assertJsonPath('message', 'Akses ditolak. Hanya ketua atau admin akademi yang bisa export laporan.');
    }

    public function test_academy_users_can_upload_allowed_files_by_purpose(): void
    {
        Storage::fake('public');

        $this->postJson('/api/akademi/upload/file', [
            'purpose' => 'student_photo',
            'file' => UploadedFile::fake()->image('budi.webp'),
        ])->assertCreated()
            ->assertJsonPath('path', fn (string $path) => str_contains($path, "akademi/{$this->akademi->id}/student-photos"));

        Sanctum::actingAs(User::factory()->pelatih($this->akademi->id)->create());

        $this->postJson('/api/akademi/upload/file', [
            'purpose' => 'session_photo',
            'file' => UploadedFile::fake()->image('sesi.jpg'),
        ])->assertCreated()
            ->assertJsonPath('path', fn (string $path) => str_contains($path, "akademi/{$this->akademi->id}/session-photos"));

        $this->postJson('/api/akademi/upload/file', [
            'purpose' => 'spp_proof',
            'file' => UploadedFile::fake()->image('bukti.jpg'),
        ])->assertForbidden()
            ->assertJsonPath('message', 'Akses ditolak. Hanya ketua atau admin akademi yang bisa upload file administrasi.');
    }

    public function test_dashboard_summary_is_role_aware_for_admin_and_coach(): void
    {
        $class = $this->akademi->trainingClasses()->create(['name' => 'Junior']);
        $coach = User::factory()->pelatih($this->akademi->id)->create(['name' => 'Coach Satria']);
        $student = $this->akademi->siswa()->create([
            'primary_class_id' => $class->id,
            'member_number' => 'GARUDA-0001',
            'name' => 'Budi',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => now()->toDateString(),
            'height_cm' => 145,
            'weight_kg' => 38,
            'status' => 'active',
        ]);

        $session = $this->akademi->trainingSessions()->create([
            'class_id' => $class->id,
            'coach_id' => $coach->id,
            'session_date' => now()->toDateString(),
            'starts_at' => '16:00',
            'ends_at' => '17:30',
            'status' => 'completed',
        ]);

        $session->attendances()->create([
            'student_id' => $student->id,
            'status' => 'present',
        ]);

        $this->akademi->sppBills()->create([
            'student_id' => $student->id,
            'class_id' => $class->id,
            'billing_year' => now()->year,
            'billing_month' => now()->month,
            'amount' => 150000,
            'paid_amount' => 0,
            'status' => 'unpaid',
        ]);

        $this->getJson('/api/akademi/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('students.active_count', 1)
            ->assertJsonPath('spp.bill_count', 1)
            ->assertJsonPath('spp.unpaid_count', 1)
            ->assertJsonPath('sessions.month_count', 1)
            ->assertJsonPath('sessions.attendance_rate', 100);

        Sanctum::actingAs($coach);

        $this->getJson('/api/akademi/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('profile.user.role', 'pelatih')
            ->assertJsonPath('students', null)
            ->assertJsonPath('spp', null)
            ->assertJsonPath('sessions.month_count', 1)
            ->assertJsonPath('sessions.latest.0.coach.name', 'Coach Satria');
    }

    public function test_academi_user_cannot_access_other_tenant_resource(): void
    {
        $otherAkademi = Akademi::create([
            'name' => 'Other Academy',
            'slug' => 'other-academy',
            'sport_type' => 'karate',
            'status' => 'active',
            'plan' => 'starter',
        ]);

        $place = $otherAkademi->trainingPlaces()->create([
            'name' => 'Tempat Academy Lain',
        ]);

        $this->getJson("/api/akademi/training-places/{$place->id}")
            ->assertNotFound()
            ->assertJsonPath('message', 'Tempat latihan tidak ditemukan.');
    }

    public function test_sport_ranks_are_filtered_by_current_academy_sport_type(): void
    {
        SportRank::create([
            'sport_type' => 'taekwondo',
            'code' => 'white',
            'label' => 'Sabuk Putih',
            'sequence' => 1,
        ]);

        SportRank::create([
            'sport_type' => 'karate',
            'code' => 'kyu-10',
            'label' => 'Kyu 10',
            'sequence' => 1,
        ]);

        $this->getJson('/api/akademi/sport-ranks')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.sport_type', 'taekwondo');
    }

    public function test_admin_akademi_can_manage_training_schedule(): void
    {
        $place = $this->akademi->trainingPlaces()->create([
            'name' => 'Dojang Utama',
        ]);

        $class = $this->akademi->trainingClasses()->create([
            'training_place_id' => $place->id,
            'name' => 'Junior Senin',
        ]);

        $coach = User::factory()->pelatih($this->akademi->id)->create([
            'name' => 'Coach Satria',
        ]);

        $scheduleId = $this->postJson('/api/akademi/training-schedules', [
            'class_id' => $class->id,
            'training_place_id' => $place->id,
            'coach_id' => $coach->id,
            'day_of_week' => 1,
            'starts_at' => '16:00',
            'ends_at' => '17:30',
            'notes' => 'Fokus teknik dasar.',
        ])->assertCreated()
            ->assertJsonPath('training_schedule.class.name', 'Junior Senin')
            ->assertJsonPath('training_schedule.training_place.name', 'Dojang Utama')
            ->assertJsonPath('training_schedule.coach.name', 'Coach Satria')
            ->json('training_schedule.id');

        $this->patchJson("/api/akademi/training-schedules/{$scheduleId}", [
            'day_of_week' => 3,
            'starts_at' => '17:00',
            'ends_at' => '18:30',
        ])->assertOk()
            ->assertJsonPath('training_schedule.day_of_week', 3)
            ->assertJsonPath('training_schedule.starts_at', '17:00');

        $this->deleteJson("/api/akademi/training-schedules/{$scheduleId}")
            ->assertOk()
            ->assertJsonPath('message', 'Jadwal latihan berhasil dihapus.');

        $this->assertSoftDeleted('training_schedules', [
            'id' => $scheduleId,
        ]);
    }

    public function test_schedule_and_session_support_multiple_coaches_with_default_present_attendance(): void
    {
        $class = $this->akademi->trainingClasses()->create(['name' => 'Junior Senin']);
        $coachA = User::factory()->pelatih($this->akademi->id)->create(['name' => 'Coach A']);
        $coachB = User::factory()->pelatih($this->akademi->id)->create(['name' => 'Coach B']);

        $this->akademi->siswa()->create([
            'primary_class_id' => $class->id,
            'member_number' => 'GARUDA-0001',
            'name' => 'Budi',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-05-23',
            'height_cm' => 145,
            'weight_kg' => 38,
            'status' => 'active',
        ]);

        $scheduleId = $this->postJson('/api/akademi/training-schedules', [
            'class_id' => $class->id,
            'coach_ids' => [$coachA->id, $coachB->id],
            'day_of_week' => 1,
            'starts_at' => '16:00',
            'ends_at' => '17:30',
        ])->assertCreated()
            ->assertJsonCount(2, 'training_schedule.coaches')
            ->assertJsonPath('training_schedule.coach_id', $coachA->id)
            ->json('training_schedule.id');

        $session = $this->postJson('/api/akademi/training-sessions', [
            'training_schedule_id' => $scheduleId,
            'session_date' => now()->toDateString(),
        ])->assertCreated()
            ->assertJsonCount(2, 'training_session.coaches')
            ->assertJsonPath('training_session.attendances.0.status', 'present')
            ->json('training_session');

        Sanctum::actingAs($coachB);

        $this->patchJson("/api/akademi/training-sessions/{$session['id']}/attendance", [
            'material' => 'Latihan pengganti',
            'status' => 'completed',
        ])->assertOk()
            ->assertJsonPath('training_session.material', 'Latihan pengganti')
            ->assertJsonCount(2, 'training_session.coaches');
    }

    public function test_active_coach_can_record_today_session_and_is_attached_as_session_coach(): void
    {
        $class = $this->akademi->trainingClasses()->create(['name' => 'Junior Senin']);
        $coachA = User::factory()->pelatih($this->akademi->id)->create();
        $coachB = User::factory()->pelatih($this->akademi->id)->create();

        $session = $this->akademi->trainingSessions()->create([
            'class_id' => $class->id,
            'coach_id' => $coachA->id,
            'session_date' => now()->toDateString(),
            'starts_at' => '16:00',
            'ends_at' => '17:30',
        ]);

        Sanctum::actingAs($coachB);

        $this->patchJson("/api/akademi/training-sessions/{$session->id}/attendance", [
            'material' => 'Mengajar sesi hari ini',
        ])->assertOk()
            ->assertJsonPath('training_session.coaches.0.id', $coachB->id);

        $this->assertDatabaseHas('training_session_coaches', [
            'training_session_id' => $session->id,
            'coach_id' => $coachB->id,
        ]);
    }

    public function test_training_schedule_rejects_other_tenant_class_and_coach(): void
    {
        $otherAkademi = Akademi::create([
            'name' => 'Other Academy',
            'slug' => 'other-schedule',
            'sport_type' => 'karate',
            'status' => 'active',
            'plan' => 'starter',
        ]);

        $otherClass = $otherAkademi->trainingClasses()->create([
            'name' => 'Other Class',
        ]);

        $otherCoach = User::factory()->pelatih($otherAkademi->id)->create();

        $this->postJson('/api/akademi/training-schedules', [
            'class_id' => $otherClass->id,
            'coach_id' => $otherCoach->id,
            'day_of_week' => 1,
            'starts_at' => '16:00',
            'ends_at' => '17:30',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['class_id', 'coach_id']);
    }

    public function test_pelatih_can_read_but_cannot_mutate_training_schedule(): void
    {
        $class = $this->akademi->trainingClasses()->create([
            'name' => 'Junior Senin',
        ]);

        $schedule = $this->akademi->trainingSchedules()->create([
            'class_id' => $class->id,
            'day_of_week' => 1,
            'starts_at' => '16:00',
            'ends_at' => '17:30',
        ]);

        Sanctum::actingAs(User::factory()->pelatih($this->akademi->id)->create());

        $this->getJson('/api/akademi/training-schedules')
            ->assertOk()
            ->assertJsonPath('data.0.id', $schedule->id);

        $this->postJson('/api/akademi/training-schedules', [
            'class_id' => $class->id,
            'day_of_week' => 2,
            'starts_at' => '16:00',
            'ends_at' => '17:30',
        ])->assertForbidden()
            ->assertJsonPath('message', 'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengubah jadwal.');
    }

    public function test_admin_can_create_training_session_from_schedule_and_update_attendance(): void
    {
        $class = $this->akademi->trainingClasses()->create(['name' => 'Junior Senin']);
        $coach = User::factory()->pelatih($this->akademi->id)->create(['name' => 'Coach Satria']);
        $schedule = $this->akademi->trainingSchedules()->create([
            'class_id' => $class->id,
            'coach_id' => $coach->id,
            'day_of_week' => 1,
            'starts_at' => '16:00',
            'ends_at' => '17:30',
        ]);

        $studentA = $this->akademi->siswa()->create([
            'primary_class_id' => $class->id,
            'member_number' => 'GARUDA-0001',
            'name' => 'Budi',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-05-23',
            'height_cm' => 145,
            'weight_kg' => 38,
            'status' => 'active',
        ]);

        $this->akademi->siswa()->create([
            'primary_class_id' => $class->id,
            'member_number' => 'GARUDA-0002',
            'name' => 'Sari',
            'gender' => 'female',
            'birth_date' => '2014-02-01',
            'joined_date' => '2026-05-23',
            'height_cm' => 140,
            'weight_kg' => 35,
            'status' => 'active',
        ]);

        $session = $this->postJson('/api/akademi/training-sessions', [
            'training_schedule_id' => $schedule->id,
            'session_date' => '2026-05-25',
        ])->assertCreated()
            ->assertJsonPath('training_session.class.name', 'Junior Senin')
            ->assertJsonPath('training_session.coach.name', 'Coach Satria')
            ->assertJsonCount(2, 'training_session.attendances')
            ->json('training_session');

        $attendanceId = collect($session['attendances'])
            ->firstWhere('student_id', $studentA->id)['id'];

        $this->patchJson("/api/akademi/training-sessions/{$session['id']}/attendance", [
            'material' => 'Kuda-kuda dan tendangan dasar',
            'notes' => 'Latihan berjalan lancar.',
            'photo_urls' => ['https://example.com/session.webp'],
            'status' => 'completed',
            'attendances' => [
                ['id' => $attendanceId, 'status' => 'present', 'notes' => 'Aktif'],
            ],
            'extra_participants' => [
                ['participant_name' => 'Raka Trial', 'status' => 'present', 'notes' => 'Trial'],
            ],
        ])->assertOk()
            ->assertJsonPath('training_session.material', 'Kuda-kuda dan tendangan dasar')
            ->assertJsonPath('training_session.status', 'completed')
            ->assertJsonCount(3, 'training_session.attendances');

        $this->assertDatabaseHas('training_attendances', [
            'training_session_id' => $session['id'],
            'student_id' => $studentA->id,
            'status' => 'present',
        ]);

        $this->assertDatabaseHas('training_attendances', [
            'training_session_id' => $session['id'],
            'participant_name' => 'Raka Trial',
            'is_extra_participant' => true,
        ]);
    }

    public function test_assigned_coach_can_update_own_training_session_attendance(): void
    {
        $class = $this->akademi->trainingClasses()->create(['name' => 'Junior Senin']);
        $coach = User::factory()->pelatih($this->akademi->id)->create();
        $otherCoach = User::factory()->pelatih($this->akademi->id)->create();

        $session = $this->akademi->trainingSessions()->create([
            'class_id' => $class->id,
            'coach_id' => $coach->id,
            'session_date' => '2026-05-25',
            'starts_at' => '16:00',
            'ends_at' => '17:30',
        ]);

        Sanctum::actingAs($coach);

        $this->patchJson("/api/akademi/training-sessions/{$session->id}/attendance", [
            'material' => 'Materi pelatih',
            'status' => 'completed',
        ])->assertOk()
            ->assertJsonPath('training_session.material', 'Materi pelatih');

        Sanctum::actingAs($otherCoach);

        $this->patchJson("/api/akademi/training-sessions/{$session->id}/attendance", [
            'material' => 'Tidak boleh',
        ])->assertForbidden()
            ->assertJsonPath('message', 'Akses ditolak. Hanya admin akademi atau pelatih sesi yang bisa mengubah sesi latihan.');
    }

    public function test_admin_can_generate_spp_bills_and_record_payment(): void
    {
        $regularClass = $this->akademi->trainingClasses()->create([
            'name' => 'Reguler',
        ]);

        $privateClass = $this->akademi->trainingClasses()->create([
            'name' => 'Private',
            'spp_amount_override' => 250000,
        ]);

        $studentA = $this->akademi->siswa()->create([
            'primary_class_id' => $regularClass->id,
            'member_number' => 'GARUDA-0001',
            'name' => 'Budi',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-05-23',
            'height_cm' => 145,
            'weight_kg' => 38,
            'status' => 'active',
        ]);

        $studentB = $this->akademi->siswa()->create([
            'primary_class_id' => $privateClass->id,
            'member_number' => 'GARUDA-0002',
            'name' => 'Sari',
            'gender' => 'female',
            'birth_date' => '2014-02-01',
            'joined_date' => '2026-05-23',
            'height_cm' => 140,
            'weight_kg' => 35,
            'status' => 'active',
        ]);

        $this->akademi->siswa()->create([
            'primary_class_id' => $regularClass->id,
            'member_number' => 'GARUDA-0003',
            'name' => 'Alumni',
            'gender' => 'male',
            'birth_date' => '2012-01-01',
            'joined_date' => '2024-01-01',
            'height_cm' => 160,
            'weight_kg' => 50,
            'status' => 'alumni',
        ]);

        $this->postJson('/api/akademi/spp-bills/generate', [
            'billing_year' => 2026,
            'billing_month' => 5,
            'default_amount' => 150000,
            'due_date' => '2026-05-10',
        ])->assertCreated()
            ->assertJsonPath('created', 2)
            ->assertJsonPath('skipped', 0);

        $this->postJson('/api/akademi/spp-bills/generate', [
            'billing_year' => 2026,
            'billing_month' => 5,
            'default_amount' => 150000,
        ])->assertCreated()
            ->assertJsonPath('created', 0)
            ->assertJsonPath('skipped', 2);

        $this->assertDatabaseHas('spp_bills', [
            'student_id' => $studentA->id,
            'amount' => 150000,
            'status' => 'unpaid',
        ]);

        $this->assertDatabaseHas('spp_bills', [
            'student_id' => $studentB->id,
            'amount' => 250000,
            'status' => 'unpaid',
        ]);

        $billId = $this->getJson('/api/akademi/spp-bills?year=2026&month=5')
            ->assertOk()
            ->assertJsonPath('data.total', 2)
            ->json('data.data.0.id');

        $this->postJson("/api/akademi/spp-bills/{$billId}/payments", [
            'amount' => 150000,
            'paid_at' => '2026-05-05',
            'method' => 'cash',
            'notes' => 'Bayar langsung',
        ])->assertOk()
            ->assertJsonPath('spp_bill.status', 'paid')
            ->assertJsonPath('spp_bill.paid_amount', '150000.00');
    }

    public function test_pelatih_cannot_generate_or_pay_spp(): void
    {
        Sanctum::actingAs(User::factory()->pelatih($this->akademi->id)->create());

        $this->postJson('/api/akademi/spp-bills/generate', [
            'billing_year' => 2026,
            'billing_month' => 5,
            'default_amount' => 150000,
        ])->assertForbidden()
            ->assertJsonPath('message', 'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengubah SPP.');
    }

    public function test_admin_can_configure_evaluation_and_coach_can_score_students(): void
    {
        $class = $this->akademi->trainingClasses()->create(['name' => 'Junior']);
        $student = $this->akademi->siswa()->create([
            'primary_class_id' => $class->id,
            'member_number' => 'GARUDA-0001',
            'name' => 'Budi',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-05-23',
            'height_cm' => 145,
            'weight_kg' => 38,
            'status' => 'active',
        ]);

        $periodId = $this->postJson('/api/akademi/evaluations/periods', [
            'name' => 'Semester 1 2026',
            'starts_at' => '2026-01-01',
            'ends_at' => '2026-06-30',
            'status' => 'active',
        ])->assertCreated()
            ->assertJsonPath('evaluation_period.status', 'active')
            ->json('evaluation_period.id');

        $aspectId = $this->postJson('/api/akademi/evaluations/aspects', [
            'name' => 'Teknik Dasar',
            'category' => 'Teknik',
            'sort_order' => 1,
        ])->assertCreated()
            ->assertJsonPath('evaluation_aspect.name', 'Teknik Dasar')
            ->json('evaluation_aspect.id');

        $coach = User::factory()->pelatih($this->akademi->id)->create();
        Sanctum::actingAs($coach);

        $this->postJson("/api/akademi/evaluations/periods/{$periodId}/scores", [
            'scores' => [
                [
                    'student_id' => $student->id,
                    'evaluation_aspect_id' => $aspectId,
                    'score' => 92,
                    'notes' => 'Stabil dan percaya diri.',
                ],
            ],
        ])->assertOk()
            ->assertJsonPath('data.0.score', 92)
            ->assertJsonPath('data.0.indicator', 'sangat_baik')
            ->assertJsonPath('data.0.assessed_by', $coach->id);

        $this->getJson("/api/akademi/evaluations/periods/{$periodId}/scores")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.aspect.name', 'Teknik Dasar')
            ->assertJsonPath('data.0.student.name', 'Budi');
    }

    public function test_pelatih_cannot_configure_evaluation_and_closed_period_rejects_scores(): void
    {
        Sanctum::actingAs(User::factory()->pelatih($this->akademi->id)->create());

        $this->postJson('/api/akademi/evaluations/aspects', [
            'name' => 'Teknik Dasar',
        ])->assertForbidden()
            ->assertJsonPath('message', 'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengatur evaluasi.');

        Sanctum::actingAs($this->admin);

        $periodId = $this->postJson('/api/akademi/evaluations/periods', [
            'name' => 'Periode Tertutup',
            'starts_at' => '2026-01-01',
            'ends_at' => '2026-03-31',
            'status' => 'closed',
        ])->json('evaluation_period.id');

        $aspectId = $this->postJson('/api/akademi/evaluations/aspects', [
            'name' => 'Disiplin',
        ])->json('evaluation_aspect.id');

        $student = $this->akademi->siswa()->create([
            'member_number' => 'GARUDA-0001',
            'name' => 'Budi',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-05-23',
            'height_cm' => 145,
            'weight_kg' => 38,
            'status' => 'active',
        ]);

        $this->postJson("/api/akademi/evaluations/periods/{$periodId}/scores", [
            'scores' => [
                [
                    'student_id' => $student->id,
                    'evaluation_aspect_id' => $aspectId,
                    'score' => 80,
                ],
            ],
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'Periode evaluasi sudah ditutup.');
    }
}
