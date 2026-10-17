<?php

namespace Tests\Feature;

use App\Models\AcademyPublicProfile;
use App\Models\Akademi;
use App\Models\Subscription;
use App\Models\User;
use App\Services\SubscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubscriptionLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private SubscriptionService $subscriptions;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(now()->setDate(2026, 10, 1)->setTime(9, 0));
        $this->subscriptions = app(SubscriptionService::class);
    }

    private function akademi(string $slug = 'siklus-academy'): Akademi
    {
        return Akademi::create([
            'name' => 'Siklus Academy',
            'slug' => $slug,
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'starter',
        ]);
    }

    private function monthlySubscription(Akademi $akademi): Subscription
    {
        return $this->subscriptions->createInitial($akademi, [
            'plan' => 'starter',
            'duration_type' => 'monthly',
        ]);
    }

    public function test_state_is_active_when_more_than_fourteen_days_left(): void
    {
        $akademi = $this->akademi();
        $this->monthlySubscription($akademi);

        $lifecycle = $this->subscriptions->lifecycle($akademi);

        $this->assertSame('active', $lifecycle['state']);
        $this->assertSame(30, $lifecycle['days_left']);
    }

    public function test_state_is_expiring_within_fourteen_days_of_end(): void
    {
        $akademi = $this->akademi();
        $this->monthlySubscription($akademi);

        $this->travelTo(now()->setDate(2026, 10, 17));

        $lifecycle = $this->subscriptions->lifecycle($akademi);
        $this->assertSame('expiring', $lifecycle['state']);
        $this->assertSame(14, $lifecycle['days_left']);
    }

    public function test_state_is_grace_up_to_seven_days_after_end(): void
    {
        $akademi = $this->akademi();
        $this->monthlySubscription($akademi);

        $this->travelTo(now()->setDate(2026, 11, 3));
        $this->assertSame('grace', $this->subscriptions->lifecycleState($akademi));
        $this->assertSame(4, $this->subscriptions->lifecycle($akademi)['days_left']);

        $this->travelTo(now()->setDate(2026, 11, 7));
        $this->assertSame('grace', $this->subscriptions->lifecycleState($akademi));
    }

    public function test_state_is_read_only_more_than_seven_days_after_end(): void
    {
        $akademi = $this->akademi();
        $this->monthlySubscription($akademi);

        $this->travelTo(now()->setDate(2026, 11, 8));

        $this->assertSame('read_only', $this->subscriptions->lifecycleState($akademi));
    }

    public function test_state_is_read_only_without_any_subscription(): void
    {
        $this->assertSame('read_only', $this->subscriptions->lifecycleState($this->akademi()));
    }

    public function test_renewal_already_recorded_keeps_state_active(): void
    {
        $akademi = $this->akademi();
        $this->monthlySubscription($akademi);
        $this->subscriptions->createForAkademi($akademi, [
            'plan' => 'starter',
            'duration_type' => 'monthly',
            'starts_at' => '2026-11-01',
        ]);

        $this->travelTo(now()->setDate(2026, 10, 25));

        $lifecycle = $this->subscriptions->lifecycle($akademi);
        $this->assertSame('active', $lifecycle['state']);
        $this->assertSame(36, $lifecycle['days_left']);
    }

    public function test_cancelled_subscription_is_ignored(): void
    {
        $akademi = $this->akademi();
        $this->monthlySubscription($akademi)->update(['status' => 'cancelled']);

        $this->assertSame('read_only', $this->subscriptions->lifecycleState($akademi));
    }

    public function test_recording_new_subscription_lifts_read_only(): void
    {
        $akademi = $this->akademi();
        $this->monthlySubscription($akademi);
        $this->travelTo(now()->setDate(2026, 12, 1));
        $this->assertSame('read_only', $this->subscriptions->lifecycleState($akademi));

        $this->subscriptions->createForAkademi($akademi, ['plan' => 'starter', 'duration_type' => 'monthly']);

        $this->assertSame('active', $this->subscriptions->lifecycleState($akademi));
    }

    public function test_read_only_akademi_cannot_write(): void
    {
        $akademi = $this->akademi();
        $this->monthlySubscription($akademi);
        $this->travelTo(now()->setDate(2026, 12, 1));
        Sanctum::actingAs(User::factory()->akademiAdmin($akademi->id)->create());

        $this->postJson('/api/akademi/training-places', ['name' => 'Dojang Baru'])
            ->assertStatus(402)
            ->assertJsonPath('subscription_state', 'read_only')
            ->assertJsonPath('message', 'Langganan akademi sudah berakhir. Data tetap bisa dilihat dan diekspor, tetapi tidak bisa diubah sampai pembayaran perpanjangan dicatat.');

        $this->assertDatabaseCount('training_places', 0);
    }

    public function test_read_only_akademi_can_still_read_and_export(): void
    {
        $akademi = $this->akademi();
        $this->monthlySubscription($akademi);
        $this->travelTo(now()->setDate(2026, 12, 1));
        Sanctum::actingAs(User::factory()->akademiAdmin($akademi->id)->create());

        $this->getJson('/api/akademi/training-places')->assertOk();
        $this->getJson('/api/akademi/students')->assertOk();
        $this->get('/api/akademi/exports/students')->assertOk();
        $this->getJson('/api/akademi/me')
            ->assertOk()
            ->assertJsonPath('subscription_state', 'read_only');
    }

    public function test_grace_akademi_can_still_write(): void
    {
        $akademi = $this->akademi();
        $this->monthlySubscription($akademi);
        $this->travelTo(now()->setDate(2026, 11, 4));
        Sanctum::actingAs(User::factory()->akademiAdmin($akademi->id)->create());

        $this->postJson('/api/akademi/training-places', ['name' => 'Dojang Baru'])
            ->assertCreated();
    }

    public function test_read_only_does_not_affect_super_admin_routes(): void
    {
        $akademi = $this->akademi();
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->postJson("/api/super-admin/akademi/{$akademi->id}/subscriptions", [
            'plan' => 'starter',
            'duration_type' => 'monthly',
        ])->assertCreated();
    }

    public function test_read_only_of_other_akademi_does_not_block_active_akademi(): void
    {
        $expired = $this->akademi('expired-academy');
        $active = $this->akademi('active-academy');
        $this->monthlySubscription($active);
        Sanctum::actingAs(User::factory()->akademiAdmin($active->id)->create());

        $this->assertSame('read_only', $this->subscriptions->lifecycleState($expired));
        $this->postJson('/api/akademi/training-places', ['name' => 'Dojang Aktif'])
            ->assertCreated();
    }

    public function test_me_includes_subscription_state_and_quota_usage(): void
    {
        $akademi = $this->akademi();
        $this->subscriptions->createInitial($akademi, [
            'plan' => 'pro',
            'duration_type' => 'monthly',
            'extra_student_blocks' => 1,
        ]);
        $akademi->siswa()->create([
            'member_number' => 'MBR-1',
            'name' => 'Siswa Aktif',
            'gender' => 'male',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-01-01',
            'height_cm' => 150,
            'weight_kg' => 45,
            'status' => 'active',
        ]);
        $this->travelTo(now()->setDate(2026, 10, 20));
        Sanctum::actingAs(User::factory()->akademiAdmin($akademi->id)->create());

        $this->getJson('/api/akademi/me')
            ->assertOk()
            ->assertJsonPath('subscription_state', 'expiring')
            ->assertJsonPath('days_left', 11)
            ->assertJsonPath('effective_student_limit', 250)
            ->assertJsonPath('active_students', 1);
    }

    private function proAkademiWithPublishedProfile(): Akademi
    {
        $akademi = $this->akademi('publik-academy');
        $this->subscriptions->createInitial($akademi, ['plan' => 'pro', 'duration_type' => 'monthly']);
        AcademyPublicProfile::create([
            'akademi_id' => $akademi->id,
            'about' => 'Profil publik kami',
            'is_published' => true,
        ]);

        return $akademi;
    }

    public function test_grace_keeps_student_quota_from_last_subscription(): void
    {
        $akademi = $this->akademi();
        $this->monthlySubscription($akademi);
        $this->travelTo(now()->setDate(2026, 11, 3));
        Sanctum::actingAs(User::factory()->akademiAdmin($akademi->id)->create());

        $this->assertSame('grace', $this->subscriptions->lifecycleState($akademi));
        $this->assertSame(100, $this->subscriptions->entitlements($this->subscriptions->entitledSubscription($akademi))['student_limit']);

        $this->postJson('/api/akademi/students', [
            'name' => 'Siswa Masa Tenggang',
            'gender' => 'male',
            'guardian_name' => 'Wali Siswa',
            'guardian_phone' => '081200000001',
            'birth_date' => '2014-01-01',
            'joined_date' => '2026-11-03',
            'height_cm' => 150,
            'weight_kg' => 45,
            'status' => 'active',
        ])->assertCreated();

        $this->getJson('/api/akademi/me')
            ->assertOk()
            ->assertJsonPath('subscription_state', 'grace')
            ->assertJsonPath('effective_student_limit', 100)
            ->assertJsonPath('subscription.plan', 'starter');
    }

    public function test_grace_keeps_public_page_visible(): void
    {
        $this->proAkademiWithPublishedProfile();
        $this->travelTo(now()->setDate(2026, 11, 3));

        $this->getJson('/api/public/akademi/publik-academy')->assertOk();
    }

    public function test_read_only_hides_public_page_and_drops_entitlements(): void
    {
        $akademi = $this->proAkademiWithPublishedProfile();
        $this->travelTo(now()->setDate(2026, 11, 8));

        $this->assertNull($this->subscriptions->entitledSubscription($akademi));
        $this->getJson('/api/public/akademi/publik-academy')
            ->assertNotFound()
            ->assertJsonPath('message', 'Halaman publik tidak tersedia untuk paket ini.');
    }
}
