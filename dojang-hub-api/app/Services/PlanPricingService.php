<?php

namespace App\Services;

class PlanPricingService
{
    public function subscriptionSubtotal(string $plan, string $durationType): int
    {
        $monthlyPrice = match ($plan) {
            'pro' => 199000,
            'scale' => 349000,
            default => 99000,
        };

        $months = match ($durationType) {
            'quarterly' => 3,
            'semester' => 6,
            'yearly' => 12,
            default => 1,
        };

        return $monthlyPrice * $months;
    }
}
