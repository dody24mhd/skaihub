<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\TrainingClass;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTrainingFixtures;
use Tests\TestCase;

class TrainingSessionRescheduleTest extends TestCase
{
    use BuildsTrainingFixtures;
    use RefreshDatabase;

    private Akademi $akademi;

    private User $admin;

    private User $coach;

    private TrainingClass $class;

    private TrainingSession $session;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-10-19 08:00:00');
        $this->akademi = $this->makeAkademi();
        $this->admin = User::factory()->ketuaAkademi($this->akademi->id)->create();
        $this->coach = User::factory()->pelatih($this->akademi->id)->create();
        $this->class = $this->makeClass($this->akademi);
        $this->makeStudent($this->akademi, $this->class, 'Arya');
        $this->makeStudent($this->akademi, $this->class, 'Bima');
        $schedule = $this->makeSchedule($this->akademi, $this->class, 1, [$this->coach->id]);
        $this->session = $this->makeSession($this->akademi, $this->class, [
            'training_schedule_id' => $schedule->id,
            'source_schedule_date' => '2026-10-19',
            'session_date' => '2026-10-19',
            'coach_id' => $this->coach->id,
        ]);
        $this->session->coaches()->attach($this->coach->id);
    }

    public function test_admin_can_reschedule_session_to_replacement_session(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson("/api/akademi/training-sessions/{$this->session->id}/reschedule", [
            'date' => '2026-10-21',
            'starts_at' => '15:00',
            'ends_at' => '16:30',
            'reason' => 'Hujan deras',
        ])->assertCreated();

        $replacementId = $response->json('training_session.id');
        $this->assertSame('replacement', $response->json('training_session.session_type'));
        $this->assertSame('draft', $response->json('training_session.status'));
        $this->assertSame($this->session->id, $response->json('training_session.rescheduled_from_id'));
        $this->assertCount(2, $response->json('training_session.attendances'));
        $this->assertSame([$this->coach->id], array_column($response->json('training_session.coaches'), 'id'));

        $original = $this->session->fresh();
        $this->assertSame('rescheduled', $original->status);
        $this->assertSame('Hujan deras', $original->reschedule_reason);
        $this->assertSame($replacementId, $original->rescheduled_to_id);
        $this->assertNotNull($original->training_schedule_id);
    }

    public function test_reschedule_requires_reason_and_valid_times(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson("/api/akademi/training-sessions/{$this->session->id}/reschedule", [
            'date' => '2026-10-21',
            'starts_at' => '17:00',
            'ends_at' => '16:00',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['reason', 'ends_at']);
    }

    public function test_cannot_reschedule_completed_session(): void
    {
        Sanctum::actingAs($this->admin);
        $this->session->update(['status' => 'completed']);

        $this->postJson("/api/akademi/training-sessions/{$this->session->id}/reschedule", [
            'date' => '2026-10-21',
            'starts_at' => '15:00',
            'ends_at' => '16:30',
            'reason' => 'Hujan',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_coach_cannot_reschedule_or_cancel(): void
    {
        Sanctum::actingAs($this->coach);

        $this->postJson("/api/akademi/training-sessions/{$this->session->id}/reschedule", [
            'date' => '2026-10-21',
            'starts_at' => '15:00',
            'ends_at' => '16:30',
            'reason' => 'Hujan',
        ])->assertForbidden();

        $this->postJson("/api/akademi/training-sessions/{$this->session->id}/cancel", [
            'reason' => 'Libur',
        ])->assertForbidden();
    }

    public function test_admin_can_cancel_session_with_reason(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson("/api/akademi/training-sessions/{$this->session->id}/cancel", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['reason']);

        $this->postJson("/api/akademi/training-sessions/{$this->session->id}/cancel", [
            'reason' => 'Dojang dipakai acara',
        ])->assertOk()
            ->assertJsonPath('training_session.status', 'cancelled')
            ->assertJsonPath('training_session.cancel_reason', 'Dojang dipakai acara');
    }

    public function test_rescheduled_session_rejects_attendance_updates(): void
    {
        Sanctum::actingAs($this->admin);
        $this->session->update(['status' => 'rescheduled']);

        $this->patchJson("/api/akademi/training-sessions/{$this->session->id}/attendance", [
            'material' => 'Tetap latihan',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_other_tenant_cannot_reschedule_or_cancel(): void
    {
        $other = $this->makeAkademi('Akademi Lain');
        Sanctum::actingAs(User::factory()->ketuaAkademi($other->id)->create());

        $this->postJson("/api/akademi/training-sessions/{$this->session->id}/reschedule", [
            'date' => '2026-10-21',
            'starts_at' => '15:00',
            'ends_at' => '16:30',
            'reason' => 'Hujan',
        ])->assertNotFound();

        $this->postJson("/api/akademi/training-sessions/{$this->session->id}/cancel", [
            'reason' => 'Libur',
        ])->assertNotFound();
    }

    public function test_only_admin_can_change_session_coaches(): void
    {
        $substitute = User::factory()->pelatih($this->akademi->id)->create();

        Sanctum::actingAs($this->coach);
        $this->putJson("/api/akademi/training-sessions/{$this->session->id}", [
            'coach_ids' => [$substitute->id],
        ])->assertForbidden();

        Sanctum::actingAs($this->admin);
        $this->putJson("/api/akademi/training-sessions/{$this->session->id}", [
            'coach_ids' => [$substitute->id],
        ])->assertOk()
            ->assertJsonPath('training_session.coach_id', $substitute->id);
        $this->assertSame([$substitute->id], $this->session->coaches()->pluck('users.id')->all());
    }
}
