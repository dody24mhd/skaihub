<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\TrainingClass;
use App\Models\TrainingSchedule;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTrainingFixtures;
use Tests\TestCase;

class TrainingSessionRosterSyncTest extends TestCase
{
    use BuildsTrainingFixtures;
    use RefreshDatabase;

    private Akademi $akademi;

    private User $admin;

    private TrainingClass $class;

    private TrainingSchedule $schedule;

    private TrainingSession $session;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-10-19 08:00:00');
        $this->akademi = $this->makeAkademi();
        $this->admin = User::factory()->akademiAdmin($this->akademi->id)->create();
        $this->class = $this->makeClass($this->akademi);
        $this->schedule = $this->makeSchedule($this->akademi, $this->class, 1);
        $existing = $this->makeStudent($this->akademi, $this->class, 'Arya');
        $this->session = $this->makeSession($this->akademi, $this->class, [
            'training_schedule_id' => $this->schedule->id,
            'source_schedule_date' => '2026-10-19',
            'session_date' => '2026-10-19',
        ]);
        $this->session->attendances()->create(['student_id' => $existing->id, 'status' => 'sick']);
        $this->makeStudent($this->akademi, $this->class, 'Bima');
        $this->makeStudent($this->akademi, $this->class, 'Cici', 'inactive');
        Sanctum::actingAs($this->admin);
    }

    public function test_opening_draft_session_adds_new_active_students_without_touching_existing(): void
    {
        $response = $this->getJson("/api/akademi/training-sessions/{$this->session->id}")->assertOk();

        $attendances = collect($response->json('training_session.attendances'))->keyBy('student.name');
        $this->assertSame(['Arya', 'Bima'], $attendances->keys()->sort()->values()->all());
        $this->assertSame('sick', $attendances['Arya']['status']);
        $this->assertSame('present', $attendances['Bima']['status']);

        $this->getJson("/api/akademi/training-sessions/{$this->session->id}")
            ->assertJsonCount(2, 'training_session.attendances');
    }

    public function test_from_schedule_and_attendance_update_sync_draft_roster(): void
    {
        $this->postJson('/api/akademi/training-sessions/from-schedule', [
            'training_schedule_id' => $this->schedule->id,
            'date' => '2026-10-19',
        ])->assertOk()->assertJsonCount(2, 'training_session.attendances');

        $this->makeStudent($this->akademi, $this->class, 'Dodi');

        $this->patchJson("/api/akademi/training-sessions/{$this->session->id}/attendance", ['material' => 'Poomsae'])
            ->assertOk()
            ->assertJsonCount(3, 'training_session.attendances');
    }

    public function test_completed_session_roster_is_not_changed(): void
    {
        $this->session->update(['status' => 'completed']);

        $this->getJson("/api/akademi/training-sessions/{$this->session->id}")
            ->assertOk()
            ->assertJsonCount(1, 'training_session.attendances');
    }
}
