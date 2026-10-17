<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademySppSetting extends Model
{
    public const DEFAULT_DUE_DAY = 10;

    protected $fillable = [
        'akademi_id',
        'default_monthly_amount',
        'due_day',
    ];

    protected function casts(): array
    {
        return [
            'default_monthly_amount' => 'decimal:2',
            'due_day' => 'integer',
        ];
    }

    public static function forAkademi(int $akademiId): self
    {
        return self::firstOrNew(
            ['akademi_id' => $akademiId],
            ['default_monthly_amount' => null, 'due_day' => self::DEFAULT_DUE_DAY],
        );
    }

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }
}
