<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    private function akademi(): Akademi
    {
        return Akademi::create([
            'name' => 'Garuda Academy',
            'slug' => 'garuda',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'starter',
        ]);
    }

    private function changePassword(string $token, array $payload)
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($token)->putJson('/api/auth/password', $payload);
    }

    public function test_every_role_can_change_own_password(): void
    {
        $akademiId = $this->akademi()->id;
        $users = [
            User::factory()->superAdmin()->create(),
            User::factory()->create(['role' => 'admin', 'akademi_id' => null, 'is_active' => true]),
            User::factory()->ketuaAkademi($akademiId)->create(),
            User::factory()->akademiAdmin($akademiId)->create(),
            User::factory()->pelatih($akademiId)->create(),
        ];

        foreach ($users as $user) {
            $token = $user->createToken('api-token')->plainTextToken;

            $this->changePassword($token, [
                'current_password' => 'password',
                'password' => 'passwordbaru123',
                'password_confirmation' => 'passwordbaru123',
            ])->assertOk()->assertJsonPath('message', 'Password berhasil diubah.');

            $this->assertTrue(Hash::check('passwordbaru123', $user->fresh()->password), $user->role);
        }
    }

    public function test_change_password_revokes_other_tokens_but_keeps_current_session(): void
    {
        $user = User::factory()->pelatih($this->akademi()->id)->create();
        $current = $user->createToken('api-token');
        $user->createToken('other-device');
        $user->createToken('another-device');

        $this->changePassword($current->plainTextToken, [
            'current_password' => 'password',
            'password' => 'passwordbaru123',
            'password_confirmation' => 'passwordbaru123',
        ])->assertOk();

        $this->assertSame([$current->accessToken->id], $user->tokens()->pluck('id')->all());

        $this->app['auth']->forgetGuards();
        $this->withToken($current->plainTextToken)->getJson('/api/auth/me')->assertOk();
    }

    public function test_wrong_current_password_returns_422_and_keeps_password(): void
    {
        $user = User::factory()->ketuaAkademi($this->akademi()->id)->create();
        $token = $user->createToken('api-token')->plainTextToken;
        $user->createToken('other-device');

        $response = $this->changePassword($token, [
            'current_password' => 'salah-total',
            'password' => 'passwordbaru123',
            'password_confirmation' => 'passwordbaru123',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->assertSame('Password saat ini salah.', $response->json('errors.current_password.0'));
        $this->assertTrue(Hash::check('password', $user->fresh()->password));
        $this->assertSame(2, $user->tokens()->count());
    }

    public function test_new_password_must_be_confirmed_and_at_least_eight_characters(): void
    {
        $user = User::factory()->superAdmin()->create();
        $token = $user->createToken('api-token')->plainTextToken;

        $this->changePassword($token, [
            'current_password' => 'password',
            'password' => 'pendek',
            'password_confirmation' => 'pendek',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->changePassword($token, [
            'current_password' => 'password',
            'password' => 'passwordbaru123',
            'password_confirmation' => 'berbeda123',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->changePassword($token, [
            'current_password' => 'password',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_change_password_requires_authentication(): void
    {
        $this->putJson('/api/auth/password', [
            'current_password' => 'password',
            'password' => 'passwordbaru123',
            'password_confirmation' => 'passwordbaru123',
        ])->assertUnauthorized();
    }

    public function test_change_password_is_rate_limited_on_seventh_attempt(): void
    {
        $user = User::factory()->superAdmin()->create();
        $token = $user->createToken('api-token')->plainTextToken;
        $payload = [
            'current_password' => 'salah-total',
            'password' => 'passwordbaru123',
            'password_confirmation' => 'passwordbaru123',
        ];

        for ($i = 0; $i < 6; $i++) {
            $this->changePassword($token, $payload)->assertUnprocessable();
        }

        $this->changePassword($token, $payload)->assertStatus(429);
    }
}
