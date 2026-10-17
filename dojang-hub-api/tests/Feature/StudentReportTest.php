<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\EvaluationAspect;
use App\Models\EvaluationPeriod;
use App\Models\SportRank;
use App\Models\Student;
use App\Models\StudentEvaluationScore;
use App\Models\TrainingClass;
use App\Models\User;
use Database\Seeders\RankCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsTrainingFixtures;
use Tests\TestCase;

class StudentReportTest extends TestCase
{
    use BuildsTrainingFixtures;
    use RefreshDatabase;

    private Akademi $akademi;

    private User $admin;

    private TrainingClass $class;

    private Student $student;

    private EvaluationPeriod $period;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RankCatalogSeeder::class);
        $this->akademi = $this->makeAkademi('Akademi Garuda');
        $this->admin = User::factory()->akademiAdmin($this->akademi->id)->create(['name' => 'Admin Garuda']);
        $this->class = $this->makeClass($this->akademi, 'Junior A');
        $this->student = $this->makeStudent($this->akademi, $this->class, 'Arya');
        $this->student->update([
            'current_rank_id' => SportRank::where('code', 'tkd-geup-8')->value('id'),
        ]);

        $this->period = EvaluationPeriod::create([
            'akademi_id' => $this->akademi->id,
            'name' => 'Semester 1',
            'starts_at' => '2026-07-01',
            'ends_at' => '2026-12-31',
            'status' => 'active',
        ]);
    }

    private function aspect(string $name, int $order): EvaluationAspect
    {
        return EvaluationAspect::create([
            'akademi_id' => $this->akademi->id,
            'evaluation_period_id' => $this->period->id,
            'name' => $name,
            'category' => 'Teknik',
            'sort_order' => $order,
            'is_active' => true,
        ]);
    }

    private function score(EvaluationAspect $aspect, int $score, ?string $notes = null): void
    {
        StudentEvaluationScore::create([
            'akademi_id' => $aspect->akademi_id,
            'evaluation_period_id' => $aspect->evaluation_period_id,
            'evaluation_aspect_id' => $aspect->id,
            'student_id' => $this->student->id,
            'class_id' => $this->class->id,
            'assessed_by' => $this->admin->id,
            'score' => $score,
            'indicator' => 'baik',
            'notes' => $notes,
        ]);
    }

    private function attend(string $date, string $status, string $sessionStatus = 'completed'): void
    {
        $session = $this->makeSession($this->akademi, $this->class, ['session_date' => $date, 'status' => $sessionStatus]);
        $session->attendances()->create(['student_id' => $this->student->id, 'status' => $status]);
    }

    private function reportUrl(?int $periodId = null): string
    {
        return "/api/akademi/students/{$this->student->id}/report?period_id=".($periodId ?? $this->period->id);
    }

    public function test_admin_gets_report_with_identity_scores_and_average(): void
    {
        $this->score($this->aspect('Tendangan', 2), 95, 'Tendangan sangat kuat.');
        $this->score($this->aspect('Poomsae', 1), 70);
        $this->aspect('Sikap', 3);
        Sanctum::actingAs($this->admin);

        $this->getJson($this->reportUrl())
            ->assertOk()
            ->assertJsonPath('report.akademi.name', 'Akademi Garuda')
            ->assertJsonPath('report.student.name', 'Arya')
            ->assertJsonPath('report.student.class_name', 'Junior A')
            ->assertJsonPath('report.student.rank.code', 'tkd-geup-8')
            ->assertJsonPath('report.period.name', 'Semester 1')
            ->assertJsonCount(3, 'report.scores')
            ->assertJsonPath('report.scores.0.aspect', 'Poomsae')
            ->assertJsonPath('report.scores.0.score', 70)
            ->assertJsonPath('report.scores.0.indicator', 'cukup')
            ->assertJsonPath('report.scores.1.aspect', 'Tendangan')
            ->assertJsonPath('report.scores.1.indicator', 'sangat_baik')
            ->assertJsonPath('report.scores.1.notes', 'Tendangan sangat kuat.')
            ->assertJsonPath('report.scores.2.score', null)
            ->assertJsonPath('report.scores.2.indicator', null)
            ->assertJsonPath('report.average', 82.5)
            ->assertJsonPath('report.average_indicator', 'baik')
            ->assertJsonPath('report.assessors.0', 'Admin Garuda');
    }

    public function test_report_counts_attendance_inside_period_only(): void
    {
        $this->attend('2026-07-05', 'present');
        $this->attend('2026-08-05', 'present');
        $this->attend('2026-09-05', 'sick');
        $this->attend('2026-09-12', 'absent');
        $this->attend('2026-09-19', 'excused');
        $this->attend('2026-09-26', 'absent', 'cancelled');
        $this->attend('2026-06-30', 'absent');
        Sanctum::actingAs($this->admin);

        $this->getJson($this->reportUrl())
            ->assertOk()
            ->assertJsonPath('report.attendance.total', 5)
            ->assertJsonPath('report.attendance.present', 2)
            ->assertJsonPath('report.attendance.sick', 1)
            ->assertJsonPath('report.attendance.excused', 1)
            ->assertJsonPath('report.attendance.absent', 1)
            ->assertJsonPath('report.attendance.rate', 40)
            ->assertJsonPath('report.average', null)
            ->assertJsonPath('report.average_indicator', null);
    }

    public function test_coach_can_view_report(): void
    {
        Sanctum::actingAs(User::factory()->pelatih($this->akademi->id)->create());

        $this->getJson($this->reportUrl())->assertOk()->assertJsonPath('report.student.id', $this->student->id);
    }

    public function test_report_still_available_when_academy_is_read_only(): void
    {
        $this->akademi->subscriptions()->delete();
        Sanctum::actingAs($this->admin);

        $this->getJson($this->reportUrl())->assertOk();
    }

    public function test_period_is_required_and_must_belong_to_academy(): void
    {
        $other = $this->makeAkademi('Akademi Elang');
        $otherPeriod = EvaluationPeriod::create([
            'akademi_id' => $other->id,
            'name' => 'Periode Lain',
            'starts_at' => '2026-07-01',
            'ends_at' => '2026-12-31',
            'status' => 'active',
        ]);
        Sanctum::actingAs($this->admin);

        $this->getJson("/api/akademi/students/{$this->student->id}/report")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['period_id']);
        $this->getJson($this->reportUrl($otherPeriod->id))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['period_id']);
    }

    public function test_other_academy_cannot_view_student_report(): void
    {
        $other = $this->makeAkademi('Akademi Elang');
        Sanctum::actingAs(User::factory()->akademiAdmin($other->id)->create());

        $this->getJson($this->reportUrl())->assertNotFound();
    }
}
