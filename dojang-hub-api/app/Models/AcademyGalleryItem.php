<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademyGalleryItem extends Model
{
    protected $fillable = [
        'akademi_id',
        'image_url',
        'caption',
        'show_on_about',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'show_on_about' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }
}
