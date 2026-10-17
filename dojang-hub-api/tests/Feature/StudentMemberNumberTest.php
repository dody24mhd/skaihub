<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\Student;
use App\Models\User;
use App\Services\SubscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentMemberNumberTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $garuda;

    private Akademi $garudaJaya;

    protected function setUp(): void
    {
        parent::setUp();

        $this->garuda = $this->makeAkademi('Garuda Sakti', 'garuda-sakti');
        $this->garudaJaya = $this->makeAkademi('Garuda Jaya', 'garuda-jaya');
    }

    private function makeAkademi(string $name, string $slug): Akademi
    {
        $akademi = Akademi::create([
            'name' => $name,
            'slug' => $slug,
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'starter',
        ]);
        app(SubscriptionService::class)->createInitial($akademi, ['plan' => 'starter', 'duration_type' => 'monthly']);

        return $akademi;
    }

    private function actAs(Akademi $akademi): void
    {
        Sanctum::actingAs(User::factory()->akademiAdmin($akademi->id)->create());
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Siswa Baru',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-05-23',
            'guardian_name' => 'Wali Siswa',
            'guardian_phone' => '081200000009',
        ], $overrides);
    }

    private function createStudentNumber(Akademi $akademi): string
    {
        $this->actAs($akademi);

        return $this->postJson('/api/akademi/students', $this->payload())
            ->assertCreated()
            ->json('student.member_number');
    }

    public function test_member_numbers_are_counted_per_akademi_with_similar_slugs(): void
    {
        $this->assertSame('GARUDA-0001', $this->createStudentNumber($this->garuda));
        $this->assertSame('GARUDA-0002', $this->createStudentNumber($this->garuda));
        $this->assertSame('GARUDA-0001', $this->createStudentNumber($this->garudaJaya));
        $this->assertSame('GARUDA-0003', $this->createStudentNumber($this->garuda));
    }

    public function test_soft_deleted_member_number_is_not_reused(): void
    {
        $first = $this->createStudentNumber($this->garuda);
        Student::where('member_number', $first)->firstOrFail()->delete();

        $this->assertSame('GARUDA-0002', $this->createStudentNumber($this->garuda));
    }

    public function test_next_number_follows_highest_existing_suffix(): void
    {
        $this->garuda->siswa()->create([
            'member_number' => 'GARUDA-0007',
            'name' => 'Siswa Lama',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2025-01-01',
            'status' => 'inactive',
        ]);
        $this->garuda->siswa()->create([
            'member_number' => 'MANUAL-99',
            'name' => 'Siswa Manual',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2025-01-01',
            'status' => 'inactive',
        ]);

        $this->assertSame('GARUDA-0008', $this->createStudentNumber($this->garuda));
    }

    public function test_existing_member_numbers_are_unchanged(): void
    {
        $legacy = $this->garuda->siswa()->create([
            'member_number' => 'GARUDA-0004',
            'name' => 'Siswa Lama',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2025-01-01',
            'status' => 'active',
        ]);

        $this->createStudentNumber($this->garuda);

        $this->assertSame('GARUDA-0004', $legacy->fresh()->member_number);
    }

    public function test_retries_when_generated_number_collides_with_concurrent_insert(): void
    {
        $this->actAs($this->garuda);
        $attempts = 0;

        Student::creating(function (Student $student) use (&$attempts) {
            $attempts++;

            if ($attempts === 1) {
                DB::table('students')->insert([
                    'akademi_id' => $student->akademi_id,
                    'member_number' => $student->member_number,
                    'name' => 'Siswa Request Lain',
                    'gender' => 'male',
                    'birth_date' => '2014-01-01',
                    'joined_date' => '2025-01-01',
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });

        $this->postJson('/api/akademi/students', $this->payload())
            ->assertCreated()
            ->assertJsonPath('student.name', 'Siswa Baru');

        $this->assertSame(2, $attempts);
    }

    public function test_manual_member_number_still_unique_per_akademi_only(): void
    {
        $this->actAs($this->garuda);
        $this->postJson('/api/akademi/students', $this->payload(['member_number' => 'X-1']))->assertCreated();
        $this->postJson('/api/akademi/students', $this->payload(['member_number' => 'X-1']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['member_number']);

        $this->actAs($this->garudaJaya);
        $this->postJson('/api/akademi/students', $this->payload(['member_number' => 'X-1']))->assertCreated();
    }
}
