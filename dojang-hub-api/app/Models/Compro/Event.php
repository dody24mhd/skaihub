<?php

namespace App\Models\Compro;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'events';

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'description',
        'cover_image_url',
        'location',
        'organizer_name',
        'registration_url',
        'status',
        'category',
        'is_featured',
        'starts_at',
        'ends_at',
        'published_at',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'published_at' => 'datetime',
    ];
}
