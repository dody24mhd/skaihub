<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\Student;
use App\Models\User;
use App\Services\SubscriptionService;
use Database\Seeders\DemoAkademiSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentQuotaTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $akademi;

    private User $admin;

    private SubscriptionService $subscriptionService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->subscriptionService = app(SubscriptionService::class);

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

    private function createStudent(int $akademiId, string $status = 'active'): Student
    {
        static $counter = 1;

        return Student::create([
            'akademi_id' => $akademiId,
            'member_number' => 'MBR-'.str_pad((string) $counter, 5, '0', STR_PAD_LEFT),
            'name' => 'Siswa '.$counter++,
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-05-23',
            'height_cm' => 150,
            'weight_kg' => 45,
            'status' => $status,
        ]);
    }

    private function createStudents(int $count, int $akademiId, string $status = 'active'): void
    {
        for ($i = 0; $i < $count; $i++) {
            $this->createStudent($akademiId, $status);
        }
    }

    private function validStudentPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Siswa Baru',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-05-23',
            'height_cm' => 150,
            'weight_kg' => 45,
            'guardian_name' => 'Wali Siswa',
            'guardian_phone' => '081200000001',
            'status' => 'active',
        ], $overrides);
    }

    public function test_can_create_student_when_under_quota_limit(): void
    {
        $this->subscriptionService->createInitial($this->akademi, [
            'plan' => 'starter',
            'duration_type' => 'monthly',
        ]);

        $this->postJson('/api/akademi/students', $this->validStudentPayload([
            'name' => 'Siswa Pertama',
        ]))->assertCreated()
            ->assertJsonPath('student.name', 'Siswa Pertama');
    }

    public function test_cannot_create_active_student_when_quota_is_full(): void
    {
        $this->subscriptionService->createInitial($this->akademi, [
            'plan' => 'starter',
            'duration_type' => 'monthly',
        ]);

        $this->createStudents(50, $this->akademi->id, 'active');

        $this->postJson('/api/akademi/students', $this->validStudentPayload([
            'name' => 'Siswa Ke-51',
        ]))->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_extra_student_blocks_increases_quota_limit(): void
    {
        $this->subscriptionService->createInitial($this->akademi, [
            'plan' => 'starter',
            'duration_type' => 'monthly',
            'extra_student_blocks' => 1,
        ]);

        $this->createStudents(50, $this->akademi->id, 'active');

        $this->postJson('/api/akademi/students', $this->validStudentPayload([
            'name' => 'Siswa Ke-51',
        ]))->assertCreated()
            ->assertJsonPath('student.name', 'Siswa Ke-51');
    }

    public function test_alumni_and_inactive_students_do_not_count_towards_quota(): void
    {
        $this->subscriptionService->createInitial($this->akademi, [
            'plan' => 'starter',
            'duration_type' => 'monthly',
        ]);

        $this->createStudents(49, $this->akademi->id, 'active');
        $this->createStudents(10, $this->akademi->id, 'alumni');
        $this->createStudents(10, $this->akademi->id, 'inactive');

        $this->postJson('/api/akademi/students', $this->validStudentPayload([
            'name' => 'Siswa Ke-50',
            'gender' => 'female',
        ]))->assertCreated()
            ->assertJsonPath('student.name', 'Siswa Ke-50');
    }

    public function test_reactivating_inactive_student_to_active_fails_when_quota_is_full(): void
    {
        $this->subscriptionService->createInitial($this->akademi, [
            'plan' => 'starter',
            'duration_type' => 'monthly',
        ]);

        $this->createStudents(50, $this->akademi->id, 'active');
        $inactiveStudent = $this->createStudent($this->akademi->id, 'inactive');

        $this->putJson("/api/akademi/students/{$inactiveStudent->id}", [
            'status' => 'active',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['status']);

        // Active student updating other fields should succeed
        $activeStudent = Student::where('akademi_id', $this->akademi->id)->where('status', 'active')->first();
        $this->putJson("/api/akademi/students/{$activeStudent->id}", [
            'name' => 'Nama Baru',
        ])->assertOk()
            ->assertJsonPath('student.name', 'Nama Baru');
    }

    public function test_cannot_create_active_student_without_active_subscription(): void
    {
        // No subscription created for $this->akademi
        $this->postJson('/api/akademi/students', $this->validStudentPayload([
            'name' => 'Siswa Tanpa Langganan',
        ]))->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_other_akademi_students_do_not_affect_quota(): void
    {
        $this->subscriptionService->createInitial($this->akademi, [
            'plan' => 'starter',
            'duration_type' => 'monthly',
        ]);

        $this->createStudents(50, $this->akademi->id, 'active');

        $otherAkademi = Akademi::create([
            'name' => 'Elang Putih',
            'slug' => 'elang-putih',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'starter',
        ]);

        $this->subscriptionService->createInitial($otherAkademi, [
            'plan' => 'starter',
            'duration_type' => 'monthly',
        ]);

        $otherAdmin = User::factory()->akademiAdmin($otherAkademi->id)->create();
        Sanctum::actingAs($otherAdmin);

        $this->postJson('/api/akademi/students', $this->validStudentPayload([
            'name' => 'Siswa Elang',
        ]))->assertCreated()
            ->assertJsonPath('student.name', 'Siswa Elang');
    }

    public function test_demo_akademi_seeder_runs_successfully(): void
    {
        $this->seed(DemoAkademiSeeder::class);

        $this->assertDatabaseHas('akademi', ['slug' => 'garuda-sakti']);
        $this->assertDatabaseHas('subscriptions', [
            'status' => 'active',
            'plan' => 'pro',
        ]);
        $this->assertDatabaseHas('students', [
            'status' => 'active',
        ]);
    }
}
