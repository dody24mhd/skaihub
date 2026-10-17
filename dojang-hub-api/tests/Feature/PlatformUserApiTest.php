<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PlatformUserApiTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->superAdmin()->create(['name' => 'Super Admin']);
    }

    private function platformStaff(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'akademi_id' => null,
            'role' => 'admin',
            'is_active' => true,
        ], $attributes));
    }

    private function akademi(string $slug = 'garuda'): Akademi
    {
        return Akademi::create([
            'name' => ucfirst($slug).' Academy',
            'slug' => $slug,
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'starter',
        ]);
    }

    public function test_super_admin_lists_only_platform_users(): void
    {
        $staff = $this->platformStaff(['name' => 'Staf Konten']);
        User::factory()->ketuaAkademi($this->akademi()->id)->create(['name' => 'Ketua Tenant']);
        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson('/api/super-admin/platform-users');

        $response->assertOk()->assertJsonCount(2, 'data');
        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertEqualsCanonicalizing([$this->superAdmin->id, $staff->id], $ids);
        $this->assertArrayNotHasKey('password', $response->json('data.0'));
    }

    public function test_super_admin_can_create_platform_staff_without_akademi(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->postJson('/api/super-admin/platform-users', [
            'name' => 'Staf Baru',
            'email' => 'staf@skaihub.test',
            'password' => 'password123',
            'role' => 'super_admin',
            'akademi_id' => 99,
        ]);

        $response->assertCreated()
            ->assertJsonPath('platform_user.email', 'staf@skaihub.test')
            ->assertJsonPath('platform_user.role', 'admin')
            ->assertJsonPath('platform_user.akademi_id', null)
            ->assertJsonPath('platform_user.is_active', true);

        $created = User::where('email', 'staf@skaihub.test')->firstOrFail();
        $this->assertTrue(Hash::check('password123', $created->password));
    }

    public function test_create_platform_staff_validates_input(): void
    {
        $this->platformStaff(['email' => 'dipakai@skaihub.test']);
        Sanctum::actingAs($this->superAdmin);

        $this->postJson('/api/super-admin/platform-users', [
            'name' => '',
            'email' => 'dipakai@skaihub.test',
            'password' => 'short',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_platform_admin_and_academy_roles_cannot_manage_platform_users(): void
    {
        $staff = $this->platformStaff();
        $ketua = User::factory()->ketuaAkademi($this->akademi()->id)->create();

        foreach ([$staff, $ketua] as $user) {
            Sanctum::actingAs($user);

            $this->getJson('/api/super-admin/platform-users')->assertForbidden();
            $this->postJson('/api/super-admin/platform-users', [
                'name' => 'Penyusup',
                'email' => 'penyusup@skaihub.test',
                'password' => 'password123',
            ])->assertForbidden();
            $this->putJson("/api/super-admin/platform-users/{$staff->id}", ['name' => 'X'])->assertForbidden();
            $this->deleteJson("/api/super-admin/platform-users/{$staff->id}")->assertForbidden();
        }

        $this->assertDatabaseMissing('users', ['email' => 'penyusup@skaihub.test']);
    }

    public function test_super_admin_can_update_platform_staff_and_reset_password_revokes_tokens(): void
    {
        $staff = $this->platformStaff();
        $staff->createToken('api-token');
        Sanctum::actingAs($this->superAdmin);

        $this->putJson("/api/super-admin/platform-users/{$staff->id}", [
            'name' => 'Staf Diubah',
            'email' => 'diubah@skaihub.test',
            'password' => 'passwordbaru123',
        ])->assertOk()
            ->assertJsonPath('platform_user.name', 'Staf Diubah')
            ->assertJsonPath('platform_user.email', 'diubah@skaihub.test');

        $this->assertTrue(Hash::check('passwordbaru123', $staff->fresh()->password));
        $this->assertSame(0, $staff->tokens()->count());
    }

    public function test_deactivating_platform_staff_revokes_tokens(): void
    {
        $staff = $this->platformStaff();
        $staff->createToken('api-token');
        Sanctum::actingAs($this->superAdmin);

        $this->deleteJson("/api/super-admin/platform-users/{$staff->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Staf platform berhasil dinonaktifkan.');

        $this->assertFalse($staff->fresh()->is_active);
        $this->assertSame(0, $staff->tokens()->count());
    }

    public function test_update_with_is_active_false_revokes_tokens(): void
    {
        $staff = $this->platformStaff();
        $staff->createToken('api-token');
        Sanctum::actingAs($this->superAdmin);

        $this->putJson("/api/super-admin/platform-users/{$staff->id}", ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('platform_user.is_active', false);

        $this->assertSame(0, $staff->tokens()->count());
    }

    public function test_super_admin_cannot_change_or_deactivate_self(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $this->putJson("/api/super-admin/platform-users/{$this->superAdmin->id}", ['name' => 'Ganti'])
            ->assertUnprocessable();
        $this->deleteJson("/api/super-admin/platform-users/{$this->superAdmin->id}")
            ->assertUnprocessable();

        $this->assertDatabaseHas('users', [
            'id' => $this->superAdmin->id,
            'name' => 'Super Admin',
            'is_active' => true,
        ]);
    }

    public function test_super_admin_cannot_manage_other_super_admin_or_academy_users(): void
    {
        $otherSuperAdmin = User::factory()->superAdmin()->create();
        $ketua = User::factory()->ketuaAkademi($this->akademi()->id)->create();
        Sanctum::actingAs($this->superAdmin);

        foreach ([$otherSuperAdmin, $ketua] as $target) {
            $this->putJson("/api/super-admin/platform-users/{$target->id}", ['name' => 'Ganti'])->assertNotFound();
            $this->deleteJson("/api/super-admin/platform-users/{$target->id}")->assertNotFound();
            $this->assertTrue($target->fresh()->is_active);
        }
    }
}
