<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Services\UploadStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UploadController extends Controller
{
    public function file(Request $request, UploadStorage $uploads): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:jpeg,png,jpg,webp,pdf', 'max:5120'],
            'purpose' => ['required', Rule::in(['student_photo', 'coach_photo', 'spp_proof', 'session_photo'])],
        ]);

        $this->ensureCanUploadForPurpose($request, $data['purpose']);

        $directory = match ($data['purpose']) {
            'student_photo' => 'student-photos',
            'coach_photo' => 'coach-photos',
            'spp_proof' => 'spp-proofs',
            'session_photo' => 'session-photos',
        };

        $path = $uploads->store(
            $request->file('file'),
            "akademi/{$request->user()->akademi_id}/{$directory}"
        );

        return response()->json([
            'url' => $uploads->url($path),
            'path' => $path,
        ], 201);
    }

    private function ensureCanUploadForPurpose(Request $request, string $purpose): void
    {
        $role = $request->user()->role;

        if ($purpose === 'session_photo') {
            abort_unless(
                in_array($role, ['ketua_akademi', 'admin_akademi', 'pelatih'], true),
                403,
                'Akses ditolak. Akun ini tidak bisa upload dokumentasi sesi.'
            );

            return;
        }

        abort_unless(
            in_array($role, ['ketua_akademi', 'admin_akademi'], true),
            403,
            'Akses ditolak. Hanya ketua atau admin akademi yang bisa upload file administrasi.'
        );
    }
}
