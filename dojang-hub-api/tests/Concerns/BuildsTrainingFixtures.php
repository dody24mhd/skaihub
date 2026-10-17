<?php

namespace Tests\Concerns;

use App\Models\Akademi;
use App\Models\Student;
use App\Models\TrainingClass;
use App\Models\TrainingSchedule;
use App\Models\TrainingSession;
use Illuminate\Support\Str;

trait BuildsTrainingFixtures
{
    protected function makeAkademi(string $name = 'Akademi Juara'): Akademi
    {
        return Akademi::create([
            'name' => $name,
            'slug' => Str::slug($name),
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);
    }

    protected function makeClass(Akademi $akademi, string $name = 'Kelas Reguler'): TrainingClass
    {
        return $akademi->trainingClasses()->create(['name' => $name]);
    }

    protected function makeStudent(Akademi $akademi, TrainingClass $class, string $name, string $status = 'active'): Student
    {
        return $akademi->siswa()->create([
            'primary_class_id' => $class->id,
            'member_number' => strtoupper(Str::random(8)),
            'name' => $name,
            'gender' => 'male',
            'birth_date' => '2012-01-01',
            'joined_date' => '2026-01-01',
            'height_cm' => 140,
            'weight_kg' => 40,
            'status' => $status,
        ]);
    }

    /**
     * @param  array<int, int>  $coachIds
     */
    protected function makeSchedule(Akademi $akademi, TrainingClass $class, int $dayOfWeek, array $coachIds = [], string $startsAt = '16:00'): TrainingSchedule
    {
        $schedule = $akademi->trainingSchedules()->create([
            'class_id' => $class->id,
            'coach_id' => $coachIds[0] ?? null,
            'day_of_week' => $dayOfWeek,
            'starts_at' => $startsAt,
            'ends_at' => '17:30',
            'is_active' => true,
        ]);
        $schedule->coaches()->sync($coachIds);

        return $schedule;
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function makeSession(Akademi $akademi, TrainingClass $class, array $overrides = []): TrainingSession
    {
        return $akademi->trainingSessions()->create([
            'class_id' => $class->id,
            'session_date' => now()->toDateString(),
            'starts_at' => '16:00',
            'ends_at' => '17:30',
            ...$overrides,
        ]);
    }
}
