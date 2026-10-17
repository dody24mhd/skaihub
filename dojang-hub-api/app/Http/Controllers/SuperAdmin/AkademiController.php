<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Akademi;
use App\Models\User;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Laravel\Sanctum\PersonalAccessToken;

class AkademiController extends Controller
{
    public function __construct(private readonly SubscriptionService $subscriptions) {}

    public function index(Request $request): JsonResponse
    {
        $query = Akademi::withCount('users');

        if ($request->filled('search')) {
            $operator = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';

            $query->where('name', $operator, '%'.$request->search.'%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('plan')) {
            $query->where('plan', $request->plan);
        }

        $akademi = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($akademi);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['nullable', 'string', 'max:100', 'unique:akademi,slug', 'regex:/^[a-z0-9-]+$/'],
            'sport_type' => ['nullable', 'string', 'max:50'],
            'logo_url' => ['nullable', 'string', 'max:500'],
            'plan' => ['nullable', Rule::in(['starter', 'pro', 'scale'])],
            'plan_expires_at' => ['nullable', 'required_if:duration_type,custom', 'date', 'after_or_equal:starts_at'],
            'duration_type' => ['nullable', Rule::in(['trial', 'monthly', 'quarterly', 'semester', 'yearly', 'custom'])],
            'starts_at' => ['nullable', 'date'],
            'extra_student_blocks' => ['nullable', 'integer', 'min:0'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'payment_status' => ['nullable', Rule::in(['unpaid', 'paid', 'waived', 'refunded'])],
            'notes' => ['nullable', 'string', 'max:1000'],
            'ketua_name' => ['required', 'string', 'max:255'],
            'ketua_email' => ['required', 'email', 'unique:users,email'],
            'ketua_password' => ['required', 'string', 'min:8'],
            'admin_name' => ['nullable', 'required_with:admin_email,admin_password', 'string', 'max:255'],
            'admin_email' => ['nullable', 'required_with:admin_name,admin_password', 'email', 'unique:users,email'],
            'admin_password' => ['nullable', 'required_with:admin_name,admin_email', 'string', 'min:8'],
        ]);

        $slug = $request->slug ?? Str::slug($request->name);

        if (Akademi::where('slug', $slug)->exists()) {
            $slug = $slug.'-'.Str::random(4);
        }

        return DB::transaction(function () use ($request, $slug): JsonResponse {
            $plan = $request->plan ?? 'starter';

            $akademi = Akademi::create([
                'name' => $request->name,
                'slug' => $slug,
                'sport_type' => $request->sport_type ?? 'taekwondo',
                'logo_url' => $request->logo_url,
                'plan' => $plan,
                'status' => 'active',
            ]);

            $ketua = User::create([
                'akademi_id' => $akademi->id,
                'name' => $request->ketua_name,
                'email' => $request->ketua_email,
                'password' => Hash::make($request->ketua_password),
                'role' => 'ketua_akademi',
                'is_active' => true,
            ]);

            $admin = null;

            if ($request->filled('admin_name')) {
                $admin = User::create([
                    'akademi_id' => $akademi->id,
                    'name' => $request->admin_name,
                    'email' => $request->admin_email,
                    'password' => Hash::make($request->admin_password),
                    'role' => 'admin_akademi',
                    'is_active' => true,
                ]);
            }

            $subscription = $this->subscriptions->createInitial(
                $akademi,
                $request->only([
                    'plan',
                    'duration_type',
                    'starts_at',
                    'plan_expires_at',
                    'extra_student_blocks',
                    'amount',
                    'payment_status',
                    'notes',
                ]),
                $request->user()?->id,
            );

            return response()->json([
                'akademi' => $akademi,
                'subscription' => $subscription,
                'ketua' => $this->userSummary($ketua),
                'admin' => $admin ? $this->userSummary($admin) : null,
            ], 201);
        });
    }

    public function show(int $id): JsonResponse
    {
        $akademi = Akademi::with([
            'users' => fn ($q) => $q->select('id', 'akademi_id', 'name', 'email', 'role', 'is_active', 'created_at'),
            'subscriptions' => fn ($q) => $q->latest('starts_at')->latest(),
        ])
            ->withCount([
                'users',
                'users as ketua_akademi_count' => fn ($q) => $q->where('role', 'ketua_akademi'),
                'users as admin_akademi_count' => fn ($q) => $q->where('role', 'admin_akademi'),
                'users as pelatih_count' => fn ($q) => $q->where('role', 'pelatih'),
            ])
            ->findOrFail($id);

        $subscription = $this->subscriptions->activeForAkademi($akademi);

        return response()->json([
            'akademi' => $akademi,
            'subscription' => $subscription,
            'entitlements' => $this->subscriptions->entitlements($subscription),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $akademi = Akademi::findOrFail($id);

        $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'slug' => ['sometimes', 'string', 'max:100', Rule::unique('akademi', 'slug')->ignore($id), 'regex:/^[a-z0-9-]+$/'],
            'sport_type' => ['sometimes', 'string', 'max:50'],
            'logo_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'status' => ['sometimes', Rule::in(['active', 'inactive', 'suspended'])],
        ]);

        $akademi->update($request->only([
            'name', 'slug', 'sport_type', 'logo_url', 'status',
        ]));

        if ($request->filled('status') && in_array($request->status, ['inactive', 'suspended'], true)) {
            PersonalAccessToken::whereIn('tokenable_id', $akademi->users()->select('id'))
                ->where('tokenable_type', (new User)->getMorphClass())
                ->delete();
        }

        return response()->json(['akademi' => $akademi->fresh()]);
    }

    public function destroy(int $id): JsonResponse
    {
        $akademi = Akademi::findOrFail($id);

        PersonalAccessToken::whereIn('tokenable_id', $akademi->users()->select('id'))
            ->where('tokenable_type', (new User)->getMorphClass())
            ->delete();

        $akademi->delete();

        return response()->json(['message' => 'Akademi berhasil dihapus.']);
    }

    private function userSummary(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ];
    }
}
