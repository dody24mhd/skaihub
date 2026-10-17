<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\TrainingPlace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrainingPlaceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $akademi = $request->user()->akademi;

        $places = TrainingPlace::query()
            ->where('akademi_id', $akademi->id)
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $places]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureCanManageMasterData($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $place = TrainingPlace::create([
            ...$data,
            'akademi_id' => $request->user()->akademi_id,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json(['training_place' => $place], 201);
    }

    public function show(Request $request, TrainingPlace $trainingPlace): JsonResponse
    {
        $this->ensureBelongsToCurrentAkademi($request, $trainingPlace);

        return response()->json(['training_place' => $trainingPlace]);
    }

    public function update(Request $request, TrainingPlace $trainingPlace): JsonResponse
    {
        $this->ensureCanManageMasterData($request);
        $this->ensureBelongsToCurrentAkademi($request, $trainingPlace);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $trainingPlace->update($data);

        return response()->json(['training_place' => $trainingPlace->fresh()]);
    }

    public function destroy(Request $request, TrainingPlace $trainingPlace): JsonResponse
    {
        $this->ensureCanManageMasterData($request);
        $this->ensureBelongsToCurrentAkademi($request, $trainingPlace);

        $trainingPlace->delete();

        return response()->json(['message' => 'Tempat latihan berhasil dihapus.']);
    }

    private function ensureCanManageMasterData(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi'], true),
            403,
            'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengubah data.'
        );
    }

    private function ensureBelongsToCurrentAkademi(Request $request, TrainingPlace $trainingPlace): void
    {
        abort_unless(
            $trainingPlace->akademi_id === $request->user()->akademi_id,
            404,
            'Tempat latihan tidak ditemukan.'
        );
    }
}
