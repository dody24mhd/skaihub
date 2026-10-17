<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademyPublicAchievement extends Model
{
    protected $fillable = [
        'akademi_id',
        'title',
        'description',
        'achieved_on',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'achieved_on' => 'date',
            'sort_order' => 'integer',
        ];
    }

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }
}
