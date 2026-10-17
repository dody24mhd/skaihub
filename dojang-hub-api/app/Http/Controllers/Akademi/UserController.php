<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->ensureCanManageUsers($request);

        $query = User::query()
            ->with('coachProfile')
            ->where('akademi_id', $request->user()->akademi_id)
            ->where(function ($query) use ($request) {
                $query
                    ->whereIn('role', $this->manageableRoles($request))
                    ->orWhere('id', $request->user()->id);
            })
            ->orderByRaw("case role when 'ketua_akademi' then 1 when 'admin_akademi' then 2 else 3 end")
            ->orderByDesc('is_active')
            ->orderBy('name');

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureCanManageUsers($request);

        $data = $request->validate($this->rules($request));
        $akademiId = $request->user()->akademi_id;

        $user = DB::transaction(function () use ($akademiId, $data) {
            $user = User::create([
                'akademi_id' => $akademiId,
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => $data['role'],
                'avatar_url' => $data['photo_url'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            if ($data['role'] === 'pelatih' || ($data['is_coach'] ?? false)) {
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
            }

            return $user->load('coachProfile');
        });

        return response()->json(['academy_user' => $user], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->ensureCanManageUsers($request);
        $this->ensureUserBelongsToCurrentAkademi($request, $user);

        abort_if($user->id === $request->user()->id && $request->boolean('is_active') === false, 422, 'Akun sendiri tidak bisa dinonaktifkan.');

        $data = $request->validate($this->rules($request, true, $user->id, $user));

        DB::transaction(function () use ($data, $user) {
            $targetRole = $data['role'] ?? $user->role;

            $user->fill([
                'name' => $data['name'] ?? $user->name,
                'email' => $data['email'] ?? $user->email,
                'role' => $targetRole,
                'avatar_url' => array_key_exists('photo_url', $data) ? $data['photo_url'] : $user->avatar_url,
                'is_active' => $data['is_active'] ?? $user->is_active,
            ]);

            if (! empty($data['password'])) {
                $user->password = $data['password'];
                $user->tokens()->delete();
            }

            if (array_key_exists('is_active', $data) && ! $data['is_active']) {
                $user->tokens()->delete();
            }

            $user->save();

            if ($targetRole === 'pelatih' || ($data['is_coach'] ?? $user->coachProfile()->exists())) {
                $user->coachProfile()->updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'akademi_id' => $user->akademi_id,
                        'phone' => array_key_exists('phone', $data) ? $data['phone'] : $user->coachProfile?->phone,
                        'license_number' => array_key_exists('license_number', $data) ? $data['license_number'] : $user->coachProfile?->license_number,
                        'rank_label' => array_key_exists('rank_label', $data) ? $data['rank_label'] : $user->coachProfile?->rank_label,
                        'photo_url' => array_key_exists('photo_url', $data) ? $data['photo_url'] : $user->coachProfile?->photo_url,
                        'joined_date' => array_key_exists('joined_date', $data) ? $data['joined_date'] : $user->coachProfile?->joined_date,
                        'address' => array_key_exists('address', $data) ? $data['address'] : $user->coachProfile?->address,
                        'status' => ($data['is_active'] ?? $user->is_active) ? 'active' : 'inactive',
                    ]
                );
            } elseif (array_key_exists('is_coach', $data) && $data['is_coach'] === false) {
                $user->coachProfile()?->update(['status' => 'inactive']);
            }
        });

        return response()->json(['academy_user' => $user->fresh()->load('coachProfile')]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->ensureCanManageUsers($request);
        $this->ensureUserBelongsToCurrentAkademi($request, $user);

        abort_if($user->id === $request->user()->id, 422, 'Akun sendiri tidak bisa dinonaktifkan.');

        $user->forceFill(['is_active' => false])->save();
        $user->coachProfile()?->update(['status' => 'inactive']);
        $user->tokens()->delete();

        return response()->json(['message' => 'Akun akademi berhasil dinonaktifkan.']);
    }

    private function rules(Request $request, bool $partial = false, ?int $userId = null, ?User $targetUser = null): array
    {
        $required = $partial ? 'sometimes' : 'required';
        $passwordRule = $partial ? 'nullable' : 'required';
        $allowedRoles = $this->manageableRoles($request);

        if ($partial && $targetUser) {
            $allowedRoles[] = $targetUser->role;
            $allowedRoles = array_values(array_unique($allowedRoles));
        }

        return [
            'name' => [$required, 'string', 'max:150'],
            'email' => [
                $required,
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password' => [$passwordRule, 'string', 'min:8'],
            'role' => [$required, Rule::in($allowedRoles)],
            'phone' => ['nullable', 'string', 'max:30'],
            'license_number' => ['nullable', 'string', 'max:100'],
            'rank_label' => ['nullable', 'string', 'max:100'],
            'photo_url' => ['nullable', 'url', 'max:500'],
            'joined_date' => ['nullable', 'date'],
            'address' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'is_coach' => ['sometimes', 'boolean'],
        ];
    }

    private function ensureCanManageUsers(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi'], true),
            403,
            'Akses ditolak. Hanya ketua atau admin akademi yang bisa mengatur akun.'
        );
    }

    private function manageableRoles(Request $request): array
    {
        return match ($request->user()->role) {
            'ketua_akademi' => ['admin_akademi', 'pelatih'],
            'admin_akademi' => ['admin_akademi', 'pelatih'],
            default => [],
        };
    }

    private function ensureUserBelongsToCurrentAkademi(Request $request, User $user): void
    {
        abort_unless(
            $user->akademi_id === $request->user()->akademi_id
                && (
                    in_array($user->role, $this->manageableRoles($request), true)
                    || $user->id === $request->user()->id
                ),
            404,
            'Akun akademi tidak ditemukan.'
        );
    }
}
