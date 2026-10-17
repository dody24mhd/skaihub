<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\Student;
use App\Models\TrainingClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTrainingFixtures;
use Tests\TestCase;

class SessionStatisticsTest extends TestCase
{
    use BuildsTrainingFixtures;
    use RefreshDatabase;

    private Akademi $akademi;

    private User $admin;

    private TrainingClass $class;

    private Student $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-10-19 08:00:00');
        $this->akademi = $this->makeAkademi();
        $this->admin = User::factory()->ketuaAkademi($this->akademi->id)->create();
        $this->class = $this->makeClass($this->akademi);
        $this->student = $this->makeStudent($this->akademi, $this->class, 'Arya');

        foreach (['completed' => 'present', 'rescheduled' => 'absent', 'cancelled' => 'absent'] as $status => $attendance) {
            $session = $this->makeSession($this->akademi, $this->class, ['status' => $status, 'session_date' => '2026-10-19']);
            $session->attendances()->create(['student_id' => $this->student->id, 'status' => $attendance]);
        }
    }

    public function test_dashboard_ignores_rescheduled_and_cancelled_sessions(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/akademi/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('sessions.month_count', 1)
            ->assertJsonPath('sessions.attendance_total', 1)
            ->assertJsonPath('sessions.attendance_present', 1)
            ->assertJsonPath('sessions.attendance_rate', 100);
    }

    public function test_student_summary_ignores_rescheduled_and_cancelled_sessions(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson("/api/akademi/students/{$this->student->id}")
            ->assertOk()
            ->assertJsonPath('summary.attendance_total', 1)
            ->assertJsonPath('summary.attendance_present', 1);
    }
}
