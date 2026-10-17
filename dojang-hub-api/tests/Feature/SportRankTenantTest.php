<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\SportRank;
use App\Models\StudentRankHistory;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SportRankTenantTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $akademiA;

    private Akademi $akademiB;

    private User $adminA;

    private User $adminB;

    private SportRank $globalRank;

    private SportRank $rankA;

    private SportRank $rankB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->akademiA = Akademi::create([
            'name' => 'Akademi Harimau',
            'slug' => 'akademi-harimau',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);

        Subscription::create([
            'akademi_id' => $this->akademiA->id,
            'plan' => 'pro',
            'duration_type' => 'monthly',
            'duration_months' => 1,
            'included_student_limit' => 150,
            'extra_student_blocks' => 0,
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
            'amount' => 199000,
            'payment_status' => 'paid',
            'status' => 'active',
            'activated_at' => now(),
        ]);

        $this->akademiB = Akademi::create([
            'name' => 'Akademi Rajawali',
            'slug' => 'akademi-rajawali',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);

        $this->adminA = User::factory()->akademiAdmin($this->akademiA->id)->create();
        $this->adminB = User::factory()->akademiAdmin($this->akademiB->id)->create();

        $this->globalRank = SportRank::create([
            'sport_type' => 'taekwondo',
            'code' => 'TKD-WH',
            'label' => 'Sabuk Putih',
            'sequence' => 1,
            'akademi_id' => null,
        ]);

        $this->rankA = SportRank::create([
            'sport_type' => 'taekwondo',
            'code' => 'TKD-HA-1',
            'label' => 'Strip Khusus Harimau',
            'sequence' => 2,
            'akademi_id' => $this->akademiA->id,
        ]);

        $this->rankB = SportRank::create([
            'sport_type' => 'taekwondo',
            'code' => 'TKD-RJ-1',
            'label' => 'Strip Khusus Rajawali',
            'sequence' => 3,
            'akademi_id' => $this->akademiB->id,
        ]);
    }

    public function test_sport_ranks_index_shows_global_and_own_ranks_only(): void
    {
        Sanctum::actingAs($this->adminA);

        $response = $this->getJson('/api/akademi/sport-ranks')
            ->assertOk();

        $codes = collect($response->json('data'))->pluck('code')->all();

        $this->assertContains('TKD-WH', $codes);
        $this->assertContains('TKD-HA-1', $codes);
        $this->assertNotContains('TKD-RJ-1', $codes);
    }

    public function test_akademi_cannot_update_or_delete_global_rank(): void
    {
        Sanctum::actingAs($this->adminA);

        $this->putJson("/api/akademi/sport-ranks/{$this->globalRank->id}", [
            'label' => 'Ubah Sabuk Putih',
        ])->assertForbidden()
            ->assertJsonPath('message', 'Tingkatan bawaan tidak bisa diubah.');

        $this->deleteJson("/api/akademi/sport-ranks/{$this->globalRank->id}")
            ->assertForbidden()
            ->assertJsonPath('message', 'Tingkatan bawaan tidak bisa diubah.');
    }

    public function test_akademi_cannot_update_or_delete_other_akademi_rank(): void
    {
        Sanctum::actingAs($this->adminA);

        $this->putJson("/api/akademi/sport-ranks/{$this->rankB->id}", [
            'label' => 'Ubah Sabuk Rajawali',
        ])->assertNotFound();

        $this->deleteJson("/api/akademi/sport-ranks/{$this->rankB->id}")
            ->assertNotFound();
    }

    public function test_student_cannot_be_assigned_other_akademi_rank(): void
    {
        Sanctum::actingAs($this->adminA);

        $baseStudent = [
            'name' => 'Siswa Harimau',
            'gender' => 'male',
            'birth_date' => '2012-01-01',
            'joined_date' => '2024-01-01',
            'height_cm' => 140,
            'weight_kg' => 35,
            'guardian_name' => 'Wali Harimau',
            'guardian_phone' => '081200000002',
        ];

        $this->postJson('/api/akademi/students', array_merge($baseStudent, [
            'current_rank_id' => $this->rankB->id,
        ]))->assertUnprocessable()
            ->assertJsonValidationErrors(['current_rank_id']);

        $this->postJson('/api/akademi/students', array_merge($baseStudent, [
            'name' => 'Siswa Harimau Valid',
            'current_rank_id' => $this->rankA->id,
        ]))->assertCreated();
    }

    public function test_cannot_delete_sport_rank_used_in_student_rank_histories(): void
    {
        Sanctum::actingAs($this->adminA);

        $student = $this->akademiA->siswa()->create([
            'member_number' => 'HRM-R2',
            'name' => 'Siswa Riwayat',
            'gender' => 'male',
            'birth_date' => '2012-01-01',
            'joined_date' => '2024-01-01',
            'height_cm' => 140,
            'weight_kg' => 35,
            'status' => 'active',
            'current_rank_id' => $this->globalRank->id,
        ]);

        StudentRankHistory::create([
            'akademi_id' => $this->akademiA->id,
            'student_id' => $student->id,
            'sport_rank_id' => $this->rankA->id,
            'achieved_on' => '2025-01-01',
            'source_type' => 'manual',
        ]);

        $this->deleteJson("/api/akademi/sport-ranks/{$this->rankA->id}")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Tingkatan sudah dipakai dan tidak bisa dihapus.');
    }

    public function test_global_sport_ranks_cannot_have_duplicate_code_for_same_sport_type(): void
    {
        $this->expectException(QueryException::class);

        SportRank::create([
            'sport_type' => 'taekwondo',
            'code' => 'TKD-WH',
            'label' => 'Sabuk Putih Duplikat',
            'sequence' => 99,
            'akademi_id' => null,
        ]);
    }
}
