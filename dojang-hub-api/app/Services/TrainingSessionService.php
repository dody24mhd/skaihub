<?php

namespace App\Services;

use App\Models\Student;
use App\Models\TrainingSchedule;
use App\Models\TrainingSession;
use App\Models\User;

class TrainingSessionService
{
    public const ADMIN_ROLES = ['ketua_akademi', 'admin_akademi'];

    public function isAdminRole(User $user): bool
    {
        return in_array($user->role, self::ADMIN_ROLES, true);
    }

    public function isScheduleCoach(User $user, TrainingSchedule $schedule): bool
    {
        return $user->role === 'pelatih'
            && ((int) $schedule->coach_id === (int) $user->id
                || $schedule->coaches()->where('users.id', $user->id)->exists());
    }

    public function isSessionCoach(User $user, TrainingSession $session): bool
    {
        return $user->role === 'pelatih'
            && ((int) $session->coach_id === (int) $user->id
                || $session->coaches()->where('users.id', $user->id)->exists());
    }

    /**
     * Tambahkan siswa aktif kelas yang belum ada di roster; tidak menghapus baris yang sudah ada.
     */
    public function syncRoster(TrainingSession $session): void
    {
        $existingStudentIds = $session->attendances()->whereNotNull('student_id')->pluck('student_id');

        Student::query()
            ->where('akademi_id', $session->akademi_id)
            ->where('primary_class_id', $session->class_id)
            ->where('status', 'active')
            ->whereNotIn('id', $existingStudentIds)
            ->orderBy('name')
            ->get()
            ->each(fn (Student $student) => $session->attendances()->create([
                'student_id' => $student->id,
                'status' => 'present',
            ]));
    }

    /**
     * @return array<int, string>
     */
    public function relations(): array
    {
        return [
            'schedule',
            'schedule.coaches',
            'class.trainingPlace',
            'trainingPlace',
            'coach.coachProfile',
            'coaches',
            'attendances.student.currentRank',
            'rescheduledTo',
            'rescheduledFrom',
        ];
    }
}
