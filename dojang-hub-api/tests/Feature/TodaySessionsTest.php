<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\TrainingClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTrainingFixtures;
use Tests\TestCase;

class TodaySessionsTest extends TestCase
{
    use BuildsTrainingFixtures;
    use RefreshDatabase;

    private Akademi $akademi;

    private User $admin;

    private User $coachA;

    private User $coachB;

    private TrainingClass $class;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-10-19 08:00:00');
        $this->akademi = $this->makeAkademi();
        $this->admin = User::factory()->ketuaAkademi($this->akademi->id)->create();
        $this->coachA = User::factory()->pelatih($this->akademi->id)->create();
        $this->coachB = User::factory()->pelatih($this->akademi->id)->create();
        $this->class = $this->makeClass($this->akademi);
    }

    public function test_admin_sees_schedule_slots_merged_with_sessions(): void
    {
        $opened = $this->makeSchedule($this->akademi, $this->class, 1, [$this->coachA->id], '16:00');
        $notOpened = $this->makeSchedule($this->akademi, $this->class, 1, [$this->coachB->id], '08:00');
        $inactive = $this->makeSchedule($this->akademi, $this->class, 1, [], '10:00');
        $inactive->update(['is_active' => false]);
        $this->makeSchedule($this->akademi, $this->class, 2);
        $session = $this->makeSession($this->akademi, $this->class, [
            'training_schedule_id' => $opened->id,
            'source_schedule_date' => '2026-10-19',
            'session_date' => '2026-10-19',
            'starts_at' => '16:00',
        ]);
        $extra = $this->makeSession($this->akademi, $this->class, [
            'session_date' => '2026-10-19',
            'session_type' => 'extra',
            'starts_at' => '19:00',
            'status' => 'completed',
        ]);
        $other = $this->makeAkademi('Akademi Lain');
        $otherClass = $this->makeClass($other);
        $this->makeSchedule($other, $otherClass, 1);

        Sanctum::actingAs($this->admin);
        $response = $this->getJson('/api/akademi/sessions/today?date=2026-10-19')->assertOk();

        $response->assertJsonPath('date', '2026-10-19')
            ->assertJsonPath('coach_backfill_days', 7)
            ->assertJsonCount(3, 'data');
        $slots = $response->json('data');
        $this->assertSame([$notOpened->id, $opened->id, null], array_column($slots, 'training_schedule_id'));
        $this->assertSame([null, $session->id, $extra->id], array_column($slots, 'session_id'));
        $this->assertSame(['not_opened', 'draft', 'completed'], array_column($slots, 'status'));
        $this->assertSame('extra', $slots[2]['session_type']);
        $this->assertSame('Kelas Reguler', $slots[0]['class_name']);
        $this->assertSame([$this->coachB->id], $slots[0]['coach_ids']);
    }

    public function test_rescheduled_and_replacement_sessions_are_reported(): void
    {
        $schedule = $this->makeSchedule($this->akademi, $this->class, 1, [$this->coachA->id]);
        $replacement = $this->makeSession($this->akademi, $this->class, [
            'session_date' => '2026-10-21',
            'session_type' => 'replacement',
        ]);
        $original = $this->makeSession($this->akademi, $this->class, [
            'training_schedule_id' => $schedule->id,
            'source_schedule_date' => '2026-10-19',
            'session_date' => '2026-10-19',
            'status' => 'rescheduled',
            'reschedule_reason' => 'Hujan',
            'rescheduled_to_id' => $replacement->id,
        ]);
        $replacement->update(['rescheduled_from_id' => $original->id]);

        Sanctum::actingAs($this->admin);

        $this->getJson('/api/akademi/sessions/today?date=2026-10-19')
            ->assertOk()
            ->assertJsonPath('data.0.status', 'rescheduled')
            ->assertJsonPath('data.0.reschedule_reason', 'Hujan')
            ->assertJsonPath('data.0.rescheduled_to.session_date', '2026-10-21');

        $this->getJson('/api/akademi/sessions/today?date=2026-10-21')
            ->assertOk()
            ->assertJsonPath('data.0.session_type', 'replacement')
            ->assertJsonPath('data.0.rescheduled_from.session_date', '2026-10-19');
    }

    public function test_coach_only_sees_own_slots(): void
    {
        $own = $this->makeSchedule($this->akademi, $this->class, 1, [$this->coachB->id, $this->coachA->id]);
        $this->makeSchedule($this->akademi, $this->class, 1, [$this->coachB->id], '08:00');
        $ownSession = $this->makeSession($this->akademi, $this->class, ['session_type' => 'extra', 'starts_at' => '19:00']);
        $ownSession->coaches()->attach($this->coachA->id);
        $this->makeSession($this->akademi, $this->class, ['session_type' => 'extra', 'coach_id' => $this->coachB->id]);

        Sanctum::actingAs($this->coachA);

        $response = $this->getJson('/api/akademi/sessions/today')->assertOk()->assertJsonCount(2, 'data');
        $this->assertSame([$own->id, null], array_column($response->json('data'), 'training_schedule_id'));
        $this->assertSame($ownSession->id, $response->json('data.1.session_id'));
    }

    public function test_invalid_date_is_rejected(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/akademi/sessions/today?date=19-10-2026')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['date']);
    }
}
