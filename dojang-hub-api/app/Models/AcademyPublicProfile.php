<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademyPublicProfile extends Model
{
    protected $fillable = [
        'akademi_id',
        'about',
        'vision',
        'mission',
        'public_schedule',
        'whatsapp',
        'cta_label',
        'is_published',
        'primary_color',
        'button_color',
        'background_color',
        'text_color',
        'heading_font',
        'body_font',
        'button_radius',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'button_radius' => 'integer',
        ];
    }

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }

    public function galleryItems(): HasMany
    {
        return $this->hasMany(AcademyGalleryItem::class, 'akademi_id', 'akademi_id')
            ->orderBy('sort_order');
    }

    public function heroImages(): HasMany
    {
        return $this->hasMany(AcademyPublicHeroImage::class, 'akademi_id', 'akademi_id')
            ->orderBy('sort_order');
    }

    public function achievements(): HasMany
    {
        return $this->hasMany(AcademyPublicAchievement::class, 'akademi_id', 'akademi_id')
            ->orderBy('sort_order');
    }

    public function officials(): HasMany
    {
        return $this->hasMany(AcademyPublicOfficial::class, 'akademi_id', 'akademi_id')
            ->orderBy('sort_order');
    }
}
