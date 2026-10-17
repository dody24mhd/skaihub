<?php

namespace Tests;

use App\Models\Akademi;
use App\Models\Subscription;
use App\Services\SubscriptionService;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function giveActiveSubscription(Akademi $akademi, string $plan = 'pro'): Subscription
    {
        return app(SubscriptionService::class)->createInitial($akademi, [
            'plan' => $plan,
            'duration_type' => 'yearly',
        ]);
    }
}
