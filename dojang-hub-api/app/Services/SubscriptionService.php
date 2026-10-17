<?php

namespace App\Services;

use App\Models\Akademi;
use App\Models\Student;
use App\Models\Subscription;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubscriptionService
{
    private const LIVE_STATUSES = ['trialing', 'active', 'past_due'];

    private const COUNTED_STATUSES = [...self::LIVE_STATUSES, 'expired'];

    public function __construct(private readonly PlanPricingService $pricing) {}

    public function createInitial(Akademi $akademi, array $data, ?int $createdBy = null): Subscription
    {
        return $this->createForAkademi($akademi, $data, $createdBy, expireCurrent: false);
    }

    public function createForAkademi(
        Akademi $akademi,
        array $data,
        ?int $createdBy = null,
        bool $expireCurrent = true,
    ): Subscription {
        return DB::transaction(function () use ($akademi, $data, $createdBy, $expireCurrent): Subscription {
            $plan = $data['plan'] ?? 'starter';
            $durationType = $data['duration_type'] ?? (! empty($data['plan_expires_at']) ? 'custom' : 'monthly');
            [$durationMonths, $startsAt, $endsAt] = $this->period(
                $durationType,
                $data['starts_at'] ?? null,
                $data['ends_at'] ?? $data['plan_expires_at'] ?? null,
            );

            if ($expireCurrent && $startsAt->lessThanOrEqualTo(now())) {
                $akademi->subscriptions()
                    ->whereIn('status', ['trialing', 'active', 'past_due'])
                    ->where('starts_at', '<=', $startsAt)
                    ->where('ends_at', '>=', $startsAt)
                    ->update(['status' => 'expired']);
            }

            $extraBlocks = (int) ($data['extra_student_blocks'] ?? 0);
            $subtotalAmount = $this->resolveSubtotal($data, $plan, $durationType, $durationMonths, $startsAt, $endsAt, $extraBlocks);

            $subscription = Subscription::create([
                'akademi_id' => $akademi->id,
                'plan' => $plan,
                'duration_type' => $durationType,
                'duration_months' => $durationMonths,
                'included_student_limit' => $this->includedStudentLimit($plan),
                'extra_student_blocks' => $extraBlocks,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'subtotal_amount' => $subtotalAmount,
                'discount_amount' => 0,
                'amount' => $subtotalAmount,
                'payment_status' => $data['payment_status'] ?? 'unpaid',
                'payment_method' => $data['payment_method'] ?? null,
                'payment_proof_url' => $data['payment_proof_url'] ?? null,
                'status' => $durationType === 'trial' ? 'trialing' : 'active',
                'activated_at' => now(),
                'created_by' => $createdBy,
                'notes' => $data['notes'] ?? null,
            ]);

            $this->syncAkademiSnapshot($akademi, $this->activeForAkademi($akademi) ?? $subscription);

            return $subscription;
        });
    }

    public function activeForAkademi(Akademi|int $akademi): ?Subscription
    {
        $akademiId = $akademi instanceof Akademi ? $akademi->id : $akademi;

        return Subscription::where('akademi_id', $akademiId)
            ->whereIn('status', ['trialing', 'active', 'past_due'])
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->latest('starts_at')
            ->latest()
            ->first();
    }

    /**
     * Langganan yang menentukan entitlement: berjalan, akan habis, atau masa tenggang
     * (langganan terakhir). Saat baca-saja tidak ada entitlement.
     */
    public function entitledSubscription(Akademi $akademi): ?Subscription
    {
        return $this->lifecycle($akademi)['entitled'];
    }

    public function assertCanAddActiveStudent(Akademi $akademi, ?int $ignoreStudentId = null): void
    {
        $subscription = $this->entitledSubscription($akademi);
        $limit = $this->entitlements($subscription)['student_limit'];

        $activeCount = $this->activeStudentCount($akademi, $ignoreStudentId);

        if ($activeCount >= $limit) {
            throw ValidationException::withMessages([
                'status' => ["Kuota siswa aktif paket Anda ({$limit}) sudah penuh. Hubungi SKAIHUB untuk menambah kuota."],
            ]);
        }
    }

    public function activeStudentCount(Akademi $akademi, ?int $ignoreStudentId = null): int
    {
        return Student::where('akademi_id', $akademi->id)
            ->where('status', 'active')
            ->when($ignoreStudentId !== null, fn ($query) => $query->where('id', '!=', $ignoreStudentId))
            ->count();
    }

    /**
     * active → expiring (≤ renewal_warning_days) → grace (habis ≤ grace_days) → read_only.
     *
     * @return array{state: string, days_left: int, ends_at: ?CarbonImmutable, current: ?Subscription, entitled: ?Subscription}
     */
    public function lifecycle(Akademi $akademi): array
    {
        return $this->lifecycleFromSubscriptions(
            Subscription::where('akademi_id', $akademi->id)->whereIn('status', self::COUNTED_STATUSES)->get(),
        );
    }

    /**
     * @param  Collection<int, Subscription>  $subscriptions  langganan satu akademi
     * @return array{state: string, days_left: int, ends_at: ?CarbonImmutable, current: ?Subscription, entitled: ?Subscription}
     */
    public function lifecycleFromSubscriptions(Collection $subscriptions): array
    {
        $now = CarbonImmutable::now();
        $today = $now->startOfDay();
        $counted = $subscriptions->whereIn('status', self::COUNTED_STATUSES);
        $live = $counted->whereIn('status', self::LIVE_STATUSES);
        $current = $live->first(fn (Subscription $s) => $s->starts_at <= $now && $s->ends_at >= $now);

        if ($current) {
            $lastDay = $this->lastCoveredDay($live, $current);
            $daysLeft = (int) $today->diffInDays($lastDay);
            $state = $daysLeft <= (int) config('skaihub.renewal_warning_days') ? 'expiring' : 'active';

            return ['state' => $state, 'days_left' => $daysLeft, 'ends_at' => $lastDay->endOfDay(), 'current' => $current, 'entitled' => $current];
        }

        $previous = $counted->filter(fn (Subscription $s) => $s->ends_at < $now)->sortByDesc('ends_at')->first();

        if (! $previous) {
            return ['state' => 'read_only', 'days_left' => 0, 'ends_at' => null, 'current' => null, 'entitled' => null];
        }

        $lastDay = $this->lastDayOf($previous);
        $graceLeft = (int) config('skaihub.grace_days') - (int) $lastDay->diffInDays($today);
        $inGrace = $graceLeft >= 0;

        return [
            'state' => $inGrace ? 'grace' : 'read_only',
            'days_left' => max(0, $graceLeft),
            'ends_at' => $lastDay->endOfDay(),
            'current' => null,
            'entitled' => $inGrace ? $previous : null,
        ];
    }

    public function monthlyRevenue(Subscription $subscription): float
    {
        $months = $subscription->duration_months
            ?? max(1, (int) round(CarbonImmutable::parse($subscription->starts_at)->diffInMonths($subscription->ends_at)));

        return (float) $subscription->amount / $months;
    }

    public function lifecycleState(Akademi $akademi): string
    {
        return $this->lifecycle($akademi)['state'];
    }

    public function updatePayment(Subscription $subscription, array $data): Subscription
    {
        $subtotalAmount = (float) ($data['subtotal_amount'] ?? $data['amount'] ?? $subscription->subtotal_amount);

        $subscription->update([
            'subtotal_amount' => $subtotalAmount,
            'discount_amount' => 0,
            'amount' => $subtotalAmount,
            'payment_status' => $data['payment_status'] ?? $subscription->payment_status,
            'payment_method' => $data['payment_method'] ?? $subscription->payment_method,
            'payment_proof_url' => $data['payment_proof_url'] ?? $subscription->payment_proof_url,
            'notes' => $data['notes'] ?? $subscription->notes,
        ]);

        return $subscription->fresh();
    }

    public function entitlements(?Subscription $subscription): array
    {
        if (! $subscription) {
            return [
                'student_limit' => 0,
                'has_public_website' => false,
                'has_subdomain' => false,
                'has_rapor' => false,
                'has_exam_events' => false,
                'has_parent_portal' => false,
            ];
        }

        $plan = $subscription->plan;

        return [
            'student_limit' => $subscription->totalStudentLimit(),
            'has_public_website' => $this->pricing->hasPublicWebsite($plan),
            'has_subdomain' => $this->pricing->hasPublicWebsite($plan),
            'has_rapor' => true,
            'has_exam_events' => false,
            'has_parent_portal' => false,
        ];
    }

    public function includedStudentLimit(string $plan): int
    {
        return $this->pricing->includedStudents($plan);
    }

    public function calculatedSubtotal(
        string $plan,
        string $durationType,
        ?int $durationMonths,
        CarbonImmutable $startsAt,
        CarbonImmutable $endsAt,
        int $paidBlocks,
    ): int {
        if ($durationType === 'trial') {
            return 0;
        }

        $months = $durationMonths ?? max(1, (int) round($startsAt->diffInMonths($endsAt)));

        return $this->pricing->subscriptionSubtotal($plan, $months, $paidBlocks);
    }

    public function period(string $durationType, ?string $startsAtInput, ?string $endsAtInput): array
    {
        $startsAt = $startsAtInput
            ? CarbonImmutable::parse($startsAtInput)->startOfDay()
            : CarbonImmutable::now()->startOfDay();

        $durationMonths = match ($durationType) {
            'monthly' => 1,
            'quarterly' => 3,
            'semester' => 6,
            'yearly' => 12,
            default => null,
        };

        $endsAt = match ($durationType) {
            'trial' => $startsAt->addDays(14),
            'monthly', 'quarterly', 'semester', 'yearly' => $startsAt->addMonthsNoOverflow($durationMonths),
            default => $endsAtInput
                ? CarbonImmutable::parse($endsAtInput)->endOfDay()
                : $startsAt->addMonthNoOverflow(),
        };

        return [$durationMonths, $startsAt, $endsAt];
    }

    /**
     * Ikuti perpanjangan yang sudah dicatat dan menyambung tanpa jeda.
     *
     * @param  Collection<int, Subscription>  $live
     */
    private function lastCoveredDay(Collection $live, Subscription $current): CarbonImmutable
    {
        $lastDay = $this->lastDayOf($current);

        while ($next = $live->first(fn (Subscription $s) => $s->starts_at <= $lastDay->addDay()->endOfDay()
            && $s->ends_at > $lastDay->addDay()->startOfDay())) {
            $lastDay = $this->lastDayOf($next);
        }

        return $lastDay;
    }

    private function lastDayOf(Subscription $subscription): CarbonImmutable
    {
        return CarbonImmutable::parse($subscription->ends_at)->subSecond()->startOfDay();
    }

    private function resolveSubtotal(
        array $data,
        string $plan,
        string $durationType,
        ?int $durationMonths,
        CarbonImmutable $startsAt,
        CarbonImmutable $endsAt,
        int $paidBlocks,
    ): float {
        $calculated = $this->calculatedSubtotal($plan, $durationType, $durationMonths, $startsAt, $endsAt, $paidBlocks);
        $manual = $data['subtotal_amount'] ?? $data['amount'] ?? null;

        if ($manual === null || $manual === '') {
            return (float) $calculated;
        }

        if (round((float) $manual, 2) !== (float) $calculated && blank($data['notes'] ?? null)) {
            throw ValidationException::withMessages([
                'notes' => ['Catatan wajib diisi bila nominal berbeda dari harga otomatis.'],
            ]);
        }

        return (float) $manual;
    }

    private function syncAkademiSnapshot(Akademi $akademi, Subscription $subscription): void
    {
        $akademi->update([
            'plan' => $subscription->plan,
            'plan_expires_at' => $subscription->ends_at,
        ]);
    }
}
