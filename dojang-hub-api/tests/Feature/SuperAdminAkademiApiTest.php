<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SuperAdminAkademiApiTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->superAdmin()->create();
        Sanctum::actingAs($this->superAdmin);
    }

    public function test_super_admin_can_create_akademi_with_ketua_and_optional_first_admin(): void
    {
        $response = $this->postJson('/api/super-admin/akademi', [
            'name' => 'Garuda Martial Arts',
            'slug' => 'garuda-martial-arts',
            'sport_type' => 'karate',
            'logo_url' => 'https://example.com/garuda-logo.webp',
            'plan' => 'pro',
            'duration_type' => 'quarterly',
            'extra_student_blocks' => 1,
            'payment_status' => 'paid',
            'ketua_name' => 'Garuda Ketua',
            'ketua_email' => 'ketua@garuda.test',
            'ketua_password' => 'password123',
            'admin_name' => 'Garuda Admin',
            'admin_email' => 'admin@garuda.test',
            'admin_password' => 'password123',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('akademi.name', 'Garuda Martial Arts')
            ->assertJsonPath('akademi.slug', 'garuda-martial-arts')
            ->assertJsonPath('akademi.logo_url', 'https://example.com/garuda-logo.webp')
            ->assertJsonPath('akademi.plan', 'pro')
            ->assertJsonPath('subscription.plan', 'pro')
            ->assertJsonPath('subscription.duration_type', 'quarterly')
            ->assertJsonPath('subscription.included_student_limit', 150)
            ->assertJsonPath('subscription.extra_student_blocks', 1)
            ->assertJsonPath('subscription.payment_status', 'paid')
            ->assertJsonPath('ketua.email', 'ketua@garuda.test')
            ->assertJsonPath('ketua.role', 'ketua_akademi')
            ->assertJsonPath('admin.email', 'admin@garuda.test')
            ->assertJsonPath('admin.role', 'admin_akademi');

        $this->assertDatabaseHas('akademi', [
            'name' => 'Garuda Martial Arts',
            'slug' => 'garuda-martial-arts',
            'sport_type' => 'karate',
            'logo_url' => 'https://example.com/garuda-logo.webp',
            'plan' => 'pro',
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('subscriptions', [
            'plan' => 'pro',
            'duration_type' => 'quarterly',
            'included_student_limit' => 150,
            'extra_student_blocks' => 1,
            'status' => 'active',
            'payment_status' => 'paid',
        ]);

        $this->assertDatabaseHas('users', [
            'name' => 'Garuda Ketua',
            'email' => 'ketua@garuda.test',
            'role' => 'ketua_akademi',
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('users', [
            'name' => 'Garuda Admin',
            'email' => 'admin@garuda.test',
            'role' => 'admin_akademi',
            'is_active' => true,
        ]);
    }

    public function test_create_akademi_rejects_duplicate_slug_and_ketua_email(): void
    {
        Akademi::create([
            'name' => 'Existing Academy',
            'slug' => 'existing',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'starter',
        ]);

        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/super-admin/akademi', [
            'name' => 'New Academy',
            'slug' => 'existing',
            'sport_type' => 'taekwondo',
            'plan' => 'starter',
            'ketua_name' => 'Ketua',
            'ketua_email' => 'taken@example.com',
            'ketua_password' => 'password123',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['slug', 'ketua_email']);
    }

    public function test_create_akademi_requires_end_date_for_custom_subscription(): void
    {
        $this->postJson('/api/super-admin/akademi', [
            'name' => 'Custom Academy',
            'sport_type' => 'taekwondo',
            'plan' => 'pro',
            'duration_type' => 'custom',
            'ketua_name' => 'Custom Ketua',
            'ketua_email' => 'custom-ketua@example.com',
            'ketua_password' => 'password123',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('plan_expires_at');
    }

    public function test_super_admin_can_update_akademi_identity_but_not_plan_snapshot(): void
    {
        $akademi = Akademi::create([
            'name' => 'Satria Academy',
            'slug' => 'satria',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'starter',
        ]);

        $this->putJson("/api/super-admin/akademi/{$akademi->id}", [
            'status' => 'suspended',
            'plan' => 'scale',
            'logo_url' => 'https://example.com/logo.png',
        ])->assertOk()
            ->assertJsonPath('akademi.status', 'suspended')
            ->assertJsonPath('akademi.plan', 'starter')
            ->assertJsonPath('akademi.logo_url', 'https://example.com/logo.png');

        $this->assertDatabaseHas('akademi', [
            'id' => $akademi->id,
            'status' => 'suspended',
            'plan' => 'starter',
        ]);
    }

    public function test_super_admin_can_soft_delete_akademi(): void
    {
        $akademi = Akademi::create([
            'name' => 'Delete Me Academy',
            'slug' => 'delete-me',
            'sport_type' => 'judo',
            'status' => 'active',
            'plan' => 'starter',
        ]);

        $this->deleteJson("/api/super-admin/akademi/{$akademi->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Akademi berhasil dihapus.');

        $this->assertSoftDeleted('akademi', [
            'id' => $akademi->id,
        ]);
    }

    public function test_super_admin_can_filter_akademi_by_search_status_and_plan(): void
    {
        Akademi::create([
            'name' => 'Garuda Academy',
            'slug' => 'garuda',
            'sport_type' => 'karate',
            'status' => 'active',
            'plan' => 'pro',
        ]);

        Akademi::create([
            'name' => 'Satria Academy',
            'slug' => 'satria',
            'sport_type' => 'taekwondo',
            'status' => 'inactive',
            'plan' => 'starter',
        ]);

        $response = $this->getJson('/api/super-admin/akademi?search=garuda&status=active&plan=pro');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Garuda Academy')
            ->assertJsonCount(1, 'data');
    }

    public function test_super_admin_can_create_new_subscription_for_akademi(): void
    {
        $akademi = Akademi::create([
            'name' => 'Langganan Academy',
            'slug' => 'langganan',
            'sport_type' => 'karate',
            'status' => 'active',
            'plan' => 'starter',
        ]);

        $response = $this->postJson("/api/super-admin/akademi/{$akademi->id}/subscriptions", [
            'plan' => 'scale',
            'duration_type' => 'semester',
            'extra_student_blocks' => 2,
            'amount' => 1794000,
            'payment_status' => 'paid',
            'notes' => 'Upgrade semester.',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('subscription.plan', 'scale')
            ->assertJsonPath('subscription.duration_type', 'semester')
            ->assertJsonPath('subscription.duration_months', 6)
            ->assertJsonPath('subscription.included_student_limit', 300)
            ->assertJsonPath('subscription.extra_student_blocks', 2);

        $this->assertDatabaseHas('akademi', [
            'id' => $akademi->id,
            'plan' => 'scale',
        ]);

        $this->assertDatabaseHas('subscriptions', [
            'akademi_id' => $akademi->id,
            'plan' => 'scale',
            'duration_type' => 'semester',
            'duration_months' => 6,
            'included_student_limit' => 300,
            'extra_student_blocks' => 2,
            'payment_status' => 'paid',
        ]);
    }

    public function test_future_subscription_keeps_current_subscription_effective_until_start_date(): void
    {
        $akademi = Akademi::create([
            'name' => 'Renewal Academy',
            'slug' => 'renewal-academy',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'pro',
            'plan_expires_at' => now()->addDays(20),
        ]);

        $currentSubscription = $akademi->subscriptions()->create([
            'plan' => 'pro',
            'duration_type' => 'monthly',
            'duration_months' => 1,
            'included_student_limit' => 150,
            'extra_student_blocks' => 0,
            'starts_at' => now()->subDays(10),
            'ends_at' => now()->addDays(20),
            'amount' => 199000,
            'payment_status' => 'paid',
            'status' => 'active',
            'activated_at' => now()->subDays(10),
        ]);

        $this->postJson("/api/super-admin/akademi/{$akademi->id}/subscriptions", [
            'plan' => 'scale',
            'duration_type' => 'monthly',
            'starts_at' => now()->addDays(21)->toDateString(),
            'payment_status' => 'paid',
        ])->assertCreated()
            ->assertJsonPath('subscription.plan', 'scale');

        $this->assertDatabaseHas('subscriptions', [
            'id' => $currentSubscription->id,
            'status' => 'active',
        ]);

        $this->getJson("/api/super-admin/akademi/{$akademi->id}")
            ->assertOk()
            ->assertJsonPath('subscription.id', $currentSubscription->id)
            ->assertJsonPath('subscription.plan', 'pro')
            ->assertJsonPath('entitlements.has_exam_events', false);

        $this->assertDatabaseHas('akademi', [
            'id' => $akademi->id,
            'plan' => 'pro',
        ]);
    }

    public function test_super_admin_can_update_subscription_payment_without_new_period(): void
    {
        $akademi = Akademi::create([
            'name' => 'Payment Academy',
            'slug' => 'payment-academy',
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'starter',
        ]);

        $subscription = $akademi->subscriptions()->create([
            'plan' => 'starter',
            'duration_type' => 'monthly',
            'duration_months' => 1,
            'included_student_limit' => 50,
            'extra_student_blocks' => 0,
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
            'subtotal_amount' => 99000,
            'amount' => 99000,
            'payment_status' => 'unpaid',
            'status' => 'active',
            'activated_at' => now(),
        ]);

        $this->patchJson("/api/super-admin/akademi/{$akademi->id}/subscriptions/{$subscription->id}/payment", [
            'subtotal_amount' => 99000,
            'payment_status' => 'paid',
            'payment_method' => 'Transfer',
            'payment_proof_url' => 'https://example.com/proof.webp',
        ])->assertOk()
            ->assertJsonPath('subscription.discount_amount', '0.00')
            ->assertJsonPath('subscription.amount', '99000.00')
            ->assertJsonPath('subscription.payment_status', 'paid');

        $this->assertDatabaseCount('subscriptions', 1);
    }

    public function test_suspending_akademi_revokes_tokens_respecting_user_morph_class(): void
    {
        \Illuminate\Database\Eloquent\Relations\Relation::morphMap([
            'custom_user' => User::class,
        ]);

        try {
            $akademi = Akademi::create([
                'name' => 'Morph Test Academy',
                'slug' => 'morph-test',
                'sport_type' => 'taekwondo',
                'status' => 'active',
                'plan' => 'starter',
            ]);

            $user = User::factory()->akademiAdmin($akademi->id)->create();
            $token = $user->createToken('test-token');

            $this->assertSame('custom_user', $token->accessToken->tokenable_type);
            $this->assertDatabaseHas('personal_access_tokens', ['id' => $token->accessToken->id]);

            // Suspend akademi
            $this->putJson("/api/super-admin/akademi/{$akademi->id}", [
                'status' => 'suspended',
            ])->assertOk();

            // Token must be revoked
            $this->assertDatabaseMissing('personal_access_tokens', ['id' => $token->accessToken->id]);
        } finally {
            \Illuminate\Database\Eloquent\Relations\Relation::morphMap([], false);
        }
    }
}
