<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EvaluationPeriod extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'akademi_id',
        'name',
        'starts_at',
        'ends_at',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'date',
            'ends_at' => 'date',
        ];
    }

    public function akademi(): BelongsTo
    {
        return $this->belongsTo(Akademi::class);
    }

    public function scores(): HasMany
    {
        return $this->hasMany(StudentEvaluationScore::class);
    }

    public function aspects(): HasMany
    {
        return $this->hasMany(EvaluationAspect::class);
    }
}
