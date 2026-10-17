<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentAchievementTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $akademiA;

    private Akademi $akademiB;

    private User $adminA;

    private User $coachA;

    private User $adminB;

    private Student $studentA1;

    private Student $studentA2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->akademiA = Akademi::create([
            'name' => 'Akademi Elang A',
            'slug' => 'akademi-elang-a',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);

        $this->giveActiveSubscription($this->akademiA);

        $this->akademiB = Akademi::create([
            'name' => 'Akademi Macan B',
            'slug' => 'akademi-macan-b',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);

        $this->giveActiveSubscription($this->akademiB);

        $this->adminA = User::factory()->akademiAdmin($this->akademiA->id)->create();
        $this->coachA = User::factory()->pelatih($this->akademiA->id)->create();
        $this->adminB = User::factory()->akademiAdmin($this->akademiB->id)->create();

        $this->studentA1 = $this->akademiA->siswa()->create([
            'member_number' => 'ELG-001',
            'name' => 'Gilang',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-01-01',
            'height_cm' => 145,
            'weight_kg' => 40,
            'status' => 'active',
        ]);

        $this->studentA2 = $this->akademiA->siswa()->create([
            'member_number' => 'ELG-002',
            'name' => 'Tari',
            'gender' => 'female',
            'birth_date' => '2014-03-01',
            'joined_date' => '2026-01-01',
            'height_cm' => 140,
            'weight_kg' => 38,
            'status' => 'active',
        ]);
    }

    public function test_admin_can_crud_student_achievements(): void
    {
        Sanctum::actingAs($this->adminA);

        // CREATE
        $createRes = $this->postJson("/api/akademi/students/{$this->studentA1->id}/achievements", [
            'title' => 'Juara 1 Kyorugi Cadet',
            'event_name' => 'Kejuaraan Nasional 2026',
            'achieved_on' => '2026-04-15',
            'result_label' => 'Medali Emas',
            'notes' => 'Tampil memukau di babak final',
        ])->assertCreated();

        $achievementId = $createRes->json('student_achievement.id');
        $this->assertSame('Juara 1 Kyorugi Cadet', $createRes->json('student_achievement.title'));

        $this->assertDatabaseHas('student_achievements', [
            'id' => $achievementId,
            'akademi_id' => $this->akademiA->id,
            'student_id' => $this->studentA1->id,
            'title' => 'Juara 1 Kyorugi Cadet',
            'result_label' => 'Medali Emas',
        ]);

        // READ (list)
        $this->getJson("/api/akademi/students/{$this->studentA1->id}/achievements")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Juara 1 Kyorugi Cadet');

        // UPDATE
        $this->putJson("/api/akademi/students/{$this->studentA1->id}/achievements/{$achievementId}", [
            'title' => 'Juara 1 Kyorugi Cadet U-45',
            'result_label' => 'Emas',
        ])->assertOk()
            ->assertJsonPath('student_achievement.title', 'Juara 1 Kyorugi Cadet U-45')
            ->assertJsonPath('student_achievement.result_label', 'Emas');

        $this->assertDatabaseHas('student_achievements', [
            'id' => $achievementId,
            'title' => 'Juara 1 Kyorugi Cadet U-45',
        ]);

        // DELETE
        $this->deleteJson("/api/akademi/students/{$this->studentA1->id}/achievements/{$achievementId}")
            ->assertOk();

        $this->assertSoftDeleted('student_achievements', ['id' => $achievementId]);
    }

    public function test_coach_can_read_but_cannot_create_achievement(): void
    {
        Sanctum::actingAs($this->coachA);

        // Coach can list achievements
        $this->getJson("/api/akademi/students/{$this->studentA1->id}/achievements")
            ->assertOk();

        // Coach cannot create achievement -> 403
        $this->postJson("/api/akademi/students/{$this->studentA1->id}/achievements", [
            'title' => 'Juara 2 Poomsae',
        ])->assertForbidden();
    }

    public function test_tenant_isolation_on_achievements(): void
    {
        Sanctum::actingAs($this->adminA);

        $createRes = $this->postJson("/api/akademi/students/{$this->studentA1->id}/achievements", [
            'title' => 'Juara 1 Kyorugi',
        ]);

        $achievementId = $createRes->json('student_achievement.id');

        // Admin B from another academy attempts to access
        Sanctum::actingAs($this->adminB);

        $this->getJson("/api/akademi/students/{$this->studentA1->id}/achievements")
            ->assertNotFound();

        $this->putJson("/api/akademi/students/{$this->studentA1->id}/achievements/{$achievementId}", [
            'title' => 'Hack title',
        ])->assertNotFound();

        $this->deleteJson("/api/akademi/students/{$this->studentA1->id}/achievements/{$achievementId}")
            ->assertNotFound();
    }

    public function test_achievement_must_belong_to_the_specified_student(): void
    {
        Sanctum::actingAs($this->adminA);

        $achievementA1 = $this->studentA1->achievements()->create([
            'akademi_id' => $this->akademiA->id,
            'title' => 'Prestasi Siswa 1',
        ]);

        // Attempting to access Student 1's achievement via Student 2's URL -> 404
        $this->putJson("/api/akademi/students/{$this->studentA2->id}/achievements/{$achievementA1->id}", [
            'title' => 'Ubah via Siswa 2',
        ])->assertNotFound();

        $this->deleteJson("/api/akademi/students/{$this->studentA2->id}/achievements/{$achievementA1->id}")
            ->assertNotFound();
    }
}
