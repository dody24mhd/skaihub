<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SppBillEvent extends Model
{
    public const TYPE_CREATED = 'created';

    public const TYPE_PAYMENT = 'payment';

    public const TYPE_WAIVED = 'waived';

    protected $fillable = [
        'akademi_id',
        'spp_bill_id',
        'type',
        'amount',
        'user_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public static function record(SppBill $bill, string $type, float|string|null $amount, ?int $userId, ?string $notes = null): self
    {
        return self::create([
            'akademi_id' => $bill->akademi_id,
            'spp_bill_id' => $bill->id,
            'type' => $type,
            'amount' => $amount,
            'user_id' => $userId,
            'notes' => $notes,
        ]);
    }

    public function bill(): BelongsTo
    {
        return $this->belongsTo(SppBill::class, 'spp_bill_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
