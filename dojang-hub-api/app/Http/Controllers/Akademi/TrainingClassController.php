<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\TrainingClass;
use App\Models\TrainingPlace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TrainingClassController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $classes = TrainingClass::query()
            ->with('trainingPlace')
            ->where('akademi_id', $request->user()->akademi_id)
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $classes]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureCanManageMasterData($request);

        $akademiId = $request->user()->akademi_id;
        $data = $request->validate($this->rules($akademiId));

        $class = TrainingClass::create([
            ...$data,
            'akademi_id' => $akademiId,
            'is_active' => $data['is_active'] ?? true,
        ])->load('trainingPlace');

        return response()->json(['training_class' => $class], 201);
    }

    public function show(Request $request, TrainingClass $class): JsonResponse
    {
        $this->ensureBelongsToCurrentAkademi($request, $class);

        return response()->json(['training_class' => $class->load('trainingPlace')]);
    }

    public function update(Request $request, TrainingClass $class): JsonResponse
    {
        $this->ensureCanManageMasterData($request);
        $this->ensureBelongsToCurrentAkademi($request, $class);

        $data = $request->validate($this->rules($request->user()->akademi_id, true));
        $class->update($data);

        return response()->json(['training_class' => $class->fresh()->load('trainingPlace')]);
    }

    public function destroy(Request $request, TrainingClass $class): JsonResponse
    {
        $this->ensureCanManageMasterData($request);
        $this->ensureBelongsToCurrentAkademi($request, $class);

        $class->delete();

        return response()->json(['message' => 'Kelas berhasil dihapus.']);
    }

    private function rules(int $akademiId, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return [
            'training_place_id' => [
                'nullable',
                Rule::exists(TrainingPlace::class, 'id')->where('akademi_id', $akademiId),
            ],
            'name' => [$required, 'string', 'max:150'],
            'spp_amount_override' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'target_sessions_per_month' => ['sometimes', 'integer', 'between:1,31'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    private function ensureCanManageMasterData(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi'], true),
            403,
            'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengubah data.'
        );
    }

    private function ensureBelongsToCurrentAkademi(Request $request, TrainingClass $class): void
    {
        abort_unless(
            $class->akademi_id === $request->user()->akademi_id,
            404,
            'Kelas tidak ditemukan.'
        );
    }
}
