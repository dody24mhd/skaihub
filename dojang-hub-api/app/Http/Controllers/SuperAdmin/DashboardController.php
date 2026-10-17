<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Akademi;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class DashboardController extends Controller
{
    private const ATTENTION_ORDER = ['read_only' => 0, 'grace' => 1, 'expiring' => 2];

    public function __construct(private readonly SubscriptionService $subscriptions) {}

    public function index(): JsonResponse
    {
        $rows = Akademi::query()
            ->where('status', 'active')
            ->with('subscriptions')
            ->withCount(['siswa as active_students' => fn ($query) => $query->where('status', 'active')])
            ->orderBy('name')
            ->get()
            ->map(fn (Akademi $akademi) => $this->row($akademi));

        return response()->json([
            'mrr' => (int) round($rows->sum('monthly_revenue')),
            'state_counts' => collect(['active', 'expiring', 'grace', 'read_only'])
                ->mapWithKeys(fn (string $state) => [$state => $rows->where('state', $state)->count()]),
            'attention' => $this->attention($rows),
            'near_quota' => $this->nearQuota($rows),
        ]);
    }

    private function row(Akademi $akademi): array
    {
        $lifecycle = $this->subscriptions->lifecycleFromSubscriptions($akademi->subscriptions);
        $current = $lifecycle['current'];
        $limit = $this->subscriptions->entitlements($lifecycle['entitled'])['student_limit'];

        return [
            'akademi_id' => $akademi->id,
            'akademi_name' => $akademi->name,
            'akademi_slug' => $akademi->slug,
            'plan' => $current?->plan ?? $akademi->plan,
            'state' => $lifecycle['state'],
            'days_left' => $lifecycle['days_left'],
            'ends_at' => $lifecycle['ends_at']?->toIso8601String(),
            'monthly_revenue' => $current ? $this->subscriptions->monthlyRevenue($current) : 0,
            'active_students' => (int) $akademi->active_students,
            'student_limit' => $limit,
            'usage_percent' => $limit > 0 ? intdiv($akademi->active_students * 100, $limit) : 0,
        ];
    }

    private function attention(Collection $rows): Collection
    {
        return $rows
            ->filter(fn (array $row) => isset(self::ATTENTION_ORDER[$row['state']]))
            ->sortBy([
                fn (array $a, array $b) => self::ATTENTION_ORDER[$a['state']] <=> self::ATTENTION_ORDER[$b['state']],
                fn (array $a, array $b) => $a['days_left'] <=> $b['days_left'],
            ])
            ->map(fn (array $row) => collect($row)->except(['monthly_revenue', 'usage_percent'])->all())
            ->values();
    }

    private function nearQuota(Collection $rows): Collection
    {
        $threshold = (int) config('skaihub.quota_warning_percent');

        return $rows
            ->filter(fn (array $row) => $row['student_limit'] > 0 && $row['usage_percent'] >= $threshold)
            ->sortByDesc('usage_percent')
            ->map(fn (array $row) => collect($row)->only([
                'akademi_id', 'akademi_name', 'akademi_slug', 'plan', 'active_students', 'student_limit', 'usage_percent',
            ])->all())
            ->values();
    }
}
