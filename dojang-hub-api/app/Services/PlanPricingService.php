<?php

namespace App\Services;

class PlanPricingService
{
    public function plan(string $plan): array
    {
        $plans = config('skaihub.plans');

        return $plans[$plan] ?? $plans[config('skaihub.default_plan')];
    }

    public function monthlyPrice(string $plan): int
    {
        return (int) $this->plan($plan)['monthly_price'];
    }

    public function includedStudents(string $plan): int
    {
        return (int) $this->plan($plan)['included_students'];
    }

    public function freeExtraBlocks(string $plan): int
    {
        return (int) $this->plan($plan)['free_extra_blocks'];
    }

    public function hasPublicWebsite(string $plan): bool
    {
        return (bool) $this->plan($plan)['public_website'];
    }

    public function blockSize(): int
    {
        return (int) config('skaihub.extra_block_size');
    }

    public function effectiveStudentLimit(string $plan, int $paidBlocks, ?int $includedStudents = null): int
    {
        $included = $includedStudents ?? $this->includedStudents($plan);

        return $included + ($this->freeExtraBlocks($plan) + $paidBlocks) * $this->blockSize();
    }

    /**
     * Harga = harga bulanan × bulan × (1 + persen tambahan × blok berbayar).
     */
    public function subscriptionSubtotal(string $plan, int $months, int $paidBlocks): int
    {
        $percent = 100 + (int) config('skaihub.extra_block_surcharge_percent') * $paidBlocks;

        return (int) round($this->monthlyPrice($plan) * $months * $percent / 100);
    }
}
