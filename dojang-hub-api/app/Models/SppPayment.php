<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SppPayment extends Model
{
    protected $fillable = [
        'akademi_id',
        'spp_bill_id',
        'amount',
        'paid_at',
        'method',
        'proof_url',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'date',
        ];
    }

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }

    public function bill(): BelongsTo
    {
        return $this->belongsTo(SppBill::class, 'spp_bill_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
