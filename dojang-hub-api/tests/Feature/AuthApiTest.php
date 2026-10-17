<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_login_and_receive_token(): void
    {
        User::factory()->superAdmin()->create([
            'name' => 'Super Admin',
            'email' => 'superadmin@example.com',
            'password' => Hash::make('secret-password'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'superadmin@example.com',
            'password' => 'secret-password',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.email', 'superadmin@example.com')
            ->assertJsonPath('user.role', 'super_admin')
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'name', 'email', 'role', 'is_active'],
            ]);

        $this->assertNotEmpty($response->json('token'));
    }

    public function test_inactive_user_cannot_login(): void
    {
        User::factory()->superAdmin()->create([
            'email' => 'inactive@example.com',
            'password' => Hash::make('secret-password'),
            'is_active' => false,
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'inactive@example.com',
            'password' => 'secret-password',
        ])->assertForbidden()
            ->assertJsonPath('message', 'Akun tidak aktif. Hubungi administrator.');
    }

    public function test_non_super_admin_cannot_access_super_admin_akademi_routes(): void
    {
        $akademi = Akademi::create([
            'name' => 'Garuda Academy',
            'slug' => 'garuda',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'starter',
        ]);

        $user = User::factory()->akademiAdmin($akademi->id)->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/super-admin/akademi')
            ->assertForbidden()
            ->assertJsonPath('message', 'Akses ditolak. Hanya super admin.');
    }

    public function test_admin_akademi_can_access_own_tenant_profile(): void
    {
        $akademi = Akademi::create([
            'name' => 'Tenant Academy',
            'slug' => 'tenant-academy',
            'sport_type' => 'karate',
            'status' => 'active',
            'plan' => 'pro',
            'plan_expires_at' => now()->addMonths(3),
        ]);

        Subscription::create([
            'akademi_id' => $akademi->id,
            'plan' => 'pro',
            'duration_type' => 'quarterly',
            'duration_months' => 3,
            'included_student_limit' => 150,
            'extra_student_blocks' => 1,
            'starts_at' => now(),
            'ends_at' => now()->addMonths(3),
            'amount' => 597000,
            'payment_status' => 'paid',
            'status' => 'active',
            'activated_at' => now(),
        ]);

        $user = User::factory()->akademiAdmin($akademi->id)->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/akademi/me')
            ->assertOk()
            ->assertJsonPath('user.role', 'admin_akademi')
            ->assertJsonPath('akademi.id', $akademi->id)
            ->assertJsonPath('akademi.slug', 'tenant-academy')
            ->assertJsonPath('subscription.plan', 'pro')
            ->assertJsonPath('entitlements.student_limit', 250)
            ->assertJsonPath('entitlements.has_public_website', true)
            ->assertJsonPath('entitlements.has_exam_events', false);
    }

    public function test_super_admin_cannot_access_akademi_tenant_routes(): void
    {
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->getJson('/api/akademi/me')
            ->assertForbidden()
            ->assertJsonPath('message', 'Akses ditolak. Akun ini bukan user akademi.');
    }

    public function test_expired_subscription_does_not_grant_akademi_entitlements(): void
    {
        $akademi = Akademi::create([
            'name' => 'Expired Tenant',
            'slug' => 'expired-tenant',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'scale',
            'plan_expires_at' => now()->subDay(),
        ]);

        Subscription::create([
            'akademi_id' => $akademi->id,
            'plan' => 'scale',
            'duration_type' => 'monthly',
            'duration_months' => 1,
            'included_student_limit' => 300,
            'extra_student_blocks' => 1,
            'starts_at' => now()->subMonths(2),
            'ends_at' => now()->subDay(),
            'amount' => 349000,
            'payment_status' => 'paid',
            'status' => 'active',
            'activated_at' => now()->subMonths(2),
        ]);

        Sanctum::actingAs(User::factory()->akademiAdmin($akademi->id)->create());

        $this->getJson('/api/akademi/me')
            ->assertOk()
            ->assertJsonPath('subscription', null)
            ->assertJsonPath('entitlements.student_limit', 0)
            ->assertJsonPath('entitlements.has_public_website', false)
            ->assertJsonPath('entitlements.has_parent_portal', false);
    }

    public function test_admin_akademi_cannot_login_when_akademi_is_inactive(): void
    {
        $akademi = Akademi::create([
            'name' => 'Inactive Academy',
            'slug' => 'inactive-academy',
            'sport_type' => 'taekwondo',
            'status' => 'suspended',
            'plan' => 'starter',
        ]);

        User::factory()->akademiAdmin($akademi->id)->create([
            'email' => 'blocked@example.com',
            'password' => Hash::make('secret-password'),
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'blocked@example.com',
            'password' => 'secret-password',
        ])->assertForbidden()
            ->assertJsonPath('message', 'Akademi tidak aktif. Hubungi administrator.');
    }

    public function test_inactive_user_token_is_rejected_with_401(): void
    {
        $akademi = Akademi::create([
            'name' => 'Akademi Test',
            'slug' => 'akademi-test',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);

        $user = User::factory()->akademiAdmin($akademi->id)->create(['is_active' => true]);
        $token = $user->createToken('api-token')->plainTextToken;

        $user->update(['is_active' => false]);

        $this->withToken($token)
            ->getJson('/api/akademi/me')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Akun tidak aktif. Hubungi administrator.');
    }

    public function test_expired_token_is_rejected_with_401(): void
    {
        $akademi = Akademi::create([
            'name' => 'Akademi Test Expiry',
            'slug' => 'akademi-test-expiry',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);

        $user = User::factory()->akademiAdmin($akademi->id)->create(['is_active' => true]);
        $token = $user->createToken('api-token')->plainTextToken;

        $this->travel(8)->days();

        $this->withToken($token)
            ->getJson('/api/akademi/me')
            ->assertUnauthorized();
    }

    public function test_login_twice_keeps_only_one_active_token(): void
    {
        $user = User::factory()->superAdmin()->create([
            'email' => 'super@example.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'super@example.com',
            'password' => 'password123',
        ])->assertOk();

        $this->assertCount(1, $user->tokens);

        $this->postJson('/api/auth/login', [
            'email' => 'super@example.com',
            'password' => 'password123',
        ])->assertOk();

        $this->assertCount(1, $user->fresh()->tokens);
    }

    public function test_changing_password_revokes_old_tokens(): void
    {
        $akademi = Akademi::create([
            'name' => 'Akademi Test Password',
            'slug' => 'akademi-test-password',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);

        $admin = User::factory()->akademiAdmin($akademi->id)->create(['is_active' => true]);
        $adminToken = $admin->createToken('api-token')->plainTextToken;
        $pelatih = User::factory()->pelatih($akademi->id)->create(['is_active' => true]);
        $token = $pelatih->createToken('api-token')->plainTextToken;

        $this->withToken($adminToken)->putJson("/api/akademi/users/{$pelatih->id}", [
            'password' => 'new-secret-password-123',
        ])->assertOk();

        $this->assertCount(0, $pelatih->fresh()->tokens);

        $this->app['auth']->forgetGuards();

        $this->withToken($token)
            ->getJson('/api/akademi/me')
            ->assertUnauthorized();
    }

    public function test_inactive_super_admin_cannot_access_super_admin_routes(): void
    {
        $superAdmin = User::factory()->superAdmin()->create(['is_active' => false]);
        Sanctum::actingAs($superAdmin);

        $this->getJson('/api/super-admin/akademi')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Akun tidak aktif. Hubungi administrator.');
    }

    public function test_inactive_user_cannot_access_auth_me(): void
    {
        $user = User::factory()->superAdmin()->create(['is_active' => false]);
        Sanctum::actingAs($user);

        $this->getJson('/api/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Akun tidak aktif. Hubungi administrator.');
    }
}
