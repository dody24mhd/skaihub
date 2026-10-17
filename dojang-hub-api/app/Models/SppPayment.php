<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SppPayment extends Model
{
    protected $fillable = [
        'akademi_id',
        'receipt_number',
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

    public static function nextReceiptNumber(int $akademiId, string $paidAt): string
    {
        $prefix = 'KW-'.Carbon::parse($paidAt)->format('Ym').'-';

        $last = self::query()
            ->where('akademi_id', $akademiId)
            ->where('receipt_number', 'like', $prefix.'%')
            ->orderByRaw('LENGTH(receipt_number) DESC')
            ->orderByDesc('receipt_number')
            ->value('receipt_number');

        $sequence = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
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
