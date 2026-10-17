<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::with('akademi')
            ->where('email', $request->email)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Akun tidak aktif. Hubungi administrator.',
            ], 403);
        }

        if (! $user->isPlatformAdmin() && (! $user->akademi || $user->akademi->status !== 'active')) {
            return response()->json([
                'message' => 'Akademi tidak aktif. Hubungi administrator.',
            ], 403);
        }

        $user->tokens()->where('name', 'api-token')->delete();

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->formatUser($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil logout.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('akademi');

        return response()->json([
            'user' => $this->formatUser($user),
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['bail', 'required', 'string', 'min:8', 'confirmed', 'different:current_password', Password::defaults()],
        ], [
            'current_password.required' => 'Password saat ini wajib diisi.',
            'password.required' => 'Password baru wajib diisi.',
            'password.min' => 'Password baru minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password baru tidak cocok.',
            'password.different' => 'Password baru harus berbeda dari password saat ini.',
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Password saat ini salah.'],
            ]);
        }

        DB::transaction(function () use ($user, $data) {
            $user->forceFill(['password' => $data['password']])->save();

            $otherTokens = $user->tokens();
            $currentToken = $user->currentAccessToken();

            if ($currentToken instanceof PersonalAccessToken) {
                $otherTokens->whereKeyNot($currentToken->getKey());
            }

            $otherTokens->delete();
        });

        return response()->json(['message' => 'Password berhasil diubah.']);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'avatar_url' => $user->avatar_url,
            'is_active' => $user->is_active,
            'akademi_id' => $user->akademi_id,
            'akademi' => $user->akademi ? [
                'id' => $user->akademi->id,
                'name' => $user->akademi->name,
                'slug' => $user->akademi->slug,
                'sport_type' => $user->akademi->sport_type,
                'logo_url' => $user->akademi->logo_url,
                'status' => $user->akademi->status,
                'plan' => $user->akademi->plan,
                'plan_expires_at' => $user->akademi->plan_expires_at,
            ] : null,
        ];
    }
}
