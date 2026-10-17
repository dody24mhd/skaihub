<?php

namespace Tests\Feature;

use App\Models\Akademi;
use App\Models\User;
use App\Services\PlanPricingService;
use App\Services\SubscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubscriptionPricingTest extends TestCase
{
    use RefreshDatabase;

    private PlanPricingService $pricing;

    protected function setUp(): void
    {
        parent::setUp();

        $this->pricing = app(PlanPricingService::class);
    }

    private function akademi(string $slug = 'harga-academy'): Akademi
    {
        return Akademi::create([
            'name' => 'Harga Academy',
            'slug' => $slug,
            'sport_type' => 'taekwondo',
            'status' => 'active',
            'plan' => 'starter',
        ]);
    }

    public function test_subtotal_without_paid_blocks_is_monthly_price_times_months(): void
    {
        $this->assertSame(99000, $this->pricing->subscriptionSubtotal('starter', 1, 0));
        $this->assertSame(597000, $this->pricing->subscriptionSubtotal('pro', 3, 0));
    }

    public function test_each_paid_block_adds_fifteen_percent_of_monthly_price(): void
    {
        $this->assertSame(113850, $this->pricing->subscriptionSubtotal('starter', 1, 1));
        $this->assertSame(258700, $this->pricing->subscriptionSubtotal('pro', 1, 2));
    }

    public function test_multi_month_subtotal_with_paid_blocks(): void
    {
        $this->assertSame(2722200, $this->pricing->subscriptionSubtotal('scale', 6, 2));
        $this->assertSame(1366200, $this->pricing->subscriptionSubtotal('starter', 12, 1));
    }

    public function test_pricing_reads_values_from_config(): void
    {
        config(['skaihub.plans.starter.monthly_price' => 100000, 'skaihub.extra_block_surcharge_percent' => 20]);

        $this->assertSame(120000, $this->pricing->subscriptionSubtotal('starter', 1, 1));
    }

    public function test_effective_student_limit_includes_one_free_block_for_every_plan(): void
    {
        $this->assertSame(100, $this->pricing->effectiveStudentLimit('starter', 0));
        $this->assertSame(200, $this->pricing->effectiveStudentLimit('pro', 0));
        $this->assertSame(350, $this->pricing->effectiveStudentLimit('scale', 0));
        $this->assertSame(150, $this->pricing->effectiveStudentLimit('starter', 1));
    }

    public function test_subscription_entitlement_uses_effective_limit(): void
    {
        $subscriptions = app(SubscriptionService::class);
        $subscription = $subscriptions->createInitial($this->akademi(), [
            'plan' => 'pro',
            'duration_type' => 'monthly',
            'extra_student_blocks' => 1,
        ]);

        $this->assertSame(150, $subscription->included_student_limit);
        $this->assertSame(250, $subscriptions->entitlements($subscription)['student_limit']);
    }

    public function test_super_admin_subscription_subtotal_is_filled_automatically(): void
    {
        $akademi = $this->akademi();
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->postJson("/api/super-admin/akademi/{$akademi->id}/subscriptions", [
            'plan' => 'pro',
            'duration_type' => 'quarterly',
            'extra_student_blocks' => 1,
        ])->assertCreated()
            ->assertJsonPath('subscription.subtotal_amount', '686550.00')
            ->assertJsonPath('subscription.amount', '686550.00');
    }

    public function test_trial_subscription_is_free(): void
    {
        $akademi = $this->akademi();
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->postJson("/api/super-admin/akademi/{$akademi->id}/subscriptions", [
            'plan' => 'starter',
            'duration_type' => 'trial',
        ])->assertCreated()
            ->assertJsonPath('subscription.amount', '0.00');
    }

    public function test_manual_amount_different_from_calculated_price_requires_notes(): void
    {
        $akademi = $this->akademi();
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->postJson("/api/super-admin/akademi/{$akademi->id}/subscriptions", [
            'plan' => 'starter',
            'duration_type' => 'monthly',
            'amount' => 50000,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('notes');

        $this->postJson("/api/super-admin/akademi/{$akademi->id}/subscriptions", [
            'plan' => 'starter',
            'duration_type' => 'monthly',
            'amount' => 50000,
            'notes' => 'Diskon perkenalan.',
        ])->assertCreated()
            ->assertJsonPath('subscription.amount', '50000.00');
    }

    public function test_manual_amount_equal_to_calculated_price_does_not_need_notes(): void
    {
        $akademi = $this->akademi();
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->postJson("/api/super-admin/akademi/{$akademi->id}/subscriptions", [
            'plan' => 'starter',
            'duration_type' => 'monthly',
            'amount' => 99000,
        ])->assertCreated();
    }

    public function test_akademi_user_cannot_create_subscription(): void
    {
        $akademi = $this->akademi();
        Sanctum::actingAs(User::factory()->akademiAdmin($akademi->id)->create());

        $this->postJson("/api/super-admin/akademi/{$akademi->id}/subscriptions", [
            'plan' => 'starter',
            'duration_type' => 'monthly',
        ])->assertForbidden();
    }
}
