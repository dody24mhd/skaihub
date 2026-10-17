<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\TrainingClass;
use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TrainingAttendanceSickTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $akademi;

    private User $admin;

    private TrainingClass $class;

    private TrainingSession $session;

    protected function setUp(): void
    {
        parent::setUp();

        $this->akademi = Akademi::create([
            'name' => 'Akademi Rajawali',
            'slug' => 'akademi-rajawali',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);

        $this->admin = User::factory()->akademiAdmin($this->akademi->id)->create();
        Sanctum::actingAs($this->admin);

        $this->class = $this->akademi->trainingClasses()->create(['name' => 'Kelas Remaja']);
        $this->session = $this->akademi->trainingSessions()->create([
            'class_id' => $this->class->id,
            'coach_id' => $this->admin->id,
            'session_date' => now()->toDateString(),
            'starts_at' => '16:00',
            'ends_at' => '17:30',
        ]);
    }

    public function test_can_record_and_retrieve_sick_attendance_status(): void
    {
        $student = $this->akademi->siswa()->create([
            'primary_class_id' => $this->class->id,
            'member_number' => 'RJW-001',
            'name' => 'Dimas',
            'gender' => 'male',
            'birth_date' => '2013-05-10',
            'joined_date' => '2026-01-01',
            'height_cm' => 150,
            'weight_kg' => 45,
            'status' => 'active',
        ]);

        $attendance = $this->session->attendances()->create([
            'student_id' => $student->id,
            'status' => 'absent',
            'is_extra_participant' => false,
        ]);

        // Submit attendance with status 'sick'
        $response = $this->patchJson("/api/akademi/training-sessions/{$this->session->id}/attendance", [
            'material' => 'Poomsae 1',
            'status' => 'completed',
            'attendances' => [
                [
                    'id' => $attendance->id,
                    'status' => 'sick',
                    'notes' => 'Demam tinggi',
                ],
            ],
            'extra_participants' => [
                [
                    'participant_name' => 'Bima Sakit',
                    'status' => 'sick',
                    'notes' => 'Sakit flu',
                ],
            ],
        ])->assertOk();

        $studentAtt = collect($response->json('training_session.attendances'))->firstWhere('student_id', $student->id);
        $this->assertSame('sick', $studentAtt['status']);
        $this->assertSame('Demam tinggi', $studentAtt['notes']);

        $this->assertDatabaseHas('training_attendances', [
            'id' => $attendance->id,
            'student_id' => $student->id,
            'status' => 'sick',
            'notes' => 'Demam tinggi',
        ]);

        $this->assertDatabaseHas('training_attendances', [
            'training_session_id' => $this->session->id,
            'participant_name' => 'Bima Sakit',
            'status' => 'sick',
            'is_extra_participant' => true,
        ]);

        // Student stats check: sick is counted in total, but NOT in present (treated like excused)
        $studentRes = $this->getJson("/api/akademi/students/{$student->id}")
            ->assertOk();

        $this->assertSame(1, $studentRes->json('summary.attendance_total'));
        $this->assertSame(0, $studentRes->json('summary.attendance_present'));
    }
}
