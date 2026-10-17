<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SportRank extends Model
{
    protected $fillable = [
        'akademi_id',
        'sport_type',
        'code',
        'label',
        'sequence',
    ];

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }
}
