<?php

namespace App\Models;

use App\Enums\RankSystem;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SportRank extends Model
{
    public const LEVEL_TYPES = ['geup', 'kyu', 'poom', 'dan'];

    public const BELT_COLORS = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'red', 'black', 'red_black'];

    protected $fillable = [
        'akademi_id',
        'sport_type',
        'rank_system',
        'code',
        'label',
        'sequence',
        'level_type',
        'level_number',
        'belt_color',
        'stripe_color',
    ];

    protected function casts(): array
    {
        return [
            'sequence' => 'integer',
            'level_number' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (SportRank $rank) {
            if ($rank->rank_system !== null) {
                return;
            }

            $akademiSystem = $rank->akademi_id
                ? Akademi::query()->whereKey($rank->akademi_id)->value('rank_system')
                : null;

            $rank->rank_system = $akademiSystem ?? RankSystem::defaultForSport($rank->sport_type)?->value;
        });
    }

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }

    /**
     * Sabuk yang terlihat oleh satu akademi: katalog bawaan sistemnya + sabuk tambahan miliknya.
     */
    public function scopeVisibleTo(Builder $query, Akademi $akademi): Builder
    {
        return $query
            ->where('sport_type', $akademi->sport_type)
            ->where('rank_system', $akademi->rank_system)
            ->where(fn (Builder $q) => $q->whereNull('akademi_id')->orWhere('akademi_id', $akademi->id));
    }
}
