<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\TrainingClass;
use App\Models\TrainingSchedule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTrainingFixtures;
use Tests\TestCase;

class TrainingSessionBackfillTest extends TestCase
{
    use BuildsTrainingFixtures;
    use RefreshDatabase;

    private const WINDOW_MESSAGE = 'Pelatih hanya bisa mengisi sesi hari ini hingga 7 hari ke belakang.';

    private Akademi $akademi;

    private User $admin;

    private User $coach;

    private TrainingClass $class;

    private TrainingSchedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-10-19 08:00:00');
        $this->akademi = $this->makeAkademi();
        $this->admin = User::factory()->ketuaAkademi($this->akademi->id)->create();
        $this->coach = User::factory()->pelatih($this->akademi->id)->create();
        $this->class = $this->makeClass($this->akademi);
        $this->schedule = $this->makeSchedule($this->akademi, $this->class, 1, [$this->coach->id]);
    }

    public function test_coach_can_open_schedule_up_to_seven_days_back(): void
    {
        Sanctum::actingAs($this->coach);

        $this->postJson('/api/akademi/training-sessions/from-schedule', [
            'training_schedule_id' => $this->schedule->id,
            'date' => '2026-10-12',
        ])->assertCreated();

        $this->postJson('/api/akademi/training-sessions/from-schedule', [
            'training_schedule_id' => $this->schedule->id,
            'date' => '2026-10-05',
        ])->assertForbidden()->assertJsonPath('message', self::WINDOW_MESSAGE);

        $this->postJson('/api/akademi/training-sessions/from-schedule', [
            'training_schedule_id' => $this->schedule->id,
            'date' => '2026-10-26',
        ])->assertForbidden();
    }

    public function test_coach_manual_session_respects_window(): void
    {
        Sanctum::actingAs($this->coach);
        $payload = ['class_id' => $this->class->id, 'starts_at' => '16:00', 'ends_at' => '17:00'];

        $this->postJson('/api/akademi/training-sessions', [...$payload, 'session_date' => '2026-10-15'])->assertCreated();
        $this->postJson('/api/akademi/training-sessions', [...$payload, 'session_date' => '2026-10-11'])->assertForbidden();
        $this->postJson('/api/akademi/training-sessions', [...$payload, 'session_date' => '2026-10-20'])->assertForbidden();
    }

    public function test_coach_cannot_update_session_older_than_window(): void
    {
        $old = $this->makeSession($this->akademi, $this->class, ['session_date' => '2026-10-10', 'coach_id' => $this->coach->id]);
        $recent = $this->makeSession($this->akademi, $this->class, ['session_date' => '2026-10-13', 'coach_id' => $this->coach->id]);
        Sanctum::actingAs($this->coach);

        $this->patchJson("/api/akademi/training-sessions/{$old->id}/attendance", ['material' => 'Telat'])
            ->assertForbidden()->assertJsonPath('message', self::WINDOW_MESSAGE);
        $this->putJson("/api/akademi/training-sessions/{$old->id}", ['material' => 'Telat'])->assertForbidden();
        $this->patchJson("/api/akademi/training-sessions/{$recent->id}/attendance", ['material' => 'Masih boleh'])->assertOk();
        $this->putJson("/api/akademi/training-sessions/{$recent->id}", ['session_date' => '2026-10-25'])->assertForbidden();
    }

    public function test_coach_today_listing_respects_window(): void
    {
        Sanctum::actingAs($this->coach);

        $this->getJson('/api/akademi/sessions/today?date=2026-10-12')->assertOk();
        $this->getJson('/api/akademi/sessions/today?date=2026-10-11')->assertForbidden();
    }

    public function test_admin_can_use_any_past_or_future_date(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/akademi/training-sessions/from-schedule', [
            'training_schedule_id' => $this->schedule->id,
            'date' => '2026-09-07',
        ])->assertCreated();
        $this->postJson('/api/akademi/training-sessions/from-schedule', [
            'training_schedule_id' => $this->schedule->id,
            'date' => '2026-11-02',
        ])->assertCreated();
        $this->getJson('/api/akademi/sessions/today?date=2026-11-02')->assertOk()->assertJsonCount(1, 'data');
    }
}
