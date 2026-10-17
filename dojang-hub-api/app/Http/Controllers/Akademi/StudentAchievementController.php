<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentAchievement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentAchievementController extends Controller
{
    public function index(Request $request, Student $student): JsonResponse
    {
        $this->ensureCanRead($request);
        $this->ensureStudentBelongsToCurrentAkademi($request, $student);

        $achievements = $student->achievements()
            ->where('akademi_id', $request->user()->akademi_id)
            ->orderByDesc('achieved_on')
            ->orderByDesc('id')
            ->get();

        return response()->json(['data' => $achievements]);
    }

    public function store(Request $request, Student $student): JsonResponse
    {
        $this->ensureCanWrite($request);
        $this->ensureStudentBelongsToCurrentAkademi($request, $student);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'event_name' => ['nullable', 'string', 'max:255'],
            'achieved_on' => ['nullable', 'date'],
            'result_label' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $achievement = $student->achievements()->create([
            ...$data,
            'akademi_id' => $request->user()->akademi_id,
        ]);

        return response()->json(['student_achievement' => $achievement], 201);
    }

    public function update(Request $request, Student $student, StudentAchievement $achievement): JsonResponse
    {
        $this->ensureCanWrite($request);
        $this->ensureStudentBelongsToCurrentAkademi($request, $student);
        $this->ensureAchievementBelongsToStudentAndAkademi($request, $student, $achievement);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'event_name' => ['nullable', 'string', 'max:255'],
            'achieved_on' => ['nullable', 'date'],
            'result_label' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $achievement->update($data);

        return response()->json(['student_achievement' => $achievement->fresh()]);
    }

    public function destroy(Request $request, Student $student, StudentAchievement $achievement): JsonResponse
    {
        $this->ensureCanWrite($request);
        $this->ensureStudentBelongsToCurrentAkademi($request, $student);
        $this->ensureAchievementBelongsToStudentAndAkademi($request, $student, $achievement);

        $achievement->delete();

        return response()->json(['message' => 'Prestasi siswa berhasil dihapus.']);
    }

    private function ensureCanRead(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi', 'pelatih'], true),
            403,
            'Akses ditolak.'
        );
    }

    private function ensureCanWrite(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi'], true),
            403,
            'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengubah prestasi siswa.'
        );
    }

    private function ensureStudentBelongsToCurrentAkademi(Request $request, Student $student): void
    {
        abort_unless(
            $student->akademi_id === $request->user()->akademi_id,
            404,
            'Siswa tidak ditemukan.'
        );
    }

    private function ensureAchievementBelongsToStudentAndAkademi(Request $request, Student $student, StudentAchievement $achievement): void
    {
        abort_unless(
            $achievement->akademi_id === $request->user()->akademi_id && $achievement->student_id === $student->id,
            404,
            'Prestasi siswa tidak ditemukan.'
        );
    }
}
