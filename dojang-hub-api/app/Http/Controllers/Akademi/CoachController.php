<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CoachController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $coaches = User::query()
            ->with('coachProfile')
            ->where('akademi_id', $request->user()->akademi_id)
            ->whereHas('coachProfile')
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $coaches]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureCanManageCoaches($request);

        $akademiId = $request->user()->akademi_id;
        $data = $request->validate($this->rules());

        $coach = DB::transaction(function () use ($data, $akademiId) {
            $user = User::create([
                'akademi_id' => $akademiId,
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => 'pelatih',
                'avatar_url' => $data['photo_url'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            $user->coachProfile()->create([
                'akademi_id' => $akademiId,
                'phone' => $data['phone'] ?? null,
                'license_number' => $data['license_number'] ?? null,
                'rank_label' => $data['rank_label'] ?? null,
                'photo_url' => $data['photo_url'] ?? null,
                'joined_date' => $data['joined_date'] ?? null,
                'address' => $data['address'] ?? null,
                'status' => ($data['is_active'] ?? true) ? 'active' : 'inactive',
            ]);

            return $user->load('coachProfile');
        });

        return response()->json(['coach' => $coach], 201);
    }

    public function show(Request $request, User $coach): JsonResponse
    {
        $this->ensureCoachBelongsToCurrentAkademi($request, $coach);

        return response()->json(['coach' => $coach->load('coachProfile')]);
    }

    public function update(Request $request, User $coach): JsonResponse
    {
        $this->ensureCanManageCoaches($request);
        $this->ensureCoachBelongsToCurrentAkademi($request, $coach);

        $data = $request->validate($this->rules(true, $coach->id));

        DB::transaction(function () use ($data, $coach) {
            $coach->fill([
                'name' => $data['name'] ?? $coach->name,
                'email' => $data['email'] ?? $coach->email,
                'avatar_url' => array_key_exists('photo_url', $data) ? $data['photo_url'] : $coach->avatar_url,
                'is_active' => $data['is_active'] ?? $coach->is_active,
            ]);

            if (! empty($data['password'])) {
                $coach->password = $data['password'];
                $coach->tokens()->delete();
            }

            if (array_key_exists('is_active', $data) && ! $data['is_active']) {
                $coach->tokens()->delete();
            }

            $coach->save();

            $coach->coachProfile()->updateOrCreate(
                ['user_id' => $coach->id],
                [
                    'akademi_id' => $coach->akademi_id,
                    'phone' => array_key_exists('phone', $data) ? $data['phone'] : $coach->coachProfile?->phone,
                    'license_number' => array_key_exists('license_number', $data) ? $data['license_number'] : $coach->coachProfile?->license_number,
                    'rank_label' => array_key_exists('rank_label', $data) ? $data['rank_label'] : $coach->coachProfile?->rank_label,
                    'photo_url' => array_key_exists('photo_url', $data) ? $data['photo_url'] : $coach->coachProfile?->photo_url,
                    'joined_date' => array_key_exists('joined_date', $data) ? $data['joined_date'] : $coach->coachProfile?->joined_date,
                    'address' => array_key_exists('address', $data) ? $data['address'] : $coach->coachProfile?->address,
                    'status' => ($data['is_active'] ?? $coach->is_active) ? 'active' : 'inactive',
                ]
            );
        });

        return response()->json(['coach' => $coach->fresh()->load('coachProfile')]);
    }

    public function destroy(Request $request, User $coach): JsonResponse
    {
        $this->ensureCanManageCoaches($request);
        $this->ensureCoachBelongsToCurrentAkademi($request, $coach);

        $coach->coachProfile()->update(['status' => 'inactive']);

        return response()->json(['message' => 'Profil pelatih berhasil dinonaktifkan.']);
    }

    private function rules(bool $partial = false, ?int $userId = null): array
    {
        $required = $partial ? 'sometimes' : 'required';
        $passwordRule = $partial ? 'nullable' : 'required';

        return [
            'name' => [$required, 'string', 'max:150'],
            'email' => [
                $required,
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password' => [$passwordRule, 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:30'],
            'license_number' => ['nullable', 'string', 'max:100'],
            'rank_label' => ['nullable', 'string', 'max:100'],
            'photo_url' => ['nullable', 'url', 'max:500'],
            'joined_date' => ['nullable', 'date'],
            'address' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    private function ensureCanManageCoaches(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi'], true),
            403,
            'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengubah pelatih.'
        );
    }

    private function ensureCoachBelongsToCurrentAkademi(Request $request, User $coach): void
    {
        abort_unless(
            $coach->akademi_id === $request->user()->akademi_id && $coach->coachProfile()->exists(),
            404,
            'Pelatih tidak ditemukan.'
        );
    }
}
