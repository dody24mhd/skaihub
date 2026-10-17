<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademyPublicHeroImage extends Model
{
    protected $fillable = [
        'akademi_id',
        'image_url',
        'caption',
        'focal_x',
        'focal_y',
        'pan_x',
        'pan_y',
        'zoom',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'focal_x' => 'integer',
            'focal_y' => 'integer',
            'pan_x' => 'integer',
            'pan_y' => 'integer',
            'zoom' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }
}
