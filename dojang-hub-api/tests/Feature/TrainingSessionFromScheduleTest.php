<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\TrainingClass;
use App\Models\TrainingSchedule;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTrainingFixtures;
use Tests\TestCase;

class TrainingSessionFromScheduleTest extends TestCase
{
    use BuildsTrainingFixtures;
    use RefreshDatabase;

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
        $this->admin = User::factory()->akademiAdmin($this->akademi->id)->create();
        $this->coach = User::factory()->pelatih($this->akademi->id)->create();
        $this->class = $this->makeClass($this->akademi);
        $this->makeStudent($this->akademi, $this->class, 'Arya');
        $this->makeStudent($this->akademi, $this->class, 'Bima');
        $this->makeStudent($this->akademi, $this->class, 'Cici', 'inactive');
        $this->schedule = $this->makeSchedule($this->akademi, $this->class, 1, [$this->coach->id]);
    }

    public function test_creates_session_with_active_roster_then_returns_same_session(): void
    {
        Sanctum::actingAs($this->admin);
        $payload = ['training_schedule_id' => $this->schedule->id, 'date' => '2026-10-19'];

        $first = $this->postJson('/api/akademi/training-sessions/from-schedule', $payload)
            ->assertCreated()
            ->assertJsonPath('training_session.session_type', 'regular')
            ->assertJsonPath('training_session.status', 'draft')
            ->assertJsonPath('training_session.training_schedule_id', $this->schedule->id);

        $this->assertCount(2, $first->json('training_session.attendances'));
        $this->assertSame(['present', 'present'], array_column($first->json('training_session.attendances'), 'status'));
        $this->assertSame([$this->coach->id], array_column($first->json('training_session.coaches'), 'id'));

        $this->postJson('/api/akademi/training-sessions/from-schedule', $payload)
            ->assertOk()
            ->assertJsonPath('training_session.id', $first->json('training_session.id'));

        $this->assertSame(1, TrainingSession::count());
    }

    public function test_date_must_match_schedule_day(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/akademi/training-sessions/from-schedule', [
            'training_schedule_id' => $this->schedule->id,
            'date' => '2026-10-20',
        ])->assertUnprocessable()->assertJsonValidationErrors(['date']);
    }

    public function test_inactive_schedule_cannot_open_new_session(): void
    {
        Sanctum::actingAs($this->admin);
        $this->schedule->update(['is_active' => false]);

        $this->postJson('/api/akademi/training-sessions/from-schedule', [
            'training_schedule_id' => $this->schedule->id,
            'date' => '2026-10-19',
        ])->assertUnprocessable()->assertJsonValidationErrors(['training_schedule_id']);
    }

    public function test_coach_only_opens_own_schedule(): void
    {
        $pivotOnlyCoach = User::factory()->pelatih($this->akademi->id)->create();
        $this->schedule->coaches()->attach($pivotOnlyCoach->id);
        $stranger = User::factory()->pelatih($this->akademi->id)->create();
        $payload = ['training_schedule_id' => $this->schedule->id, 'date' => '2026-10-19'];

        Sanctum::actingAs($stranger);
        $this->postJson('/api/akademi/training-sessions/from-schedule', $payload)->assertForbidden();

        Sanctum::actingAs($pivotOnlyCoach);
        $this->postJson('/api/akademi/training-sessions/from-schedule', $payload)->assertCreated();
    }

    public function test_other_tenant_schedule_is_rejected(): void
    {
        $other = $this->makeAkademi('Akademi Lain');
        Sanctum::actingAs(User::factory()->akademiAdmin($other->id)->create());

        $this->postJson('/api/akademi/training-sessions/from-schedule', [
            'training_schedule_id' => $this->schedule->id,
            'date' => '2026-10-19',
        ])->assertUnprocessable()->assertJsonValidationErrors(['training_schedule_id']);
    }

    public function test_manual_store_rejects_duplicate_schedule_date(): void
    {
        Sanctum::actingAs($this->admin);
        $payload = ['training_schedule_id' => $this->schedule->id, 'session_date' => '2026-10-19'];

        $this->postJson('/api/akademi/training-sessions', $payload)->assertCreated();
        $this->postJson('/api/akademi/training-sessions', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['training_schedule_id']);
    }

    public function test_database_rejects_duplicate_schedule_date_but_allows_deleted_and_manual(): void
    {
        $attributes = [
            'training_schedule_id' => $this->schedule->id,
            'source_schedule_date' => '2026-10-19',
            'session_date' => '2026-10-19',
        ];
        $first = $this->makeSession($this->akademi, $this->class, $attributes);
        $first->delete();
        $this->makeSession($this->akademi, $this->class, $attributes);
        $this->makeSession($this->akademi, $this->class);
        $this->makeSession($this->akademi, $this->class);

        $this->expectException(UniqueConstraintViolationException::class);
        $this->makeSession($this->akademi, $this->class, $attributes);
    }
}
