<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Akademi;
use App\Models\Subscription;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubscriptionController extends Controller
{
    public function __construct(private readonly SubscriptionService $subscriptions)
    {
    }

    public function index(Akademi $akademi): JsonResponse
    {
        return response()->json([
            'data' => $akademi->subscriptions()
                ->latest('starts_at')
                ->latest()
                ->get(),
        ]);
    }

    public function store(Request $request, Akademi $akademi): JsonResponse
    {
        $request->validate([
            'plan' => ['required', Rule::in(['starter', 'pro', 'scale'])],
            'duration_type' => ['required', Rule::in(['trial', 'monthly', 'quarterly', 'semester', 'yearly', 'custom'])],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'required_if:duration_type,custom', 'date', 'after_or_equal:starts_at'],
            'extra_student_blocks' => ['nullable', 'integer', 'min:0'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'payment_status' => ['nullable', Rule::in(['unpaid', 'paid', 'waived', 'refunded'])],
            'payment_method' => ['nullable', 'string', 'max:100'],
            'payment_proof_url' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $subscription = $this->subscriptions->createForAkademi(
            $akademi,
            $request->only([
                'plan',
                'duration_type',
                'starts_at',
                'ends_at',
                'extra_student_blocks',
                'amount',
                'payment_status',
                'payment_method',
                'payment_proof_url',
                'notes',
            ]),
            $request->user()?->id,
        );

        return response()->json(['subscription' => $subscription], 201);
    }

    public function updatePayment(Request $request, Akademi $akademi, Subscription $subscription): JsonResponse
    {
        abort_unless($subscription->akademi_id === $akademi->id, 404);

        $request->validate([
            'amount' => ['nullable', 'numeric', 'min:0'],
            'subtotal_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_status' => ['nullable', Rule::in(['unpaid', 'paid', 'waived', 'refunded'])],
            'payment_method' => ['nullable', 'string', 'max:100'],
            'payment_proof_url' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        return response()->json([
            'subscription' => $this->subscriptions->updatePayment(
                $subscription,
                $request->only([
                    'amount',
                    'subtotal_amount',
                    'payment_status',
                    'payment_method',
                    'payment_proof_url',
                    'notes',
                ]),
            ),
        ]);
    }
}
