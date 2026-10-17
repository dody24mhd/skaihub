<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\TrainingClass;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TrainingSessionSecurityTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $akademi;

    private User $admin;

    private User $coachA;

    private User $coachB;

    private TrainingClass $class;

    private TrainingSession $session;

    protected function setUp(): void
    {
        parent::setUp();

        $this->akademi = Akademi::create([
            'name' => 'Akademi Juara',
            'slug' => 'akademi-juara',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);

        $this->admin = User::factory()->akademiAdmin($this->akademi->id)->create();
        $this->coachA = User::factory()->pelatih($this->akademi->id)->create();
        $this->coachB = User::factory()->pelatih($this->akademi->id)->create();

        $this->class = $this->akademi->trainingClasses()->create(['name' => 'Kelas Prestasi']);

        $this->session = $this->akademi->trainingSessions()->create([
            'class_id' => $this->class->id,
            'coach_id' => $this->coachA->id,
            'session_date' => now()->toDateString(),
            'starts_at' => '16:00',
            'ends_at' => '17:30',
        ]);
        $this->session->coaches()->attach($this->coachA->id);
    }

    public function test_unassigned_coach_cannot_update_or_record_attendance(): void
    {
        Sanctum::actingAs($this->coachB);

        $this->patchJson("/api/akademi/training-sessions/{$this->session->id}/attendance", [
            'material' => 'Mencoba mengajar sesi orang lain',
        ])->assertForbidden();

        $this->putJson("/api/akademi/training-sessions/{$this->session->id}", [
            'material' => 'Mencoba update sesi',
        ])->assertForbidden();
    }

    public function test_assigned_coach_can_record_attendance(): void
    {
        Sanctum::actingAs($this->coachA);

        $this->patchJson("/api/akademi/training-sessions/{$this->session->id}/attendance", [
            'material' => 'Materi tendangan dasar',
        ])->assertOk()
            ->assertJsonPath('training_session.material', 'Materi tendangan dasar');
    }

    public function test_coach_cannot_destroy_session(): void
    {
        Sanctum::actingAs($this->coachA);

        $this->deleteJson("/api/akademi/training-sessions/{$this->session->id}")
            ->assertForbidden()
            ->assertJsonPath('message', 'Akses ditolak. Pelatih tidak bisa menghapus sesi latihan.');
    }

    public function test_coach_cannot_change_class_id_or_schedule_id(): void
    {
        $class2 = $this->akademi->trainingClasses()->create(['name' => 'Kelas Cadangan']);

        Sanctum::actingAs($this->coachA);

        $this->putJson("/api/akademi/training-sessions/{$this->session->id}", [
            'class_id' => $class2->id,
        ])->assertForbidden();
    }

    public function test_index_per_page_is_capped_at_100(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/akademi/training-sessions?per_page=500')
            ->assertOk();

        $this->assertSame(100, $response->json('data.per_page'));
    }
}
