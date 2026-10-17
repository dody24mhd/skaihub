<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleEscalationTest extends TestCase
{
    use RefreshDatabase;

    private Akademi $akademi;

    private User $ketua;

    private User $admin;

    private User $coach;

    protected function setUp(): void
    {
        parent::setUp();

        $this->akademi = Akademi::create([
            'name' => 'Akademi Beladiri',
            'slug' => 'akademi-beladiri',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
        ]);

        $this->giveActiveSubscription($this->akademi);

        $this->ketua = User::factory()->ketuaAkademi($this->akademi->id)->create([
            'email' => 'ketua@test.local',
        ]);

        $this->admin = User::factory()->akademiAdmin($this->akademi->id)->create([
            'email' => 'admin@test.local',
        ]);

        $this->coach = User::factory()->pelatih($this->akademi->id)->create([
            'email' => 'coach@test.local',
        ]);
        $this->coach->coachProfile()->create([
            'akademi_id' => $this->akademi->id,
            'status' => 'active',
        ]);
    }

    public function test_admin_cannot_update_coach_belonging_to_ketua_returns_404(): void
    {
        // Give ketua a coach profile
        $this->ketua->coachProfile()->create([
            'akademi_id' => $this->akademi->id,
            'status' => 'active',
        ]);

        Sanctum::actingAs($this->admin);

        $this->putJson("/api/akademi/coaches/{$this->ketua->id}", [
            'name' => 'Hacked Ketua Name',
            'email' => 'hacked@test.local',
            'password' => 'newpassword123',
        ])->assertNotFound();

        $this->getJson("/api/akademi/coaches/{$this->ketua->id}")
            ->assertNotFound();
    }

    public function test_admin_cannot_manage_other_admin(): void
    {
        $otherAdmin = User::factory()->akademiAdmin($this->akademi->id)->create([
            'email' => 'otheradmin@test.local',
        ]);

        Sanctum::actingAs($this->admin);

        // Attempt to update other admin
        $this->putJson("/api/akademi/users/{$otherAdmin->id}", [
            'name' => 'Hacked Other Admin',
        ])->assertForbidden();

        // Attempt to create another admin
        $this->postJson('/api/akademi/users', [
            'name' => 'New Admin Try',
            'email' => 'newadmintry@test.local',
            'password' => 'password123',
            'role' => 'admin_akademi',
        ])->assertUnprocessable();
    }

    public function test_admin_can_update_own_profile_without_changing_role_or_is_active(): void
    {
        Sanctum::actingAs($this->admin);

        // Updating own name and password is allowed
        $this->putJson("/api/akademi/users/{$this->admin->id}", [
            'name' => 'Updated Self Name',
            'email' => 'admin@test.local',
        ])->assertOk()
            ->assertJsonPath('academy_user.name', 'Updated Self Name');

        // Cannot change own role
        $this->putJson("/api/akademi/users/{$this->admin->id}", [
            'role' => 'ketua_akademi',
        ])->assertUnprocessable();

        // Cannot deactivate self
        $this->putJson("/api/akademi/users/{$this->admin->id}", [
            'is_active' => false,
        ])->assertUnprocessable();
    }

    public function test_ketua_can_manage_admin_and_coach(): void
    {
        Sanctum::actingAs($this->ketua);

        // Ketua creates an admin
        $adminId = $this->postJson('/api/akademi/users', [
            'name' => 'Admin Baru',
            'email' => 'adminbaru@test.local',
            'password' => 'password123',
            'role' => 'admin_akademi',
        ])->assertCreated()
            ->json('academy_user.id');

        // Ketua updates that admin
        $this->putJson("/api/akademi/users/{$adminId}", [
            'name' => 'Admin Baru Diperbarui',
        ])->assertOk()
            ->assertJsonPath('academy_user.name', 'Admin Baru Diperbarui');

        // Ketua deactivates that admin
        $this->deleteJson("/api/akademi/users/{$adminId}")
            ->assertOk();

        $this->assertFalse(User::find($adminId)->is_active);
    }
}
