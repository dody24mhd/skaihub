<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    protected $fillable = [
        'akademi_id',
        'plan',
        'duration_type',
        'duration_months',
        'included_student_limit',
        'extra_student_blocks',
        'starts_at',
        'ends_at',
        'subtotal_amount',
        'discount_amount',
        'amount',
        'payment_status',
        'payment_method',
        'payment_proof_url',
        'status',
        'activated_at',
        'cancelled_at',
        'created_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'activated_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'amount' => 'decimal:2',
            'subtotal_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'duration_months' => 'integer',
            'included_student_limit' => 'integer',
            'extra_student_blocks' => 'integer',
        ];
    }

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function totalStudentLimit(): int
    {
        return $this->included_student_limit + ($this->extra_student_blocks * 50);
    }
}
