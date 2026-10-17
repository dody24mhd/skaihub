<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CoachProfile extends Model
{
    protected $fillable = [
        'user_id',
        'akademi_id',
        'phone',
        'license_number',
        'rank_label',
        'photo_url',
        'joined_date',
        'address',
        'status',
        'show_on_public',
    ];

    protected function casts(): array
    {
        return [
            'joined_date' => 'date',
            'show_on_public' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }
}
