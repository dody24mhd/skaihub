<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PlatformUserController extends Controller
{
    private const STAFF_ROLE = 'admin';

    private const SELF_MESSAGE = 'Akun sendiri tidak bisa diubah atau dinonaktifkan dari halaman ini.';

    public function index(): JsonResponse
    {
        $users = User::query()
            ->whereNull('akademi_id')
            ->whereIn('role', ['super_admin', self::STAFF_ROLE])
            ->orderByRaw("case role when 'super_admin' then 1 else 2 end")
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'is_active', 'akademi_id', 'created_at', 'updated_at']);

        return response()->json(['data' => $users]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules(), $this->messages());

        $user = User::create([
            'akademi_id' => null,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => self::STAFF_ROLE,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json(['platform_user' => $this->present($user)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        abort_if($id === $request->user()->id, 422, self::SELF_MESSAGE);

        $user = $this->findStaff($id);
        $data = $request->validate($this->rules($user->id), $this->messages());

        DB::transaction(function () use ($user, $data) {
            $user->fill(array_intersect_key($data, array_flip(['name', 'email', 'is_active'])));

            $hasNewPassword = ! empty($data['password']);
            $isDeactivated = array_key_exists('is_active', $data) && ! $data['is_active'];

            if ($hasNewPassword) {
                $user->password = $data['password'];
            }

            $user->save();

            if ($hasNewPassword || $isDeactivated) {
                $user->tokens()->delete();
            }
        });

        return response()->json(['platform_user' => $this->present($user->fresh())]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        abort_if($id === $request->user()->id, 422, self::SELF_MESSAGE);

        $user = $this->findStaff($id);

        DB::transaction(function () use ($user) {
            $user->forceFill(['is_active' => false])->save();
            $user->tokens()->delete();
        });

        return response()->json(['message' => 'Staf platform berhasil dinonaktifkan.']);
    }

    private function findStaff(int $id): User
    {
        $user = User::query()
            ->whereNull('akademi_id')
            ->where('role', self::STAFF_ROLE)
            ->find($id);

        abort_unless($user, 404, 'Staf platform tidak ditemukan.');

        return $user;
    }

    private function rules(?int $ignoreUserId = null): array
    {
        $isUpdate = $ignoreUserId !== null;
        $required = $isUpdate ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:150'],
            'email' => [$required, 'email', 'max:255', Rule::unique('users', 'email')->ignore($ignoreUserId)],
            'password' => [$isUpdate ? 'nullable' : 'required', 'string', 'min:8'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    private function messages(): array
    {
        return [
            'name.required' => 'Nama wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah dipakai akun lain.',
            'password.required' => 'Password wajib diisi.',
            'password.min' => 'Password minimal 8 karakter.',
        ];
    }

    private function present(User $user): array
    {
        return $user->only(['id', 'name', 'email', 'role', 'is_active', 'akademi_id', 'created_at', 'updated_at']);
    }
}
