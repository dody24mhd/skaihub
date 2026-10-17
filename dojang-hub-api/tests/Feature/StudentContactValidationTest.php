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

class StudentContactValidationTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $akademi;

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
        app(SubscriptionService::class)->createInitial($this->akademi, [
            'plan' => 'starter',
            'duration_type' => 'monthly',
        ]);

        Sanctum::actingAs(User::factory()->akademiAdmin($this->akademi->id)->create());
    }

    private function adultPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Siswa Dewasa',
            'gender' => 'male',
            'birth_date' => now()->subYears(20)->toDateString(),
            'joined_date' => '2026-05-23',
            'student_phone' => '081200001111',
        ], $overrides);
    }

    private function minorPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Siswa Anak',
            'gender' => 'female',
            'birth_date' => now()->subYears(10)->toDateString(),
            'joined_date' => '2026-05-23',
            'guardian_name' => 'Ibu Siswa',
            'guardian_phone' => '081200002222',
        ], $overrides);
    }

    private function createStudent(array $overrides = []): Student
    {
        return $this->akademi->siswa()->create(array_merge([
            'member_number' => 'LEGACY-01',
            'name' => 'Siswa Lama',
            'gender' => 'male',
            'birth_date' => now()->subYears(10)->toDateString(),
            'joined_date' => '2025-01-01',
            'height_cm' => 140,
            'weight_kg' => 35,
            'status' => 'active',
        ], $overrides));
    }

    public function test_requires_at_least_one_contact_phone(): void
    {
        $this->postJson('/api/akademi/students', $this->adultPayload(['student_phone' => null]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['student_phone'])
            ->assertJsonPath('errors.student_phone.0', 'Isi minimal satu nomor kontak: nomor siswa atau nomor wali.');
    }

    public function test_adult_can_register_with_only_guardian_phone(): void
    {
        $this->postJson('/api/akademi/students', $this->adultPayload([
            'student_phone' => null,
            'guardian_phone' => '081200003333',
        ]))->assertCreated();
    }

    public function test_adult_can_register_with_only_student_phone_and_no_guardian(): void
    {
        $this->postJson('/api/akademi/students', $this->adultPayload())
            ->assertCreated()
            ->assertJsonPath('student.guardian_name', null);
    }

    public function test_minor_requires_guardian_name_and_phone(): void
    {
        $this->postJson('/api/akademi/students', $this->minorPayload([
            'guardian_name' => null,
            'guardian_phone' => null,
            'student_phone' => '081200004444',
        ]))->assertUnprocessable()
            ->assertJsonValidationErrors(['guardian_name', 'guardian_phone'])
            ->assertJsonPath('errors.guardian_name.0', 'Nama wali wajib diisi untuk siswa di bawah 17 tahun.')
            ->assertJsonPath('errors.guardian_phone.0', 'Nomor wali wajib diisi untuk siswa di bawah 17 tahun.');
    }

    public function test_guardian_rule_boundary_at_seventeen_years(): void
    {
        $this->postJson('/api/akademi/students', $this->adultPayload([
            'name' => 'Tepat 17',
            'birth_date' => now()->subYears(17)->toDateString(),
        ]))->assertCreated();

        $this->postJson('/api/akademi/students', $this->adultPayload([
            'name' => 'Sehari Sebelum 17',
            'birth_date' => now()->subYears(17)->addDay()->toDateString(),
        ]))->assertUnprocessable()
            ->assertJsonValidationErrors(['guardian_name', 'guardian_phone']);
    }

    public function test_height_and_weight_are_optional(): void
    {
        $response = $this->postJson('/api/akademi/students', $this->minorPayload())
            ->assertCreated()
            ->assertJsonPath('student.height_cm', null)
            ->assertJsonPath('student.weight_kg', null);

        $this->assertDatabaseHas('students', [
            'id' => $response->json('student.id'),
            'height_cm' => null,
            'weight_kg' => null,
        ]);
    }

    public function test_height_and_weight_still_validated_when_filled(): void
    {
        $this->postJson('/api/akademi/students', $this->minorPayload(['height_cm' => 0, 'weight_kg' => 500]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['height_cm', 'weight_kg']);
    }

    public function test_update_removing_guardian_of_minor_is_rejected(): void
    {
        $student = $this->createStudent([
            'guardian_name' => 'Ayah',
            'guardian_phone' => '081200005555',
        ]);

        $this->putJson("/api/akademi/students/{$student->id}", ['guardian_phone' => null])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['guardian_phone']);
    }

    public function test_update_birth_date_to_minor_requires_guardian(): void
    {
        $student = $this->createStudent([
            'birth_date' => now()->subYears(25)->toDateString(),
            'student_phone' => '081200006666',
        ]);

        $this->putJson("/api/akademi/students/{$student->id}", [
            'birth_date' => now()->subYears(12)->toDateString(),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['guardian_name', 'guardian_phone']);
    }

    public function test_update_without_contact_fields_does_not_block_legacy_student(): void
    {
        $student = $this->createStudent();

        $this->putJson("/api/akademi/students/{$student->id}", ['status' => 'inactive'])
            ->assertOk()
            ->assertJsonPath('student.status', 'inactive');
    }

    public function test_update_with_contact_fields_validates_merged_record(): void
    {
        $student = $this->createStudent();

        $this->putJson("/api/akademi/students/{$student->id}", ['guardian_name' => 'Ibu'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['student_phone', 'guardian_phone']);

        $this->putJson("/api/akademi/students/{$student->id}", [
            'guardian_name' => 'Ibu',
            'guardian_phone' => '081200007777',
        ])->assertOk()
            ->assertJsonPath('student.guardian_phone', '081200007777');
    }

    public function test_demo_seeder_students_satisfy_contact_rules(): void
    {
        $this->seed(DemoAkademiSeeder::class);

        $students = Student::query()->get();
        $this->assertNotEmpty($students);

        foreach ($students as $student) {
            $this->assertTrue(filled($student->student_phone) || filled($student->guardian_phone), $student->name);

            if ($student->birth_date->age < 17) {
                $this->assertTrue(filled($student->guardian_name) && filled($student->guardian_phone), $student->name);
            }
        }
    }
}
